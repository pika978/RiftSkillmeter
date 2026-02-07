import json
import logging
import os
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import InterviewSession
from .services import GeminiInterviewService, LiveKitService  # Old services.py

logger = logging.getLogger(__name__)


class InterviewConsumer(AsyncWebsocketConsumer):
    """
    WebSocket Consumer for real-time Mock Interview sessions.
    Handles session initialization, question generation, and analysis.
    """
    
    async def connect(self):
        self.session_id = None
        self.topic = None
        self.level = None
        self.duration = None
        self.conversation_history = []
        self.transcript = ""
        
        await self.accept()
        logger.info("Interview WebSocket connected")
    
    async def disconnect(self, close_code):
        logger.info(f"Interview WebSocket disconnected: {close_code}")
    
    async def receive(self, text_data):
        """
        Handle incoming WebSocket messages.
        Expected message types:
        - INIT_SESSION: Start a new interview
        - USER_ANSWER: Process user's spoken answer
        - END_SESSION: Generate final report
        """
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'INIT_SESSION':
                await self.handle_init_session(data)
            elif message_type == 'USER_ANSWER':
                await self.handle_user_answer(data)
            elif message_type == 'END_SESSION':
                await self.handle_end_session(data)
            else:
                await self.send_error(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON payload")
        except Exception as e:
            logger.error(f"Consumer error: {e}")
            await self.send_error(str(e))
    
    async def handle_init_session(self, data):
        """
        Initialize a new interview session.
        Creates DB record, generates opening question, sends LiveKit token.
        """
        self.topic = data.get('topic', 'Behavioral')
        self.level = data.get('level', 'mid')
        self.duration = int(data.get('duration', 15))
        user_id = data.get('user_id')
        
        # Create database session
        self.session_id = await self.create_db_session(user_id)
        
        # Generate opening question
        opening_question = await database_sync_to_async(
            GeminiInterviewService.generate_question
        )(self.topic, self.level, self.duration, [])
        
        self.conversation_history.append(opening_question)
        self.transcript += f"Interviewer: {opening_question}\n"
        
        # Generate LiveKit token for user
        room_name = f"interview_{self.session_id}"
        livekit_token = await database_sync_to_async(
            LiveKitService.create_token
        )(room_name, f"user_{user_id}")
        
        # Determine LiveKit URL (Prioritize Env, then Mock)
        env_livekit_url = os.getenv('LIVEKIT_URL')
        livekit_url = env_livekit_url or 'wss://mock.livekit.cloud'

        # Send initialization response
        await self.send(text_data=json.dumps({
            'type': 'SESSION_READY',
            'session_id': self.session_id,
            'opening_question': opening_question,
            'livekit_token': livekit_token,
            'livekit_url': livekit_url
        }))
    
    async def handle_user_answer(self, data):
        """
        Process user's answer and generate next question.
        """
        user_answer = data.get('answer', '')
        
        if not user_answer.strip():
            return
        
        # Add to history
        self.conversation_history.append(user_answer)
        self.transcript += f"Candidate: {user_answer}\n"
        
        # Generate next question
        next_question = await database_sync_to_async(
            GeminiInterviewService.generate_question
        )(self.topic, self.level, self.duration, self.conversation_history)
        
        self.conversation_history.append(next_question)
        self.transcript += f"Interviewer: {next_question}\n"
        
        # Send next question
        await self.send(text_data=json.dumps({
            'type': 'NEXT_QUESTION',
            'question': next_question
        }))
    
    async def handle_end_session(self, data):
        """
        End interview and analyze performance.
        """
        # Generate analysis
        analysis = await database_sync_to_async(
            GeminiInterviewService.analyze_interview
        )(self.topic, self.transcript)
        
        # Save to database
        await self.save_analysis(analysis)
        
        # Send report to frontend
        await self.send(text_data=json.dumps({
            'type': 'INTERVIEW_REPORT',
            'score': analysis.get('score', 0),
            'feedback': analysis.get('feedback', ''),
            'strengths': analysis.get('strengths', []),
            'weaknesses': analysis.get('weaknesses', []),
            'tips': analysis.get('tips', []),
            'transcript': self.transcript
        }))
    
    @database_sync_to_async
    def create_db_session(self, user_id):
        """Create InterviewSession in database."""
        try:
            user = User.objects.get(id=user_id)
            session = InterviewSession.objects.create(
                user=user,
                topic=self.topic,
                difficulty=self.level,
                duration=self.duration
            )
            return session.id
        except User.DoesNotExist:
            logger.warning(f"User {user_id} not found, creating anonymous session")
            return None
    
    @database_sync_to_async
    def save_analysis(self, analysis):
        """Save analysis results to database."""
        if not self.session_id:
            return
        
        try:
            from django.utils import timezone
            session = InterviewSession.objects.get(id=self.session_id)
            session.score = analysis.get('score', 0)
            session.feedback = analysis.get('feedback', '')
            session.strengths = analysis.get('strengths', [])
            session.weaknesses = analysis.get('weaknesses', [])
            session.transcript = self.transcript
            session.completed_at = timezone.now()
            session.save()
        except InterviewSession.DoesNotExist:
            logger.error(f"Session {self.session_id} not found for saving analysis")
    
    async def send_error(self, message):
        """Send error message to client."""
        await self.send(text_data=json.dumps({
            'type': 'ERROR',
            'message': message
        }))
