"""
Interview API Routes

Django REST endpoints for the AI Interview feature.
Handles session creation, CV upload, and interview completion.
All sessions are persisted to the database.
"""

import uuid
import base64
import logging
from datetime import datetime
from typing import Dict, Optional

from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.files.uploadedfile import UploadedFile
from asgiref.sync import async_to_sync
from django.utils import timezone
import json

from .models import AIInterviewSession, InterviewTranscriptEntry, AIPerformanceReport
from .interview_services import (
    get_tavus_client,
    get_gemini_client,
    create_gemini_client,
    parse_cv,
    build_interview_prompt,
    build_summary_prompt,
    generate_interview_feedback,
    get_interview_config,
)
from .interview_schemas import (
    InterviewLevel,
    StartInterviewRequest,
    StartInterviewResponse,
)

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["POST"])
def start_interview(request: HttpRequest) -> JsonResponse:
    """
    POST /api/interview/start
    
    Initialize a new interview session and save to database.
    Optionally accepts CV file upload.
    
    Request body:
        {
            "skill_topic": "Python Backend",
            "level": "intermediate"
        }
    
    Optional multipart file: cv_file
    
    Returns:
        {
            "session_id": "...",
            "conversation_url": "https://tavus.daily.co/...",
            "status": "ready"
        }
    """
    try:
        # Parse request
        if request.content_type and 'application/json' in request.content_type:
            body = json.loads(request.body)
            skill_topic = body.get('skill_topic')
            level = body.get('level', 'intermediate')
            cv_file = None
        else:
            # Multipart form data
            skill_topic = request.POST.get('skill_topic')
            level = request.POST.get('level', 'intermediate')
            cv_file = request.FILES.get('cv_file')
        
        if not skill_topic:
            return JsonResponse(
                {"error": "skill_topic is required"},
                status=400
            )
        
        # Generate session ID
        session_id = uuid.uuid4()
        
        # Parse CV if provided
        cv_text = ""
        if cv_file:
            cv_bytes = cv_file.read()
            cv_text = parse_cv(cv_bytes, cv_file.name)
            logger.info(f"Parsed CV for session {session_id}: {len(cv_text)} chars")
        
        # Build system prompt
        system_prompt = build_interview_prompt(
            skill_topic=skill_topic,
            level=level,
            cv_text=cv_text
        )
        
        # Try to create Tavus avatar (optional - gracefully degrade if payment required)
        tavus_persona_id = None
        tavus_conversation_id = None
        conversation_url = None
        
        try:
            # Get Tavus client
            tavus_client = get_tavus_client()
            
            # Create Tavus persona with Echo Mode (async call wrapped)
            persona = async_to_sync(tavus_client.create_persona)(
                name=f"Interviewer_{str(session_id)[:8]}",
                system_prompt=system_prompt,
                enable_echo_mode=True
            )
            
            # Create Tavus conversation (async call wrapped)
            conversation = async_to_sync(tavus_client.create_conversation)(
                persona_id=persona["persona_id"],
                conversation_name=f"Interview_{skill_topic}_{str(session_id)[:8]}"
            )
            
            tavus_persona_id = persona["persona_id"]
            tavus_conversation_id = conversation["conversation_id"]
            conversation_url = conversation["conversation_url"]
            
            logger.info(f"Tavus avatar created for session {session_id}")
            
        except Exception as tavus_error:
            # Tavus failed (likely 402 payment required) - continue with audio-only mode
            logger.warning(f"Tavus unavailable (audio-only mode): {tavus_error}")
        
        # Create Gemini client (don't connect yet - wait for WebSocket)
        gemini_client = create_gemini_client(str(session_id))
        
        # Create database session
        # Handle anonymous users (for testing)
        user = request.user if request.user.is_authenticated else None
        
        ai_session = AIInterviewSession.objects.create(
            session_id=session_id,
            user=user,
            skill_topic=skill_topic,
            level=level,
            cv_text=cv_text,
            system_prompt=system_prompt,
            tavus_persona_id=tavus_persona_id,
            tavus_conversation_id=tavus_conversation_id,
            conversation_url=conversation_url,
            status='ready'
        )
        
        logger.info(f"Started interview session {session_id} for topic: {skill_topic}")
        
        return JsonResponse({
            "session_id": str(session_id),
            "conversation_url": conversation_url,
            "status": "ready",
            "audio_only": conversation_url is None
        })
        
    except Exception as e:
        logger.error(f"Failed to start interview: {e}", exc_info=True)
        return JsonResponse(
            {"error": str(e)},
            status=500
        )


@csrf_exempt  
@require_http_methods(["POST"])
def upload_cv(request: HttpRequest, session_id: str) -> JsonResponse:
    """
    POST /api/interview/{session_id}/upload-cv
    
    Upload CV after session creation.
    Multipart file upload.
    """
    try:
        # Get session from database
        ai_session = AIInterviewSession.objects.filter(session_id=session_id).first()
        if not ai_session:
            return JsonResponse(
                {"error": "Session not found"},
                status=404
            )
        
        cv_file = request.FILES.get('cv_file')
        if not cv_file:
            return JsonResponse(
                {"error": "cv_file is required"},
                status=400
            )
        
        # Parse CV
        cv_bytes = cv_file.read()
        cv_text = parse_cv(cv_bytes, cv_file.name)
        
        # Update session
        ai_session.cv_text = cv_text
        
        # Rebuild system prompt with CV
        ai_session.system_prompt = build_interview_prompt(
            skill_topic=ai_session.skill_topic,
            level=ai_session.level,
            cv_text=cv_text
        )
        ai_session.save()
        
        logger.info(f"Updated CV for session {session_id}")
        
        return JsonResponse({
            "status": "cv_uploaded",
            "cv_length": len(cv_text)
        })
        
    except Exception as e:
        logger.error(f"Failed to upload CV: {e}", exc_info=True)
        return JsonResponse(
            {"error": str(e)},
            status=500
        )


@csrf_exempt
@require_http_methods(["POST"])
def end_interview(request: HttpRequest, session_id: str) -> JsonResponse:
    """
    POST /api/interview/{session_id}/end
    
    End the interview and generate summary/feedback.
    
    Returns feedback and performance summary.
    """
    try:
        # Get session from database
        ai_session = AIInterviewSession.objects.filter(session_id=session_id).first()
        if not ai_session:
            return JsonResponse(
                {"error": "Session not found"},
                status=404
            )
        
        # Calculate duration
        ended_at = timezone.now()
        duration_seconds = int((ended_at - ai_session.started_at).total_seconds())
        
        # End Tavus conversation (async call wrapped)
        tavus_client = get_tavus_client()
        async_to_sync(tavus_client.end_conversation)(ai_session.tavus_conversation_id)
        
        # Disconnect Gemini
        gemini_client = get_gemini_client(str(session_id))
        if gemini_client:
            async_to_sync(gemini_client.disconnect)()
        
        # Build transcript from database entries
        transcript_entries = ai_session.transcript_entries.all().order_by('sequence_number')
        transcript_text = "\n".join([
            f"{entry.speaker}: {entry.text}" 
            for entry in transcript_entries 
            if entry.text
        ])
        
        # Default values for performance report
        summary_text = "Interview completed successfully."
        strengths = [
            "Clear communication",
            "Good problem-solving approach",
            "Relevant technical knowledge"
        ]
        improvements = [
            "Practice more complex scenarios",
            "Improve depth of technical explanations",
            "Work on time management during answers"
        ]
        topic_knowledge_score = 7
        communication_score = 7
        problem_solving_score = 6
        
        # If we have a transcript, generate AI summary using Gemini
        if transcript_text:
            summary_prompt = build_summary_prompt(
                skill_topic=ai_session.skill_topic,
                level=ai_session.level,
                transcript=transcript_text
            )
            
            # Generate AI feedback
            ai_feedback = generate_interview_feedback(summary_prompt)
            
            # Use AI-generated values
            summary_text = ai_feedback['performance_summary']
            strengths = ai_feedback['strengths']
            improvements = ai_feedback['improvements']
            topic_knowledge_score = ai_feedback['topic_knowledge_score']
            communication_score = ai_feedback['communication_score']
            problem_solving_score = ai_feedback['problem_solving_score']
        
        # Create performance report in database
        report, created = AIPerformanceReport.objects.get_or_create(
            session=ai_session,
            defaults={
                'performance_summary': summary_text,
                'strengths': strengths,
                'improvements': improvements,
                'topic_knowledge_score': topic_knowledge_score,
                'communication_score': communication_score,
                'problem_solving_score': problem_solving_score,
            }
        )
        
        # Update session status
        ai_session.status = 'ended'
        ai_session.ended_at = ended_at
        ai_session.duration_seconds = duration_seconds
        ai_session.save()
        
        logger.info(f"Ended interview session {session_id}")
        
        return JsonResponse({
            "session_id": str(session_id),
            "status": "completed",
            "duration_seconds": duration_seconds,
            "performance_summary": report.performance_summary,
            "strengths": report.strengths,
            "improvements": report.improvements,
            "topic_knowledge_score": report.topic_knowledge_score,
            "overall_score": report.overall_score
        })
        
    except Exception as e:
        logger.error(f"Failed to end interview: {e}", exc_info=True)
        return JsonResponse(
            {"error": str(e)},
            status=500
        )


@require_http_methods(["GET"])
def get_session_status(request: HttpRequest, session_id: str) -> JsonResponse:
    """
    GET /api/interview/{session_id}/status
    
    Get current status of an interview session.
    """
    ai_session = AIInterviewSession.objects.filter(session_id=session_id).first()
    if not ai_session:
        return JsonResponse(
            {"error": "Session not found"},
            status=404
        )
    
    return JsonResponse({
        "session_id": str(session_id),
        "status": ai_session.status,
        "started_at": ai_session.started_at.isoformat(),
        "ended_at": ai_session.ended_at.isoformat() if ai_session.ended_at else None,
        "skill_topic": ai_session.skill_topic,
        "level": ai_session.level
    })


@require_http_methods(["GET"])
def get_transcript(request: HttpRequest, session_id: str) -> JsonResponse:
    """
    GET /api/interview/{session_id}/transcript
    
    Get full interview transcript.
    """
    ai_session = AIInterviewSession.objects.filter(session_id=session_id).first()
    if not ai_session:
        return JsonResponse(
            {"error": "Session not found"},
            status=404
        )
    
    transcript_entries = ai_session.transcript_entries.all().order_by('sequence_number')
    entries = [
        {
            "speaker": entry.speaker,
            "text": entry.text,
            "timestamp": entry.timestamp.isoformat(),
            "sequence": entry.sequence_number
        }
        for entry in transcript_entries
    ]
    
    return JsonResponse({
        "session_id": str(session_id),
        "entries": entries
    })
