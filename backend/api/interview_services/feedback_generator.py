"""
Feedback Generator using Gemini API

Generates structured interview feedback based on conversation transcript.
"""

import logging
import json
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

# Try to import google.generativeai (fallback for feedback generation)
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("google-generativeai not available for feedback generation")


def generate_interview_feedback(
    summary_prompt: str,
    api_key: str = None
) -> Dict[str, Any]:
    """
    Generate structured interview feedback using Gemini.
    
    Args:
        summary_prompt: Complete prompt with transcript and instructions
        api_key: Optional Gemini API key (uses env var GEMINI_API_KEY if not provided)
    
    Returns:
        Dictionary with parsed feedback:
        {
            'performance_summary': str,
            'strengths': List[str],
            'improvements': List[str],
            'topic_knowledge_score': int (1-10),
            'communication_score': int (1-10),
            'problem_solving_score': int (1-10)
        }
    """
    import os
    
    if not GENAI_AVAILABLE:
        logger.warning("google-generativeai not available, using defaults")
        return _get_default_feedback()
    
    try:
        # Configure Gemini
        api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY not found, using default feedback")
            return _get_default_feedback()
        
        genai.configure(api_key=api_key)
        
        # Use Gemini Flash for cost-effective text generation
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Generate feedback
        response = model.generate_content(summary_prompt)
        
        if not response or not response.text:
            logger.error("Empty response from Gemini")
            return _get_default_feedback()
        
        # Parse the response
        feedback_text = response.text.strip()
        parsed = _parse_feedback_response(feedback_text)
        
        logger.info("Generated AI feedback successfully")
        return parsed
        
    except Exception as e:
        logger.error(f"Failed to generate AI feedback: {e}", exc_info=True)
        return _get_default_feedback()


def _parse_feedback_response(feedback_text: str) -> Dict[str, Any]:
    """
    Parse Gemini's feedback response into structured format.
    
    Expected format from Gemini:
    1. OVERALL PERFORMANCE (1-2 sentences)
    2. KEY STRENGTHS (3-4 bullet points)
    3. AREAS FOR IMPROVEMENT (3-4 bullet points)
    4. TOPIC KNOWLEDGE SCORE (1-10)
    5. COMMUNICATION SCORE (1-10)
    6. RECOMMENDATION
    """
    # Default values
    result = {
        'performance_summary': "Interview completed successfully.",
        'strengths': [],
        'improvements': [],
        'topic_knowledge_score': 7,
        'communication_score': 7,
        'problem_solving_score': 6
    }
    
    try:
        lines = feedback_text.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Detect sections
            if 'OVERALL PERFORMANCE' in line.upper() or 'PERFORMANCE' in line.upper():
                current_section = 'summary'
                continue
            elif 'STRENGTH' in line.upper():
                current_section = 'strengths'
                continue
            elif 'IMPROVEMENT' in line.upper() or 'AREAS' in line.upper():
                current_section = 'improvements'
                continue
            elif 'TOPIC KNOWLEDGE SCORE' in line.upper():
                current_section = 'topic_score'
                # Extract score from this line or next
                score = _extract_score(line)
                if score:
                    result['topic_knowledge_score'] = score
                continue
            elif 'COMMUNICATION SCORE' in line.upper():
                current_section = 'comm_score'
                score = _extract_score(line)
                if score:
                    result['communication_score'] = score
                continue
            elif 'RECOMMENDATION' in line.upper():
                current_section = None
                continue
            
            # Process content based on section
            if current_section == 'summary' and len(result['performance_summary']) < 200:
                # Append to summary
                if not line.startswith('-') and not line.startswith('*'):
                    if result['performance_summary'] == "Interview completed successfully.":
                        result['performance_summary'] = line
                    else:
                        result['performance_summary'] += " " + line
            
            elif current_section == 'strengths':
                # Extract bullet point
                clean_line = line.lstrip('-*•→ ').strip()
                if clean_line and len(result['strengths']) < 5:
                    result['strengths'].append(clean_line)
            
            elif current_section == 'improvements':
                # Extract bullet point
                clean_line = line.lstrip('-*•→ ').strip()
                if clean_line and len(result['improvements']) < 5:
                    result['improvements'].append(clean_line)
            
            elif current_section == 'topic_score':
                score = _extract_score(line)
                if score:
                    result['topic_knowledge_score'] = score
                    current_section = None
            
            elif current_section == 'comm_score':
                score = _extract_score(line)
                if score:
                    result['communication_score'] = score
                    current_section = None
        
        # Ensure we have at least some strengths/improvements
        if not result['strengths']:
            result['strengths'] = ["Clear communication", "Good effort"]
        if not result['improvements']:
            result['improvements'] = ["Practice more scenarios"]
        
        # Calculate problem-solving score as average
        result['problem_solving_score'] = (
            result['topic_knowledge_score'] + result['communication_score']
        ) // 2
        
    except Exception as e:
        logger.error(f"Failed to parse feedback: {e}")
    
    return result


def _extract_score(text: str) -> int:
    """Extract a 1-10 score from text."""
    import re
    # Look for patterns like "8/10", "Score: 7", "7 out of 10", etc.
    patterns = [
        r'(\d+)\s*/\s*10',
        r'score:\s*(\d+)',
        r'(\d+)\s*(out of|/)\s*10',
        r'^(\d+)$'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            score = int(match.group(1))
            if 1 <= score <= 10:
                return score
    
    return None


def _get_default_feedback() -> Dict[str, Any]:
    """Return default feedback when AI generation fails."""
    return {
        'performance_summary': "Interview completed. Performance details saved.",
        'strengths': [
            "Clear communication",
            "Good problem-solving approach",
            "Relevant technical knowledge"
        ],
        'improvements': [
            "Practice more complex scenarios",
            "Improve depth of technical explanations",
            "Work on time management during answers"
        ],
        'topic_knowledge_score': 7,
        'communication_score': 7,
        'problem_solving_score': 6
    }
