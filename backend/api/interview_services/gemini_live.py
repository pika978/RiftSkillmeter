"""
Gemini Live API Client - Vertex AI WebSocket Implementation

Handles real-time audio streaming with Google's Gemini via Vertex AI.
Uses service account authentication and direct WebSocket connection.

Based on BharatVaani's production implementation.

Features:
- WebSocket-based real-time communication with Vertex AI
- Service account authentication
- Native audio input/output (PCM format)
- Maintains conversation context via session

API Reference: https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/live-api
"""

import os
import asyncio
import logging
import base64
import json
from typing import Optional, Dict, Any, AsyncGenerator
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Import WebSockets
try:
    import websockets
    WEBSOCKETS_AVAILABLE = True
except ImportError:
    WEBSOCKETS_AVAILABLE = False
    logger.error("websockets not installed. Run: pip install websockets")

# Import auth helper
try:
    from .oauth2_helper import get_auth_manager
    AUTH_AVAILABLE = True
except ImportError:
    AUTH_AVAILABLE = False
    logger.error("OAuth2 helper not available")


@dataclass
class GeminiLiveConfig:
    """Configuration for Vertex AI Gemini Live API."""
    project_id: Optional[str] = None
    location: str = "us-central1"
    model_name: str = "gemini-2.0-flash-exp"
    
    def __post_init__(self):
        # Load from environment if not provided
        if not self.project_id:
            self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        if not self.location:
            self.location = os.getenv("VERTEX_AI_LOCATION", "us-central1")
        if not self.model_name:
            self.model_name = os.getenv("MODEL_NAME", "gemini-2.0-flash-exp")


class GeminiLiveClient:
    """
    Client for Vertex AI Gemini Live API using WebSockets.
    
    Uses service account authentication and connects directly to
    Vertex AI WebSocket endpoint (not google-genai package).
    """
    
    def __init__(self, config: Optional[GeminiLiveConfig] = None):
        """Initialize Gemini Live client with Vertex AI configuration."""
        if not WEBSOCKETS_AVAILABLE:
            raise RuntimeError(
                "websockets package not installed. "
                "Run: pip install websockets"
            )
        
        if not AUTH_AVAILABLE:
            raise RuntimeError(
                "Authentication helper not available. "
                "Ensure oauth2_helper.py exists"
            )
        
        if config is None:
            config = GeminiLiveConfig()
        
        self.config = config
        
        # Validate configuration
        if not self.config.project_id:
            raise ValueError(
                "GOOGLE_CLOUD_PROJECT not set in environment. "
                "Please add to .env file"
            )
        
        # Get service account authentication
        logger.info("Initializing Vertex AI Gemini Live client")
        try:
            self.auth_manager = get_auth_manager()
            self.access_token = self.auth_manager.get_access_token()
            logger.info(f"✅ Authenticated with {self.auth_manager.auth_method}")
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            raise RuntimeError(
                "Failed to authenticate. "
                "Please ensure service-account-key.json exists in backend/"
            )
        
        # WebSocket connection
        self.ws = None
        self.is_connected = False
        self._system_prompt = ""
        
        # Build Vertex AI WebSocket URL
        self.vertex_url = (
            f"wss://{self.config.location}-aiplatform.googleapis.com/ws/"
            f"google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent"
        )
        
        logger.info(f"Vertex AI URL: {self.vertex_url}")
        logger.info(f"Project: {self.config.project_id}")
        logger.info(f"Model: {self.config.model_name}")
    
    async def connect(self, system_prompt: str) -> bool:
        """
        Establish WebSocket connection to Vertex AI.
        
        Args:
            system_prompt: Interview instructions and context
        
        Returns:
            bool: True if connected successfully
        """
        try:
            self._system_prompt = system_prompt
            
            logger.info("Connecting to Vertex AI Gemini Live...")
            
            # Create WebSocket connection with auth header
            self.ws = await websockets.connect(
                self.vertex_url,
                additional_headers={
                    'Authorization': f'Bearer {self.access_token}',
                    'Content-Type': 'application/json'
                }
            )
            
            logger.info("✅ WebSocket connected to Vertex AI")
            
            # Send setup message
            await self._send_setup()
            
            self.is_connected = True
            logger.info("✅ Gemini Live session initialized")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to Vertex AI: {e}")
            self.is_connected = False
            raise
    
    async def _send_setup(self):
        """Send initial setup message to Vertex AI."""
        setup_message = {
            "setup": {
                "model": f"projects/{self.config.project_id}/locations/{self.config.location}/publishers/google/models/{self.config.model_name}",
                "generation_config": {
                    "response_modalities": ["AUDIO"]
                },
                "system_instruction": {
                    "parts": [{
                        "text": self._system_prompt
                    }]
                }
            }
        }
        
        await self.ws.send(json.dumps(setup_message))
        logger.info("📤 Setup message sent to Vertex AI")
    
    async def send_audio(self, audio_data: bytes, end_of_turn: bool = False) -> bool:
        """
        Send audio chunk to Gemini Live.
        
        Args:
            audio_data: Raw PCM audio bytes (16kHz, mono)
            end_of_turn: If True, signals end of user turn (triggers AI response)
        
        Returns:
            bool: True if sent successfully
        """
        if not self.is_connected or not self.ws:
            logger.error("Not connected to Gemini")
            return False
        
        try:
            # Encode audio to base64
            audio_b64 = base64.b64encode(audio_data).decode('utf-8')
            
            # Create realtimeInput message (Vertex AI format)
            message = {
                "realtimeInput": {
                    "mediaChunks": [{
                        "data": audio_b64,
                        "mimeType": "audio/pcm"
                    }]
                }
            }
            
            await self.ws.send(json.dumps(message))
            logger.debug(f"📤 Sent audio chunk ({len(audio_data)} bytes)")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to send audio: {e}")
            return False
    
    async def receive_audio(self) -> AsyncGenerator[bytes, None]:
        """
        Receive audio responses from Gemini Live.
        
        Yields:
            bytes: Audio data (raw PCM bytes)
        """
        if not self.is_connected or not self.ws:
            logger.error("Not connected to Gemini")
            return
        
        try:
            async for message in self.ws:
                try:
                    data = json.loads(message)
                    logger.debug(f"📥 Received message from Vertex AI")
                    
                    # Check for serverContent with audio
                    if "serverContent" in data:
                        server_content = data["serverContent"]
                        
                        if "modelTurn" in server_content:
                            model_turn = server_content["modelTurn"]
                            
                            if "parts" in model_turn:
                                for part in model_turn["parts"]:
                                    # Check for inline audio data
                                    if "inlineData" in part:
                                        inline_data = part["inlineData"]
                                        
                                        if inline_data.get("mimeType") in ["audio/pcm", "audio/wav"]:
                                            # Decode base64 audio
                                            audio_b64 = inline_data.get("data", "")
                                            audio_bytes = base64.b64decode(audio_b64)
                                            
                                            # Yield raw bytes for backward compatibility
                                            yield audio_bytes
                                    
                                    # Check for text response (log it but don't yield)
                                    elif "text" in part:
                                        logger.info(f"📝 AI text: {part['text'][:100]}...")
                    
                    # Check for setup complete or other status messages
                    elif "setupComplete" in data or "setup" in data:
                        logger.info("✅ Setup acknowledged by Vertex AI")
                        # Don't yield - just log
                    
                    # Handle errors
                    elif "error" in data:
                        logger.error(f"Vertex AI error: {data['error']}")
                        # Raise exception for errors
                        raise RuntimeError(f"Vertex AI error: {data['error']}")
                
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse message: {e}")
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
        
        except websockets.exceptions.ConnectionClosed as e:
            logger.warning(f"Connection closed: {e.code} - {e.reason}")
            self.is_connected = False
        except Exception as e:
            logger.error(f"Error receiving audio: {e}")
            self.is_connected = False
    
    async def send_text(self, text: str, end_of_turn: bool = True) -> bool:
        """
        Send text message to Gemini (will be converted to speech).
        
        Args:
            text: Text message to send
            end_of_turn: If True, signals end of user turn (triggers AI response)
        
        Returns:
            bool: True if sent successfully
        """
        if not self.is_connected or not self.ws:
            logger.error("Not connected to Gemini")
            return False
        
        try:
            message = {
                "clientContent": {
                    "turns": [{
                        "role": "user",
                        "parts": [{
                            "text": text
                        }]
                    }],
                    "turnComplete": end_of_turn
                }
            }
            
            await self.ws.send(json.dumps(message))
            logger.info(f"📤 Sent text: {text[:50]}...")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to send text: {e}")
            return False
    
    async def disconnect(self) -> bool:
        """
        Close WebSocket connection.
        
        Returns:
            bool: True if disconnected successfully
        """
        try:
            if self.ws:
                await self.ws.close()
                logger.info("Disconnected from Vertex AI")
            
            self.is_connected = False
            self.ws = None
            
            return True
            
        except Exception as e:
            logger.error(f"Error during disconnect: {e}")
            return False
    
    def is_active(self) -> bool:
        """Check if connection is active."""
        return self.is_connected and self.ws is not None


# Helper functions for backward compatibility

# Global client instance (for WebSocket consumer)
_gemini_clients: Dict[str, GeminiLiveClient] = {}


def get_gemini_client(session_id: str) -> Optional[GeminiLiveClient]:
    """
    Get existing Gemini client for a session.
    
    Args:
        session_id: Interview session ID
    
    Returns:
        GeminiLiveClient if exists, None otherwise
    """
    return _gemini_clients.get(session_id)


def create_gemini_client(session_id: str, config: Optional[GeminiLiveConfig] = None) -> GeminiLiveClient:
    """
    Create and register a new Gemini client for a session.
    
    Args:
        session_id: Interview session ID
        config: Optional configuration
    
    Returns:
        New GeminiLiveClient instance
    """
    client = GeminiLiveClient(config)
    _gemini_clients[session_id] = client
    return client


def remove_gemini_client(session_id: str) -> None:
    """
    Remove Gemini client for a session.
    
    Args:
        session_id: Interview session ID
    """
    if session_id in _gemini_clients:
        del _gemini_clients[session_id]
