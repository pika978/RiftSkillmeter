from django.db import models
from django.contrib.auth.models import User


class LearnerProfile(models.Model):
    """
    Stores learner preferences and onboarding data.
    One-to-one relationship with Django's built-in User model.
    """
    SKILL_LEVELS = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    skill_level = models.CharField(max_length=20, choices=SKILL_LEVELS, default='beginner')
    learning_goals = models.JSONField(default=list, blank=True)  # List of goal IDs
    daily_study_time = models.IntegerField(default=30)  # Minutes per day
    phone_number = models.CharField(max_length=20, default='+919518380879', help_text="For WhatsApp notifications")
    onboarding_completed = models.BooleanField(default=False)
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    algo_wallet = models.CharField(
        max_length=58,
        blank=True,
        null=True,
        help_text='Algorand wallet address for NFT delivery'
    )
    pending_skill_tokens = models.IntegerField(
        default=0,
        help_text='$SKILL tokens earned but not yet transferred on-chain (e.g. wallet not opted-in)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    class Meta:
        verbose_name = 'Learner Profile'
        verbose_name_plural = 'Learner Profiles'


class Course(models.Model):
    """
    Represents a learning course with chapters and concepts.
    """
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    thumbnail = models.URLField(blank=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='beginner')
    estimated_hours = models.IntegerField(default=10)
    tags = models.JSONField(default=list, blank=True)  # e.g., ['React', 'JavaScript']
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']


class Chapter(models.Model):
    """
    A chapter within a course, containing multiple concepts.
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='chapters')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.course.title} - {self.title}"

    class Meta:
        ordering = ['order']


class Concept(models.Model):
    """
    An individual lesson/concept within a chapter.
    Contains video, notes, and learning content.
    """
    CONTENT_TYPES = [
        ('video', 'Video'),
        ('article', 'Article'),
        ('exercise', 'Exercise'),
    ]

    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='concepts')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    duration = models.IntegerField(default=15)  # Minutes
    video_url = models.URLField(blank=True)
    notes = models.TextField(blank=True)  # Markdown content
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPES, default='video')
    order = models.IntegerField(default=0)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['order']


class Roadmap(models.Model):
    """
    Represents a user's enrollment in a course with progress tracking.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='roadmaps')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='roadmaps')
    progress = models.IntegerField(default=0)  # Percentage 0-100
    current_chapter = models.IntegerField(default=0)
    current_concept = models.IntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    last_accessed_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True, help_text="When the course was completed (progress=100%)")
    certificate_id = models.CharField(max_length=50, unique=True, null=True, blank=True, help_text="Unique hash for certificate verification")
    nft_asset_id = models.BigIntegerField(null=True, blank=True, help_text="Algorand ASA ID for certificate NFT")

    def __str__(self):
        return f"{self.user.username} - {self.course.title}"

    class Meta:
        unique_together = ['user', 'course']


class ConceptProgress(models.Model):
    """
    Tracks individual concept completion for a user.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='concept_progress')
    concept = models.ForeignKey(Concept, on_delete=models.CASCADE, related_name='user_progress')
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.concept.title}"

    class Meta:
        unique_together = ['user', 'concept']


class Assessment(models.Model):
    """
    Quiz/assessment for a concept.
    """
    concept = models.ForeignKey(Concept, on_delete=models.CASCADE, related_name='assessments')
    questions = models.JSONField(default=list)  # List of question objects
    time_limit = models.IntegerField(default=10)  # Minutes
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Assessment for {self.concept.title}"


class AssessmentResult(models.Model):
    """
    User's result for an assessment.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assessment_results')
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='results')
    score = models.IntegerField(default=0)  # Percentage 0-100
    answers = models.JSONField(default=list)  # User's answers
    badge_asset_id = models.BigIntegerField(null=True, blank=True, help_text="Algorand ASA ID for skill badge NFT")
    completed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.assessment.concept.title}: {self.score}%"


class DailyTask(models.Model):
    """
    Daily learning task for a user.
    """
    TASK_TYPES = [
        ('video', 'Watch Video'),
        ('notes', 'Read Notes'),
        ('assessment', 'Take Assessment'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_tasks')
    concept = models.ForeignKey(Concept, on_delete=models.CASCADE, related_name='tasks')
    task_type = models.CharField(max_length=20, choices=TASK_TYPES)
    title = models.CharField(max_length=200)
    scheduled_date = models.DateField()
    completed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.title}"

    class Meta:
        ordering = ['scheduled_date']


class Notification(models.Model):
    """
    User notifications for reminders, achievements, etc.
    """
    NOTIFICATION_TYPES = [
        ('reminder', 'Reminder'),
        ('achievement', 'Achievement'),
        ('missed', 'Missed Task'),
        ('system', 'System'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.title}"

    class Meta:
        ordering = ['-created_at']


class UserProgress(models.Model):
    """
    Overall progress statistics for a user.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='progress')
    total_minutes_learned = models.IntegerField(default=0)
    total_concepts_completed = models.IntegerField(default=0)
    total_assessments_taken = models.IntegerField(default=0)
    average_score = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Progress"


class Lab(models.Model):
    """
    Stores user's code labs (saved playgrounds).
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='labs')
    name = models.CharField(max_length=200, default="Untitled Lab")
    language = models.CharField(max_length=50, default="javascript")
    files = models.JSONField(default=list)  # Stores [{name, language, content}, ...]
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.name}"

    class Meta:
        ordering = ['-updated_at']


class StudySession(models.Model):
    """
    Stores focus/study session data from the Study Room feature.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_sessions')
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(auto_now_add=True)
    total_duration = models.IntegerField(default=0)  # Total session time in seconds
    focus_duration = models.IntegerField(default=0)  # Time actually focused in seconds
    distraction_count = models.IntegerField(default=0)  # Number of distraction events
    focus_percentage = models.FloatField(default=100.0)  # Calculated focus score

    def __str__(self):
        return f"{self.user.username} - {self.started_at.strftime('%Y-%m-%d %H:%M')}"


    class Meta:
        ordering = ['-ended_at']


class NotificationLog(models.Model):
    """
    Logs backend notifications sent via Email or WhatsApp.
    """
    TYPE_CHOICES = [
        ('EMAIL', 'Email'),
        ('WHATSAPP', 'WhatsApp')
    ]
    STATUS_CHOICES = [
        ('SENT', 'Sent'),
        ('FAILED', 'Failed')
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notification_logs')
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    event_name = models.CharField(max_length=100)  # e.g., "Module Completed"
    recipient = models.CharField(max_length=255)   # Email or Phone Number
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SENT')
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.notification_type} - {self.event_name} - {self.user.username}"


class MentorProfile(models.Model):
    """
    Profile extension for users who are mentors.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mentor_profile')
    title = models.CharField(max_length=100, default='Mentor') # e.g. "Senior SDE @ Google"
    company = models.CharField(max_length=100, default='', blank=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=10.00)
    about = models.TextField(default='', blank=True)
    skills = models.JSONField(default=list) # e.g. ["React", "Python"]
    availability = models.JSONField(default=dict, blank=True)  # Weekly schedule: {"Mon": ["10:00", "14:00"], ...}
    is_verified = models.BooleanField(default=False)
    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    average_rating = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.title}"

class MentorSlot(models.Model):
    """
    Availability slots for mentors.
    """
    mentor = models.ForeignKey(MentorProfile, on_delete=models.CASCADE, related_name='slots')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_booked = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.mentor.user.username} - {self.start_time}"

    class Meta:
        ordering = ['start_time']

class Booking(models.Model):
    """
    Session booking between a learner and a mentor.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled')
    ]

    learner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learner_bookings')
    mentor = models.ForeignKey(MentorProfile, on_delete=models.CASCADE, related_name='mentor_bookings')
    slot = models.OneToOneField(MentorSlot, on_delete=models.PROTECT, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    meeting_link = models.URLField(blank=True)
    topic = models.CharField(max_length=200) # e.g. "Mock Interview"
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Booking {self.id} - {self.status}"


class InterviewSession(models.Model):
    """
    Stores metrics and transcript for an AI Mock Interview session.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interview_sessions')
    topic = models.CharField(max_length=100)
    difficulty = models.CharField(max_length=20, default='mid')
    duration = models.IntegerField(default=15) # minutes
    
    # Analysis Metrics (Populated after session)
    score = models.IntegerField(default=0)
    feedback = models.TextField(blank=True)
    strengths = models.JSONField(default=list)
    weaknesses = models.JSONField(default=list)
    transcript = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.topic} ({self.created_at.strftime('%Y-%m-%d')})"

    class Meta:
        ordering = ['-created_at']


class AIInterviewSession(models.Model):
    """
    Stores AI-powered interview sessions using Tavus CVI + Gemini Live API.
    This is the new implementation with real-time video avatar and AI conversation.
    """
    LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    STATUS_CHOICES = [
        ('ready', 'Ready'),
        ('in_progress', 'In Progress'),
        ('ended', 'Ended'),
        ('error', 'Error'),
    ]
    
    # Session Identity
    session_id = models.UUIDField(unique=True, editable=False, help_text="Unique session identifier")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_interviews', null=True, blank=True, help_text="User who started the interview (optional for testing)")
    
    # Interview Configuration
    skill_topic = models.CharField(max_length=200, help_text="e.g., 'Python Backend Development'")
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='intermediate')
    cv_text = models.TextField(blank=True, help_text="Parsed CV/resume text")
    system_prompt = models.TextField(help_text="Gemini system instruction for this session")
    
    # Tavus Integration (optional - audio-only mode if unavailable)
    tavus_persona_id = models.CharField(max_length=100, null=True, blank=True, help_text="Tavus persona ID")
    tavus_conversation_id = models.CharField(max_length=100, null=True, blank=True, help_text="Tavus conversation ID")
    conversation_url = models.URLField(null=True, blank=True, help_text="Daily.co WebRTC URL for embedding")
    
    # Session Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ready')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0, help_text="Total interview duration")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.skill_topic} [{self.status}]"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'AI Interview Session'
        verbose_name_plural = 'AI Interview Sessions'


class InterviewTranscriptEntry(models.Model):
    """
    Individual transcript entries (turns) during an AI interview.
    Stores both user and AI responses for analysis.
    """
    SPEAKER_CHOICES = [
        ('user', 'User'),
        ('ai', 'AI Interviewer'),
    ]
    
    session = models.ForeignKey(
        AIInterviewSession, 
        on_delete=models.CASCADE, 
        related_name='transcript_entries'
    )
    speaker = models.CharField(max_length=10, choices=SPEAKER_CHOICES)
    text = models.TextField(blank=True, help_text="Transcribed text (if available)")
    audio_data = models.TextField(blank=True, help_text="Base64 encoded audio chunk (optional)")
    timestamp = models.DateTimeField(auto_now_add=True)
    sequence_number = models.IntegerField(default=0, help_text="Order in conversation")
    
    def __str__(self):
        preview = self.text[:50] + "..." if len(self.text) > 50 else self.text
        return f"{self.speaker}: {preview}"
    
    class Meta:
        ordering = ['session', 'sequence_number']
        verbose_name = 'Interview Transcript Entry'
        verbose_name_plural = 'Interview Transcript Entries'


class AIPerformanceReport(models.Model):
    """
    AI-generated performance report for an interview session.
    Generated by Gemini after interview completion.
    """
    session = models.OneToOneField(
        AIInterviewSession,
        on_delete=models.CASCADE,
        related_name='performance_report'
    )
    
    # Overall Evaluation
    performance_summary = models.TextField(help_text="1-2 sentence overall assessment")
    
    # Detailed Feedback
    strengths = models.JSONField(default=list, help_text="List of key strengths")
    improvements = models.JSONField(default=list, help_text="List of areas to improve")
    
    # Scores (1-10 scale)
    topic_knowledge_score = models.IntegerField(default=5, help_text="Knowledge of interview topic")
    communication_score = models.IntegerField(default=5, help_text="Clarity of explanation")
    problem_solving_score = models.IntegerField(default=5, help_text="Problem-solving approach")
    overall_score = models.IntegerField(default=5, help_text="Overall performance (average)")
    
    # Recommendation
    recommendation = models.TextField(blank=True, help_text="Should candidate proceed? Why?")
    
    # Metadata
    generated_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Report for {self.session.user.username} - {self.session.skill_topic}"
    
    def save(self, *args, **kwargs):
        # Auto-calculate overall score as average
        self.overall_score = int(
            (self.topic_knowledge_score + self.communication_score + self.problem_solving_score) / 3
        )
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = 'AI Performance Report'
        verbose_name_plural = 'AI Performance Reports'

