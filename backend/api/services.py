import os
import google.generativeai as genai
from django.conf import settings
import requests
import json
import logging

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

class YouTubeService:
    API_KEY = "AIzaSyA98duwWN_9PKaaYmPY0K9WxpzTrPaxcdU"
    
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
            
            if 'items' in data and len(data['items']) > 0:
                item = data['items'][0]
                video_id = item['id']['videoId']
                # Try to get high quality thumbnail, fallback to default
                thumbnails = item['snippet']['thumbnails']
                thumbnail = thumbnails.get('high', thumbnails.get('default'))['url']
                
                return {
                    'video_url': f"https://www.youtube.com/embed/{video_id}",
                    'thumbnail': thumbnail
                }
        except Exception as e:
            print(f"YouTube Search Error for '{query}': {e}")
            
        return None

class ContentDiscoveryService:
    @staticmethod
    def search_videos(topic, skill_level):
        """
        Generates a full course structure using Gemini 3 Pro with JSON output.
        """
        # Using verified gemini-3-flash-preview as requested
        # model = genai.GenerativeModel('gemini-3-pro-preview')
        model = genai.GenerativeModel('gemini-3-flash-preview') 
        
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
            print(f"Gemini API Error: {e}")
            # Fallback mock data if API fails (for robustness)
            return None

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
        Generate 10 multiple-choice questions based on these notes about "{topic}":
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
