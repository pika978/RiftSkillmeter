"""
Interview Configuration Module

Centralizes all configuration for the AI Interview feature.
Loads settings from environment variables.
"""

import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class InterviewConfig:
    """Configuration settings for AI Interview feature."""
    
    # Tavus CVI API
    tavus_api_key: str
    tavus_base_url: str = "https://tavusapi.com/v2"
    tavus_replica_id: str = ""
    
    # Gemini Live API  
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash-preview-native-audio-dialog"
    
    # Interview Settings
    max_cv_chars: int = 2000
    default_interview_duration_minutes: int = 25
    default_level: str = "intermediate"
    
    @classmethod
    def from_env(cls) -> "InterviewConfig":
        """Load configuration from environment variables."""
        return cls(
            # Tavus
            tavus_api_key=os.getenv("TAVUS_API_KEY", ""),
            tavus_replica_id=os.getenv("TAVUS_REPLICA_ID", ""),
            
            # Gemini
            gemini_api_key=os.getenv("GEMINI_API_KEY", ""),
        )
    
    def validate(self) -> list[str]:
        """
        Validate required configuration.
        Returns list of missing/invalid settings.
        """
        errors = []
        
        if not self.tavus_api_key:
            errors.append("TAVUS_API_KEY is not set")
        
        if not self.gemini_api_key:
            errors.append("GEMINI_API_KEY is not set")
        
        return errors
    
    @property
    def is_valid(self) -> bool:
        """Check if all required config is present."""
        return len(self.validate()) == 0


# Singleton instance
_config: Optional[InterviewConfig] = None


def get_interview_config() -> InterviewConfig:
    """Get the singleton config instance."""
    global _config
    if _config is None:
        _config = InterviewConfig.from_env()
    return _config
