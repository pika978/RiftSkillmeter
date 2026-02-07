"""
WebSocket Consumer for Interview Audio Streaming

Handles real-time bidirectional audio streaming between:
- Frontend (user's microphone)
- Gemini Live API (conversational AI)
- Tavus CVI (avatar video)

Flow:
1. User speaks → Frontend sends audio via WebSocket
2. Send audio to Gemini Live API
3. Receive AI response audio from Gemini
4. Send AI audio to Tavus for avatar lip-sync
5. Tavus streams video to frontend via Daily.co
"""

import asyncio
import base64
import logging
import json
from datetime import datetime
from typing import Optional

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from .models import AIInterviewSession, InterviewTranscriptEntry
from .interview_services import (
    get_tavus_client,
    get_gemini_client,
    create_gemini_client,
    parse_cv,
    build_interview_prompt,
    build_summary_prompt
)

logger = logging.getLogger(__name__)


class InterviewAudioConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time interview audio streaming.
    
    Protocol:
        Client → Server:
            - Audio chunks (binary, PCM 16kHz)
            - Control messages (JSON): {"type": "end_turn"}
        
        Server → Client:
            - Status updates (JSON): {"type": "status", "message": "..."}
            - Errors (JSON): {"type": "error", "message": "..."}
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.session_id: Optional[str] = None
        self.session: Optional[dict] = None
        self.gemini_client = None
        self.tavus_client = None
        self.is_connected = False
    
    async def connect(self):
        """Handle WebSocket connection."""
        # Extract session ID from URL
        self.session_id = self.scope['url_route']['kwargs'].get('session_id')
        
        if not self.session_id:
            await self.close(code=4000)
            return
        
        # Get session from database
        @database_sync_to_async
        def get_session():
            return AIInterviewSession.objects.filter(session_id=self.session_id).first()
        
        self.session = await get_session()
        if not self.session:
            logger.error(f"Session {self.session_id} not found")
            await self.close(code=4004)
            return
        
        # Accept connection
        await self.accept()
        
        try:
            # Get clients
            self.gemini_client = get_gemini_client(str(self.session_id))
            self.tavus_client = get_tavus_client()
            
            if not self.gemini_client:
                await self.send_error("Gemini client not initialized")
                await self.close()
                return
            
            # Connect to Gemini Live API
            await self.gemini_client.connect(self.session.system_prompt)
            
            self.is_connected = True
            logger.info(f"WebSocket connected for session {self.session_id}")
            
            # Send ready status
            await self.send_status("connected", "Ready to start interview")
            
            # Try to initialize Tavus avatar (optional - requires payment)
            avatar_url = None
            try:
                if self.tavus_client:
                    # Create persona for this interview
                    persona = await self.tavus_client.create_persona(
                        name=f"Interview_{self.session_id[:8]}",
                        system_prompt=self.session.system_prompt
                    )
                    
                    # Create conversation to get video URL
                    conversation = await self.tavus_client.create_conversation(
                        persona_id=persona.get("persona_id")
                    )
                    
                    avatar_url = conversation.get("conversation_url")
                    self.session.tavus_conversation_id = conversation.get("conversation_id")
                    
                    # Save to database
                    @database_sync_to_async
                    def save_tavus_id():
                        self.session.save(update_fields=["tavus_conversation_id"])
                    await save_tavus_id()
                    
                    logger.info(f"Tavus avatar ready: {avatar_url}")
            except Exception as e:
                logger.warning(f"Tavus not available (optional): {e}")
                avatar_url = None
            
            # Send avatar URL to frontend (if available)
            if avatar_url:
                await self.send(text_data=json.dumps({
                    'type': 'avatar',
                    'url': avatar_url,
                    'status': 'ready'
                }))
            else:
                # No avatar - audio only mode
                await self.send(text_data=json.dumps({
                    'type': 'avatar',
                    'url': None,
                    'status': 'unavailable',
                    'message': 'Avatar not available - audio only mode'
                }))
            
            # Start initial greeting from Gemini
            await self.gemini_client.send_text(
                "Start the interview with your greeting.",
                end_of_turn=True
            )
            
            # Start receiving loop
            asyncio.create_task(self._receive_from_gemini())
            
        except Exception as e:
            logger.error(f"Connection error: {e}", exc_info=True)
            await self.send_error(str(e))
            await self.close()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        self.is_connected = False
        
        if self.gemini_client:
            try:
                await self.gemini_client.disconnect()
            except Exception as e:
                logger.warning(f"Error disconnecting Gemini: {e}")
        
        logger.info(f"WebSocket disconnected for session {self.session_id}")
    
    async def receive(self, text_data=None, bytes_data=None):
        """
        Handle incoming messages from client.
        
        - Binary data = audio chunks
        - Text data = control messages
        """
        try:
            if bytes_data:
                # Audio data received
                await self._handle_audio(bytes_data)
            
            elif text_data:
                # Control message
                message = json.loads(text_data)
                msg_type = message.get('type')
                
                if msg_type == 'end_turn' or msg_type == 'end_of_turn':
                    # User finished speaking
                    await self._handle_end_turn()
                
                elif msg_type == 'ping':
                    # Keepalive
                    await self.send_json({'type': 'pong'})
                
                else:
                    logger.warning(f"Unknown message type: {msg_type}")
        
        except Exception as e:
            logger.error(f"Error handling message: {e}", exc_info=True)
            await self.send_error(str(e))
    
    async def _handle_audio(self, audio_bytes: bytes):
        """Send user audio to Gemini."""
        if not self.gemini_client or not self.is_connected:
            return
        
        try:
            # Send to Gemini (don't signal end_of_turn yet)
            await self.gemini_client.send_audio(
                audio_bytes,
                end_of_turn=False
            )
            
            # Log to transcript (optional)
            # self.session["transcript"].append({
            #     "timestamp": datetime.now().isoformat(),
            #     "speaker": "candidate",
            #     "audio_length": len(audio_bytes)
            # })
            
        except Exception as e:
            logger.error(f"Error sending audio to Gemini: {e}")
            await self.send_error("Failed to process audio")
    
    async def _handle_end_turn(self):
        """Signal to Gemini that user finished speaking."""
        if not self.gemini_client or not self.is_connected:
            return
        
        try:
            # Signal end of turn
            await self.gemini_client.send_audio(b'', end_of_turn=True)
            await self.send_status("processing", "Processing your response...")
            
        except Exception as e:
            logger.error(f"Error signaling end of turn: {e}")
    
    async def _receive_from_gemini(self):
        """
        Receive audio responses from Gemini and forward to frontend.
        Also tries to send to Tavus for avatar animation if available.
        Runs in background loop.
        """
        try:
            async for audio_data in self.gemini_client.receive_audio():
                if not self.is_connected:
                    break
                
                # Convert audio bytes to base64 for WebSocket transmission
                audio_b64 = base64.b64encode(audio_data).decode('utf-8')
                
                # ALWAYS send audio directly to frontend for playback
                try:
                    await self.send(text_data=json.dumps({
                        'type': 'audio',
                        'audio': audio_b64,
                        'format': 'pcm',
                        'sample_rate': 24000  # Gemini outputs 24kHz audio
                    }))
                    logger.info(f"📤 Sent audio to frontend ({len(audio_data)} bytes)")
                except Exception as e:
                    logger.error(f"Error sending audio to frontend: {e}")
                
                # Also try to send audio to Tavus for avatar animation (optional)
                try:
                    if self.tavus_client and self.session.tavus_conversation_id:
                        await self.tavus_client.send_audio(
                            conversation_id=self.session.tavus_conversation_id,
                            audio_base64=audio_b64
                        )
                except Exception as e:
                    # Tavus may not be configured or may require payment
                    logger.debug(f"Tavus not available: {e}")
                
                # Notify frontend that avatar is speaking
                await self.send_status("speaking", "Interviewer is responding")
                
                # Log to transcript database (async save)
                try:
                    @database_sync_to_async
                    def create_transcript_entry():
                        InterviewTranscriptEntry.objects.create(
                            session=self.session,
                            speaker='ai',
                            text='',  # Audio only
                            audio_data=audio_data[:1000],  # Sample only
                            sequence_number=self.session.transcript_entries.count()
                        )
                    
                    await create_transcript_entry()
                except Exception as e:
                    logger.warning(f"Could not save transcript: {e}")
        
        except Exception as e:
            logger.error(f"Error in Gemini receive loop: {e}", exc_info=True)
            if self.is_connected:
                await self.send_error("Lost connection to AI")
    
    async def send_status(self, status: str, message: str):
        """Send status update to client."""
        await self.send(text_data=json.dumps({
            'type': 'status',
            'status': status,
            'message': message
        }))
    
    async def send_error(self, error: str):
        """Send error message to client."""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'error': error
        }))
    
    async def send_json(self, data: dict):
        """Send JSON message to client."""
        await self.send(text_data=json.dumps(data))
