import os
import google.generativeai as genai
from django.conf import settings
import requests
import json
import logging

# Configure Gemini
# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

class YouTubeService:
    API_KEY = settings.YOUTUBE_API_KEY
    
    @staticmethod
    def search_video(query):
        """
        Searches YouTube for a video matching the query.
        Returns {video_url, thumbnail} or None.
        """
        try:
            url = "https://www.googleapis.com/youtube/v3/search"
            params = {
                'part': 'snippet',
                'q': query,
                'type': 'video',
                'maxResults': 1,
                'key': YouTubeService.API_KEY
            }
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            # Debug logging
            print(f"DEBUG YouTube API for '{query}': Status={response.status_code}")
            if 'error' in data:
                print(f"DEBUG YouTube API ERROR: {data['error'].get('message', data['error'])}")
                # Fallback: Return a YouTube search URL so user can find the video manually
                return YouTubeService._create_fallback_url(query)
            
            if 'items' in data and len(data['items']) > 0:
                item = data['items'][0]
                video_id = item['id']['videoId']
                # Try to get high quality thumbnail, fallback to default
                thumbnails = item['snippet']['thumbnails']
                thumbnail = thumbnails.get('high', thumbnails.get('default'))['url']
                
                embed_url = f"https://www.youtube.com/embed/{video_id}"
                print(f"DEBUG YouTube: Found video {video_id} -> {embed_url}")
                
                return {
                    'video_url': embed_url,
                    'thumbnail': thumbnail
                }
            else:
                print(f"DEBUG YouTube: No results found for '{query}'")
                return YouTubeService._create_fallback_url(query)
        except Exception as e:
            print(f"YouTube Search Error for '{query}': {e}")
            return YouTubeService._create_fallback_url(query)
            
        return None
    
    @staticmethod
    def _create_fallback_url(query):
        """Create a fallback YouTube search URL when API fails."""
        import urllib.parse
        search_query = urllib.parse.quote(query)
        return {
            'video_url': f"https://www.youtube.com/results?search_query={search_query}",
            'thumbnail': 'https://via.placeholder.com/480x360?text=Search+YouTube'
        }

class ContentDiscoveryService:
    @staticmethod
    def search_videos(topic, skill_level):
        """
        Generates a full course structure using Gemini 3 Pro with JSON output.
        """
        # Using verified gemini-3-flash-preview as requested
        model = genai.GenerativeModel('gemini-3-flash-preview') 
        
        # Debug API Key (safety first)
        key_status = "Set" if settings.GEMINI_API_KEY else "Not Set"
        print(f"DEBUG: GEMINI_API_KEY is {key_status}") 
        
        prompt = f"""
        You are an expert curriculum designer. Create a comprehensive video-based learning roadmap for "{topic}" suitable for a "{skill_level}" learner.
        
        Return the response in strictly valid JSON format with this exact structure:
        {{
            "course": {{
                "title": "Course Title",
                "description": "Brief course description",
                "difficulty": "{skill_level}",
                "estimated_hours": 10,
                "tags": ["{topic}", "video learning"]
            }},
            "chapters": [
                {{
                    "title": "Chapter Title",
                    "concepts": [
                        {{
                            "title": "Concept Title",
                            "description": "Concept description",
                            "video_search_query": "Specific search term for this concept", 
                            "duration_minutes": 15
                        }}
                    ]
                }}
            ]
        }}
        """
        
        try:
            print(f"DEBUG: Calling Gemini {model.model_name} for topic: {topic}")
            response = model.generate_content(
                prompt, 
                generation_config={"response_mime_type": "application/json"},
                request_options={"timeout": 60}  # 60 second timeout
            )
            print("DEBUG: Gemini response received. Length:", len(response.text))
            raw_response = response.text.replace('```json', '').replace('```', '').strip()
            # print(f"DEBUG: Raw response: {raw_response[:500]}...") # Optional debug
            
            data = json.loads(raw_response)
            print("DEBUG: JSON parsed successfully")
            
            # Enrich with Real YouTube Data
            course_thumbnail = None
            
            if 'chapters' in data:
                for chapter in data['chapters']:
                    if 'concepts' in chapter:
                        for concept in chapter['concepts']:
                            query = concept.get('video_search_query', concept['title'])
                            # Append topic to query for better context
                            full_query = f"{query} {topic} tutorial"
                            
                            print(f"DEBUG: Searching YouTube for: {full_query}")
                            yt_data = YouTubeService.search_video(full_query)
                            
                            if yt_data:
                                concept['video_url'] = yt_data['video_url']
                                concept['thumbnail'] = yt_data['thumbnail']
                                
                                # Use first found thumbnail for the course if not set
                                if not course_thumbnail:
                                    course_thumbnail = yt_data['thumbnail']
                            else:
                                # Fallback if API fail/limit
                                concept['video_url'] = "" 
            
            if course_thumbnail and 'course' in data:
                 data['course']['thumbnail'] = course_thumbnail
            
            return data
            
        except Exception as e:
            error_msg = str(e)
            print(f"Gemini API Error: {error_msg}")
            return {"error": error_msg}

class NotesGeneratorService:
    @staticmethod
    def generate_notes(video_title, extra_context=""):
        model = genai.GenerativeModel('gemini-3-flash-preview')  # Use working model
        
        prompt = f"""
        Create structured study notes for a video titled "{video_title}".
        Context: {extra_context}
        
        Format as Markdown with:
        # Main Title
        ## Key Concepts
        - Bullet points
        ## Code Examples (if applicable)
        ## Summary
        """
        
        try:
            response = model.generate_content(prompt, request_options={"timeout": 30})
            return response.text
        except Exception as e:
            print(f"Notes generation error: {e}")
            return f"# {video_title}\n\nNotes will be generated when you watch this video."

class QuizGeneratorService:
    @staticmethod
    def generate_quiz(topic, context_notes):
        model = genai.GenerativeModel('gemini-3-flash-preview')  # Use working model
        
        prompt = f"""
        Generate 3 multiple-choice questions based on these notes about "{topic}":
        {context_notes[:2000]}...
        
        Return JSON list:
        [{{
            "question": "...",
            "options": ["A", "B", "C", "D"],
            "correctAnswer": "Correct Option Text",
            "explanation": "..."
        }}]
        """
        
        try:
            response = model.generate_content(
                prompt,
                generation_config={'response_mime_type': 'application/json'},
                request_options={"timeout": 30}
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Quiz generation error: {e}")
            return []


# ============================================================
# MOCK INTERVIEW SERVICES
# ============================================================

class GeminiInterviewService:
    """
    Handles AI reasoning for the Mock Interview Simulator.
    Uses Gemini 3 Flash with minimal thinking for low-latency responses.
    """
    
    SYSTEM_PROMPT_TEMPLATE = """
You are Alex, a Senior Technical Interviewer at a top tech company (like Google or Netflix).
Your goal: Conduct a realistic {duration}-minute {topic} interview for a {level}-level candidate.

### INTERVIEWER PERSONA
- **Tone**: Professional, attentive, but rigorous. Not "cheerful assistant" - be a peer.
- **Style**: Direct. Ask deep follow-up questions. don't accept surface-level answers.
- **Structure**:
  1. Start with a brief icebreaker related to {topic}.
  2. Move to core technical concepts.
  3. If {topic} is technical, ask for a brief problem-solving approach (no coding).
  4. If {topic} is behavioral, use STAR method probing.

### CONSTRAINTS (CRITICAL)
- **Length**: KEEP RESPONSES SHORT. Max 2-3 sentences. High conversational density.
- **Ending**: ALWAYS end your turn with a specific question. Never leave it open-ended like "What do you think?".
- **Restrictions**: Do NOT write code. Do NOT give long lectures. Do NOT say "Correct!" constantly.

### CURRENT CONTEXT
{context}
"""
    
    @staticmethod
    def generate_question(topic: str, level: str, duration: int, conversation_history: list) -> str:
        """
        Generates the next interview question based on conversation history.
        """
        model = genai.GenerativeModel('gemini-3-flash-preview')
        
        # Build context from history
        context = "\n".join([
            f"{'Interviewer' if i % 2 == 0 else 'Candidate'}: {msg}"
            for i, msg in enumerate(conversation_history[-6:])  # Last 3 exchanges
        ]) if conversation_history else "This is the start of the interview."
        
        system_prompt = GeminiInterviewService.SYSTEM_PROMPT_TEMPLATE.format(
            topic=topic,
            level=level,
            duration=duration,
            context=context
        )
        
        try:
            response = model.generate_content(
                system_prompt + "\n\nGenerate your next question:",
                generation_config={
                    'temperature': 0.7,
                    'max_output_tokens': 150
                },
                request_options={"timeout": 15}
            )
            return response.text.strip()
        except Exception as e:
            logging.error(f"GeminiInterviewService error: {e}")
            return "Can you tell me more about your experience with that?"
    
    @staticmethod
    def analyze_interview(topic: str, transcript: str) -> dict:
        """
        Analyzes the full interview transcript and returns a performance report.
        """
        model = genai.GenerativeModel('gemini-3-flash-preview')
        
        prompt = f"""
        Analyze this {topic} interview transcript and provide a detailed evaluation.
        
        TRANSCRIPT:
        {transcript[:4000]}
        
        Return JSON:
        {{
            "score": 0-100,
            "feedback": "2-3 sentence overall assessment",
            "strengths": ["strength 1", "strength 2"],
            "weaknesses": ["area 1", "area 2"],
            "tips": ["improvement tip 1", "improvement tip 2"]
        }}
        """
        
        try:
            response = model.generate_content(
                prompt,
                generation_config={'response_mime_type': 'application/json'},
                request_options={"timeout": 30}
            )
            return json.loads(response.text)
        except Exception as e:
            logging.error(f"Interview analysis error: {e}")
            return {
                "score": 70,
                "feedback": "Analysis could not be completed. Please try again.",
                "strengths": [],
                "weaknesses": [],
                "tips": []
            }


class LiveKitService:
    """
    Handles LiveKit token generation for WebRTC video rooms.
    """
    
    @staticmethod
    def create_token(room_name: str, participant_name: str, is_publisher: bool = True) -> str:
        """
        Creates a JWT access token for a LiveKit room.
        Requires LIVEKIT_API_KEY and LIVEKIT_API_SECRET in settings.
        """
        try:
            from livekit.api import AccessToken, VideoGrants
            
            api_key = os.getenv('LIVEKIT_API_KEY')
            api_secret = os.getenv('LIVEKIT_API_SECRET')
            
            if not api_key or not api_secret:
                logging.warning("LiveKit credentials not configured. Returning mock token.")
                return "MOCK_LIVEKIT_TOKEN_FOR_DEV"
            
            token = AccessToken(api_key, api_secret)
            token.identity = participant_name
            token.name = participant_name
            
            grants = VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=is_publisher,
                can_subscribe=True
            )
            token.video_grants = grants
            
            return token.to_jwt()
        except ImportError:
            logging.error("livekit-api package not installed")
            return "MOCK_LIVEKIT_TOKEN_FOR_DEV"
        except Exception as e:
            logging.error(f"LiveKit token generation error: {e}")
            return "MOCK_LIVEKIT_TOKEN_FOR_DEV"


# ============================================================
# ALGORAND BLOCKCHAIN SERVICES
# ============================================================

class AlgorandService:
    """
    Bridges SkillMeter backend to Algorand blockchain.
    Handles Certificate NFTs, Skill Badge NFTs, and $SKILL token rewards.
    All methods are fail-safe — blockchain errors never break the learning flow.
    """

    REWARD_TABLE = {
        'concept': 1,        # 1 $SKILL per completed concept
        'daily_task': 5,
        'assessment': 20,
        'streak': 50,
        'course': 100,
        'perfect': 10,   # Added on top of 'assessment'
    }

    def __init__(self):
        try:
            from algosdk.v2client import algod
            from algosdk import mnemonic as algo_mnemonic
            from algosdk import account as algo_account

            self.algod_client = algod.AlgodClient(
                '', 'https://testnet-api.algonode.cloud'
            )

            algo_mnemonic_str = os.environ.get('ALGORAND_MNEMONIC', '')
            if not algo_mnemonic_str or algo_mnemonic_str.startswith('word1'):
                logging.warning("AlgorandService: ALGORAND_MNEMONIC not configured")
                self.enabled = False
                return

            self.admin_key = algo_mnemonic.to_private_key(algo_mnemonic_str)
            self.admin_address = algo_account.address_from_private_key(self.admin_key)

            self.cert_app_id = int(os.environ.get('ALGORAND_CERT_APP_ID', '0') or '0')
            self.badge_app_id = int(os.environ.get('ALGORAND_BADGE_APP_ID', '0') or '0')
            self.skill_token_id = int(os.environ.get('ALGORAND_SKILL_TOKEN_ID', '0') or '0')

            self.enabled = self.cert_app_id > 0 or self.badge_app_id > 0
            if not self.enabled:
                logging.warning("AlgorandService: No App IDs configured, blockchain features disabled")

        except Exception as e:
            logging.error(f"AlgorandService init error: {e}")
            self.enabled = False

    def issue_certificate_nft(self, recipient_address, course_name, score, cert_hash) -> dict:
        """
        Mints an ARC-69 Certificate NFT as a direct ASA creation.
        Returns {'asset_id': int, 'explorer_url': str} or None on failure.
        """
        if not self.enabled:
            logging.info("AlgorandService: Certificate NFT minting skipped (not enabled)")
            return None

        try:
            from algosdk import transaction

            # ARC-69 metadata in note field
            metadata = json.dumps({
                "standard": "arc69",
                "description": "SkillMeter.ai verified credential",
                "course": str(course_name),
                "score": int(score),
                "cert_id": str(cert_hash)
            })

            safe_name = course_name[:32] if course_name else "SkillCert"
            params = self.algod_client.suggested_params()

            # Direct ASA creation — reliably returns asset-index in confirmation
            txn = transaction.AssetCreateTxn(
                sender=self.admin_address,
                sp=params,
                total=1,
                decimals=0,
                default_frozen=False,
                unit_name="SCERT",
                asset_name=safe_name,
                url=f"https://lora.algokit.io/testnet",
                note=metadata.encode(),
                manager=self.admin_address,
                reserve=self.admin_address,
                freeze=self.admin_address,
                clawback=self.admin_address,
            )

            signed = txn.sign(self.admin_key)
            txid = self.algod_client.send_transaction(signed)
            result = transaction.wait_for_confirmation(self.algod_client, txid, 6)

            asset_id = result.get('asset-index')
            if asset_id:
                logging.info(f"AlgorandService: Certificate NFT minted, ASA ID={asset_id}")
                return {
                    'asset_id': asset_id,
                    'explorer_url': f'https://lora.algokit.io/testnet/asset/{asset_id}'
                }
            else:
                logging.warning(f"AlgorandService: Certificate txn confirmed ({txid}) but asset-index missing")
                return {'asset_id': 0, 'explorer_url': f'https://lora.algokit.io/testnet/tx/{txid}'}

        except Exception as e:
            logging.error(f"AlgorandService: Certificate NFT minting failed: {e}")
            return None

    def issue_skill_badge(self, recipient_address, skill_name, score, topic_hash) -> dict:
        """
        Mints an ARC-69 Skill Badge NFT as a direct ASA creation.
        Called by submit_assessment view when score >= 80.
        Returns {'asset_id': int, 'explorer_url': str} or None on failure.
        """
        if not self.enabled:
            logging.info("AlgorandService: Badge NFT minting skipped (not enabled)")
            return None

        try:
            from algosdk import transaction

            metadata = json.dumps({
                "standard": "arc69",
                "type": "skill_badge",
                "skill": str(skill_name),
                "score": int(score),
                "topic": str(topic_hash)
            })

            safe_name = skill_name[:32] if skill_name else "SkillBadge"
            params = self.algod_client.suggested_params()

            # Direct ASA creation — reliably returns asset-index in confirmation
            txn = transaction.AssetCreateTxn(
                sender=self.admin_address,
                sp=params,
                total=1,
                decimals=0,
                default_frozen=False,
                unit_name="SBADGE",
                asset_name=safe_name,
                url=f"https://lora.algokit.io/testnet",
                note=metadata.encode(),
                manager=self.admin_address,
                reserve=self.admin_address,
                freeze=self.admin_address,
                clawback=self.admin_address,
            )

            signed = txn.sign(self.admin_key)
            txid = self.algod_client.send_transaction(signed)
            result = transaction.wait_for_confirmation(self.algod_client, txid, 6)

            asset_id = result.get('asset-index')
            if asset_id:
                logging.info(f"AlgorandService: Skill Badge minted, ASA ID={asset_id}")
                return {
                    'asset_id': asset_id,
                    'explorer_url': f'https://lora.algokit.io/testnet/asset/{asset_id}'
                }
            else:
                logging.warning(f"AlgorandService: Badge txn confirmed ({txid}) but asset-index missing")
                return {'asset_id': 0, 'explorer_url': f'https://lora.algokit.io/testnet/tx/{txid}'}

        except Exception as e:
            logging.error(f"AlgorandService: Badge NFT minting failed: {e}")
            return None

    def reward_skill_tokens(self, recipient_address, reason, user=None) -> dict:
        """
        Distributes $SKILL tokens (ASA transfer) for a learning action.
        reason: 'concept' | 'daily_task' | 'assessment' | 'streak' | 'course' | 'perfect'
        If on-chain transfer fails (e.g. wallet not opted-in), tokens are stored in
        LearnerProfile.pending_skill_tokens so no rewards are ever lost.
        """
        amount = self.REWARD_TABLE.get(reason, 0)
        if amount == 0 or not self.enabled or self.skill_token_id == 0:
            return {'rewarded': False, 'reason': reason}

        try:
            from algosdk import transaction

            params = self.algod_client.suggested_params()

            # Real ASA transfer of $SKILL tokens from admin wallet to recipient
            txn = transaction.AssetTransferTxn(
                sender=self.admin_address,
                sp=params,
                receiver=recipient_address,
                amt=amount,
                index=self.skill_token_id,
                note=f'SkillMeter reward: {reason}'.encode(),
            )

            signed = txn.sign(self.admin_key)
            txid = self.algod_client.send_transaction(signed)
            transaction.wait_for_confirmation(self.algod_client, txid, 6)

            logging.info(f"AlgorandService: Rewarded {amount} $SKILL for '{reason}' -> {recipient_address} (tx={txid})")

            # If on-chain succeeded, clear any pending tokens (they're now on-chain)
            if user:
                try:
                    from .models import LearnerProfile
                    LearnerProfile.objects.filter(user=user).update(pending_skill_tokens=0)
                except Exception:
                    pass

            return {'rewarded': True, 'amount': amount, 'reason': reason, 'txid': txid}

        except Exception as e:
            logging.error(f"AlgorandService: Token reward failed ({reason}): {e}")
            # Save to pending — no rewards are lost
            if user:
                try:
                    from .models import LearnerProfile
                    from django.db.models import F
                    LearnerProfile.objects.filter(user=user).update(
                        pending_skill_tokens=F('pending_skill_tokens') + amount
                    )
                    logging.info(f"AlgorandService: Saved {amount} $SKILL as pending for user {user}")
                except Exception as inner_e:
                    logging.error(f"AlgorandService: Failed to save pending tokens: {inner_e}")
            return {'rewarded': False, 'amount': amount, 'reason': reason}
