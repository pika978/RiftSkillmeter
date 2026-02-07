# AI Interview Services Package
"""
Services for AI Interview feature:
- tavus_client: Tavus CVI integration for avatar video
- gemini_live: Gemini Live API for conversational AI  
- cv_parser: CV/Resume text extraction
- prompt_builder: System prompt construction
- interview_config: Configuration management
"""

from .tavus_client import TavusClient, TavusConfig, get_tavus_client
from .gemini_live import GeminiLiveClient, GeminiLiveConfig, get_gemini_client, create_gemini_client
from .cv_parser import CVParser, parse_cv, get_cv_parser
from .prompt_builder import build_interview_prompt, build_summary_prompt
from .interview_config import InterviewConfig, get_interview_config
from .feedback_generator import generate_interview_feedback

__all__ = [
    # Tavus
    "TavusClient",
    "TavusConfig", 
    "get_tavus_client",
    # Gemini
    "GeminiLiveClient",
    "GeminiLiveConfig",
    "get_gemini_client",
    "create_gemini_client",
    # CV Parser
    "CVParser",
    "parse_cv",
    "get_cv_parser",
    # Prompt Builder
    "build_interview_prompt",
    "build_summary_prompt",
    # Feedback Generator
    "generate_interview_feedback",
    # Config
    "InterviewConfig",
    "get_interview_config",
]
