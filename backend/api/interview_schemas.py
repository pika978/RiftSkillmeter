"""
Interview API Schemas

Pydantic models for request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class InterviewLevel(str, Enum):
    """Interview difficulty levels."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class StartInterviewRequest(BaseModel):
    """Request to start a new interview session."""
    skill_topic: str = Field(
        ..., 
        min_length=3,
        max_length=100,
        description="Skill or topic to interview on (e.g., 'Python Backend', 'React')"
    )
    level: InterviewLevel = Field(
        default=InterviewLevel.INTERMEDIATE,
        description="Interview difficulty level"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "skill_topic": "Python Backend Development",
                "level": "intermediate"
            }
        }


class StartInterviewResponse(BaseModel):
    """Response when interview is started."""
    session_id: str = Field(..., description="Unique session ID")
    conversation_url: str = Field(..., description="Daily.co WebRTC room URL for video")
    status: str = Field(default="ready", description="Session status")
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "conversation_url": "https://tavus.daily.co/abc123",
                "status": "ready"
            }
        }


class UploadCVRequest(BaseModel):
    """Metadata for CV upload (file sent as multipart/form-data)."""
    pass


class InterviewSummaryResponse(BaseModel):
    """Summary and feedback after interview completion."""
    session_id: str
    duration_seconds: int
    performance_summary: str
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    topic_knowledge_score: Optional[int] = Field(None, ge=1, le=10)
    communication_score: Optional[int] = Field(None, ge=1, le=10)
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "duration_seconds": 1450,
                "performance_summary": "Strong understanding of Python fundamentals...",
                "strengths": [
                    "Clear explanation of OOP concepts",
                    "Good problem-solving approach"
                ],
                "improvements": [
                    "Could improve knowledge of async programming",
                    "Practice more system design questions"
                ],
                "topic_knowledge_score": 7,
                "communication_score": 8
            }
        }


class TranscriptEntry(BaseModel):
    """Single turn in the interview conversation."""
    timestamp: datetime
    speaker: str  # "interviewer" or "candidate"
    text: Optional[str] = None
    audio_url: Optional[str] = None


class TranscriptResponse(BaseModel):
    """Full interview transcript."""
    session_id: str
    entries: List[TranscriptEntry]
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "entries": [
                    {
                        "timestamp": "2026-02-04T22:30:00",
                        "speaker": "interviewer",
                        "text": "Hello! Tell me about yourself."
                    },
                    {
                        "timestamp": "2026-02-04T22:30:15",
                        "speaker": "candidate",
                        "text": "I'm a backend developer with 3 years..."
                    }
                ]
            }
        }


class SessionStatusResponse(BaseModel):
    """Current status of an interview session."""
    session_id: str
    status: str  # "ready", "active", "ended"
    started_at: datetime
    ended_at: Optional[datetime] = None
    skill_topic: str
    level: InterviewLevel
