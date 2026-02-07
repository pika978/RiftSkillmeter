"""
Interview Prompt Builder

Constructs system prompts for Gemini based on:
- Interview topic/skill
- Difficulty level
- Candidate's CV (if provided)

The prompt instructs Gemini on how to conduct the interview,
what questions to ask, and how to adapt to the candidate's responses.
"""

from typing import Optional


def build_interview_prompt(
    skill_topic: str,
    level: str = "intermediate",
    cv_text: str = "",
    duration_minutes: int = 25
) -> str:
    """
    Build a comprehensive system prompt for the AI interviewer.
    
    Args:
        skill_topic: The skill/topic to interview on (e.g., "Python Backend")
        level: Difficulty level - "beginner", "intermediate", or "advanced"
        cv_text: Parsed CV text (empty if no CV uploaded)
        duration_minutes: Target interview duration
    
    Returns:
        Complete system prompt for Gemini
    """
    
    # Build CV section
    cv_section = _build_cv_section(skill_topic, cv_text)
    
    # Build level-specific instructions
    level_instructions = _build_level_instructions(level)
    
    # Calculate approximate question count
    questions_count = max(6, duration_minutes // 3)
    
    return f"""You are a professional interviewer conducting a {level.upper()} level technical interview.

INTERVIEW TOPIC: {skill_topic}

{cv_section}

{level_instructions}

INTERVIEW FLOW:
1. Start with a warm, professional greeting
2. Ask "Tell me about yourself and your experience with {skill_topic}"
3. Ask {questions_count-2} targeted questions based on their responses
4. Conclude with "Do you have any questions for me?"

QUESTION GUIDELINES:
- Ask ONE question at a time
- Wait for the candidate to finish speaking before responding
- Acknowledge their answer briefly before moving to the next question
- If they struggle, offer gentle hints or rephrase the question
- Mix theoretical questions with practical scenarios

RESPONSE STYLE:
- Keep responses conversational and natural
- Use short, clear sentences for audio output
- Be encouraging and supportive
- Avoid technical jargon when explaining concepts
- Sound human, not robotic

TIMING:
- Target duration: approximately {duration_minutes} minutes
- Don't rush, but keep the interview moving
- Politely redirect if answers become too lengthy

Begin the interview now with your greeting and first question.
"""


def _build_cv_section(skill_topic: str, cv_text: str) -> str:
    """Build the CV context section of the prompt."""
    
    if cv_text:
        return f"""
CANDIDATE'S CV/RESUME:
----------------------
{cv_text}
----------------------

CV-BASED INTERVIEW INSTRUCTIONS:
- Reference specific projects, skills, or experience from the CV naturally
- If CV mentions "{skill_topic}" experience, ask follow-up questions about those projects
- Use the candidate's name from the CV when addressing them
- Ask about career transitions or gaps visible in their work history
- Probe deeper into technologies/tools mentioned in the CV
- Connect CV experience to the interview topic wherever relevant
- Ask "Can you tell me more about [specific project from CV]?"
"""
    else:
        return """
NO CV PROVIDED:
- Focus on general questions about the interview topic
- Assess fundamentals and theoretical knowledge
- Ask about hypothetical scenarios and problem-solving approach
- Learn about their background through the conversation
- Ask "What projects have you worked on involving this topic?"
"""


def _build_level_instructions(level: str) -> str:
    """Build difficulty-level specific instructions."""
    
    level = level.lower()
    
    if level == "beginner":
        return """
BEGINNER LEVEL FOCUS:
- Start with fundamental concepts and definitions
- Ask about basic syntax and common patterns
- Use simple, straightforward scenarios
- Be extra encouraging and patient
- If they get stuck, provide gentle hints
- Focus on understanding over memorization
- Example questions:
  * "What is [basic concept]? Can you explain it simply?"
  * "When would you use [basic tool/feature]?"
  * "How would you approach [simple task]?"
"""
    
    elif level == "advanced":
        return """
ADVANCED LEVEL FOCUS:
- Dive deep into architecture and design decisions
- Ask about edge cases, performance, and scalability
- Discuss trade-offs between different approaches
- Expect detailed, nuanced answers
- Challenge their assumptions respectfully
- Ask about real-world production experience
- Example questions:
  * "How would you design [complex system]?"
  * "What are the trade-offs between [approach A] and [approach B]?"
  * "How would you debug [complex scenario]?"
  * "What happens under the hood when [specific operation]?"
"""
    
    else:  # intermediate (default)
        return """
INTERMEDIATE LEVEL FOCUS:
- Balance theory with practical application
- Ask about real-world usage and best practices
- Include some design and architecture questions
- Expect solid understanding of core concepts
- Ask about debugging and problem-solving approaches
- Example questions:
  * "How do you typically approach [common task]?"
  * "What are some best practices for [topic]?"
  * "Can you walk me through how you would [practical scenario]?"
  * "What challenges have you faced with [topic]?"
"""


def build_summary_prompt(
    skill_topic: str,
    level: str,
    transcript: str
) -> str:
    """
    Build a prompt for generating interview summary/feedback.
    
    Args:
        skill_topic: The interview topic
        level: Interview difficulty level
        transcript: Full conversation transcript
    
    Returns:
        Prompt for generating structured feedback
    """
    
    return f"""Based on this {level} level interview about {skill_topic}, provide a structured evaluation.

INTERVIEW TRANSCRIPT:
{transcript}

Please provide:

1. OVERALL PERFORMANCE (1-2 sentences)
   Rate overall performance and give a brief summary.

2. KEY STRENGTHS (3-4 bullet points)
   What did the candidate do well?

3. AREAS FOR IMPROVEMENT (3-4 bullet points)
   What should they work on?

4. TOPIC KNOWLEDGE SCORE (1-10)
   Rate their knowledge of {skill_topic}.

5. COMMUNICATION SCORE (1-10)
   Rate how clearly they explained concepts.

6. RECOMMENDATION
   Would you recommend proceeding with this candidate? Why?

Be constructive, specific, and encouraging in your feedback.
"""
