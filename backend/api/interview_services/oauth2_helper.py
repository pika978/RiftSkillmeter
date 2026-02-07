"""
Authentication Helper for Gemini Live API

This module handles authentication for accessing Gemini Live API.
Supports both Service Account (recommended for backend) and OAuth2 user flow.

Service Account approach inspired by BharatVaani project.
"""

import os
import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Try to import Google Auth libraries
try:
    from google.auth import default
    from google.auth.transport.requests import Request
    from google.oauth2 import service_account
    from google.oauth2.credentials import Credentials
    GOOGLE_AUTH_AVAILABLE = True
except ImportError:
    GOOGLE_AUTH_AVAILABLE = False
    logger.warning("google-auth not installed. Run: pip install google-auth")

try:
    from google_auth_oauthlib.flow import InstalledAppFlow
    OAUTH_FLOW_AVAILABLE = True
except ImportError:
    OAUTH_FLOW_AVAILABLE = False

# OAuth2 Scopes required for Gemini/Vertex AI
SCOPES = [
    'https://www.googleapis.com/auth/generative-language',
    'https://www.googleapis.com/auth/cloud-platform'
]

# File paths
TOKEN_FILE = Path(__file__).parent.parent / 'token.json'
CLIENT_SECRET_FILE = Path(__file__).parent.parent / 'client_secret.json'
SERVICE_ACCOUNT_FILE = Path(__file__).parent.parent / 'service-account-key.json'


class GeminiAuthManager:
    """
    Manages authentication for Gemini API.
    
    Supports three methods (in order of preference):
    1. Service Account (best for backend services)
    2. OAuth2 user flow (for development/testing)
    3. API Key (limited functionality)
    """
    
    def __init__(
        self,
        service_account_path: Optional[Path] = None,
        client_secret_path: Optional[Path] = None,
        token_path: Optional[Path] = None,
        prefer_service_account: bool = True
    ):
        """
        Initialize authentication manager.
        
        Args:
            service_account_path: Path to service-account-key.json
            client_secret_path: Path to client_secret.json (OAuth2)
            token_path: Path to store/load token.json (OAuth2)
            prefer_service_account: Try service account first if True
        """
        if not GOOGLE_AUTH_AVAILABLE:
            raise ImportError(
                "google-auth libraries not installed. "
                "Run: pip install google-auth google-auth-httplib2"
            )
        
        self.service_account_path = service_account_path or SERVICE_ACCOUNT_FILE
        self.client_secret_path = client_secret_path or CLIENT_SECRET_FILE
        self.token_path = token_path or TOKEN_FILE
        self.prefer_service_account = prefer_service_account
        self.credentials: Optional[Credentials] = None
        self.auth_method: Optional[str] = None
    
    def get_credentials(self) -> Credentials:
        """
        Get valid credentials using the best available method.
        
        Returns:
            Valid Google credentials
        """
        if self.credentials and self.credentials.valid:
            return self.credentials
        
        # Method 1: Service Account (best for backend)
        if self.prefer_service_account and self.service_account_path.exists():
            try:
                logger.info(f"Using Service Account: {self.service_account_path}")
                self.credentials = service_account.Credentials.from_service_account_file(
                    str(self.service_account_path),
                    scopes=SCOPES
                )
                self.auth_method = "service_account"
                logger.info("✅ Service Account authentication successful")
                return self.credentials
            except Exception as e:
                logger.warning(f"Service Account auth failed: {e}")
        
        # Method 2: Application Default Credentials (e.g., from GOOGLE_APPLICATION_CREDENTIALS)
        try:
            logger.info("Trying Application Default Credentials...")
            self.credentials, project = default(scopes=SCOPES)
            self.auth_method = "adc"
            logger.info(f"✅ Using ADC for project: {project}")
            return self.credentials
        except Exception as e:
            logger.debug(f"ADC not available: {e}")
        
        # Method 3: OAuth2 User Flow (for development)
        if OAUTH_FLOW_AVAILABLE:
            return self._get_oauth_credentials()
        
        raise RuntimeError(
            "No authentication method available. Please provide:\n"
            "1. Service account key (recommended): service-account-key.json\n"
            "2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable\n"
            "3. OAuth2 client secret: client_secret.json"
        )
    
    def _get_oauth_credentials(self) -> Credentials:
        """Get credentials via OAuth2 user flow."""
        # Load existing token if available
        if self.token_path.exists():
            try:
                self.credentials = Credentials.from_authorized_user_file(
                    str(self.token_path),
                    SCOPES
                )
                logger.info("Loaded existing OAuth2 token")
            except Exception as e:
                logger.warning(f"Could not load existing token: {e}")
        
        # Refresh or authenticate  
        if not self.credentials or not self.credentials.valid:
            if self.credentials and self.credentials.expired and self.credentials.refresh_token:
                logger.info("Refreshing expired OAuth2 token...")
                try:
                    self.credentials.refresh(Request())
                    logger.info("✅ Token refreshed successfully")
                except Exception as e:
                    logger.error(f"Failed to refresh token: {e}")
                    self.credentials = None
            
            if not self.credentials or not self.credentials.valid:
                if not self.client_secret_path.exists():
                    raise FileNotFoundError(
                        f"OAuth2 client secret not found at: {self.client_secret_path}"
                    )
                
                logger.info("Starting OAuth2 authentication flow...")
                flow = InstalledAppFlow.from_client_secrets_file(
                    str(self.client_secret_path),
                    SCOPES
                )
                
                self.credentials = flow.run_local_server(
                    port=8080,
                    open_browser=True,
                    success_message='Authentication successful! You can close this window.'
                )
                logger.info("✅ OAuth2 authentication successful")
            
            # Save credentials
            self._save_oauth_credentials()
        
        self.auth_method = "oauth2"
        return self.credentials
    
    def _save_oauth_credentials(self):
        """Save OAuth2 credentials to token file."""
        if not self.credentials:
            return
        
        try:
            with open(self.token_path, 'w') as token_file:
                token_file.write(self.credentials.to_json())
            logger.info(f"Saved OAuth2 token to {self.token_path}")
        except Exception as e:
            logger.error(f"Failed to save token: {e}")
    
    def get_access_token(self) -> str:
        """
        Get a valid access token.
        
        Returns:
            Bearer token string
        """
        creds = self.get_credentials()
        
        # Ensure token is fresh
        if hasattr(creds, 'expired') and creds.expired:
            creds.refresh(Request())
            if self.auth_method == "oauth2":
                self._save_oauth_credentials()
        
        # For service accounts, get token explicitly
        if hasattr(creds, 'token') and creds.token:
            return creds.token
        
        # Force token refresh for service accounts
        if not hasattr(creds, 'token') or not creds.token:
            creds.refresh(Request())
        
        return creds.token


# Global auth manager instance
_auth_manager: Optional[GeminiAuthManager] = None


def get_auth_manager() -> GeminiAuthManager:
    """Get or create the global authentication manager."""
    global _auth_manager
    if _auth_manager is None:
        _auth_manager = GeminiAuthManager()
    return _auth_manager


def get_access_token() -> str:
    """
    Convenience function to get a valid access token.
    
    Returns:
        Bearer token string for API requests
    """
    return get_auth_manager().get_access_token()

