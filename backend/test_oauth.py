"""
Test OAuth2 Authentication for Gemini API

Run this script to test OAuth2 setup and verify credentials.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from api.interview_services.oauth2_helper import get_auth_manager


def main():
    """Test authentication."""
    print("=" * 60)
    print("Gemini Authentication Test")
    print("=" * 60)
    print()
    
    # Check for service account key (recommended)
    service_account = Path(__file__).parent / 'service-account-key.json'
    client_secret = Path(__file__).parent / 'client_secret.json'
    
    if service_account.exists():
        print("✅ Found service-account-key.json (recommended)")
    elif client_secret.exists():
        print("✅ Found client_secret.json (OAuth2 flow)")
    else:
        print("❌ No authentication credentials found!")
        print()
        print("Please provide ONE of:")
        print("1. service-account-key.json (recommended for backend)")
        print("2. client_secret.json (OAuth2 for development)")
        print("3. Set GOOGLE_APPLICATION_CREDENTIALS env variable")
        print()
        print("See service_account_setup.md for instructions")
        return 1
    
    print()
    
    # Initialize auth manager
    try:
        auth_manager = get_auth_manager()
        print("📝 Getting authentication credentials...")
        print()
        
        # Get credentials
        credentials = auth_manager.get_credentials()
        
        print("=" * 60)
        print("✅ Authentication Successful!")
        print("=" * 60)
        print()
        print(f"🔐 Method: {auth_manager.auth_method}")
        print()
        
        # Get access token
        access_token = auth_manager.get_access_token()
        print(f"🎫 Access Token: {access_token[:20]}...{access_token[-15:]}")
        print()
        
        print("=" * 60)
        print("✅ All checks passed!")
        print("=" * 60)
        print()
        print("Next steps:")
        print("1. Start the backend server: python manage.py runserver 8001")
        print("2. Navigate to /gemini-lab")
        print("3. Test the AI Interview feature")
        
        return 0
        
    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        return 1
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
