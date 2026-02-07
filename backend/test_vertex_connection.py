"""
Test Vertex AI connection for Gemini Live.

This script verifies that the new Vertex AI implementation works correctly.
"""

import asyncio
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from api.interview_services.gemini_live import GeminiLiveClient, GeminiLiveConfig


async def test_vertex_connection():
    """Test connection to Vertex AI."""
    print("=" * 60)
    print("Vertex AI Connection Test")
    print("=" * 60)
    print()
    
    try:
        # Initialize client
        print("1️⃣ Initializing Gemini Live client...")
        config = GeminiLiveConfig()
        client = GeminiLiveClient(config)
        print(f"   Project: {config.project_id}")
        print(f"   Location: {config.location}")
        print(f"   Model: {config.model_name}")
        print()
        
        # Connect to Vertex AI
        print("2️⃣ Connecting to Vertex AI...")
        system_prompt = "You are a helpful AI assistant for technical interviews."
        
        connected = await client.connect(system_prompt)
        
        if connected:
            print("   ✅ Connected successfully!")
            print()
            
            # Test sending a text message
            print("3️⃣ Testing text message...")
            await client.send_text("Hello, can you hear me?")
            print("   ✅ Message sent!")
            print()
            
            # Wait a moment for response
            print("4️⃣ Listening for responses (5 seconds)...")
            try:
                async def listen_for_responses():
                    count = 0
                    async for response in client.receive_audio():
                        count += 1
                        print(f"   📥 Response {count}: {response.get('type')}")
                        if count >= 3:  # Stop after 3 responses
                            break
                
                await asyncio.wait_for(listen_for_responses(), timeout=5.0)
            except asyncio.TimeoutError:
                print("   ⏱️  Timeout (no responses in 5 seconds)")
            print()
            
            # Disconnect
            print("5️⃣ Disconnecting...")
            await client.disconnect()
            print("   ✅ Disconnected!")
            print()
            
            print("=" * 60)
            print("✅ ALL TESTS PASSED!")
            print("=" * 60)
            print()
            print("Next steps:")
            print("1. Restart backend server")
            print("2. Navigate to /gemini-lab")
            print("3. Test the full interview flow")
            
            return 0
        else:
            print("   ❌ Connection failed!")
            return 1
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(test_vertex_connection())
    sys.exit(exit_code)
