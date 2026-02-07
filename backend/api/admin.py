from django.contrib import admin
from .models import (
    LearnerProfile, Course, Chapter, Concept, Roadmap, ConceptProgress,
    Assessment, AssessmentResult, DailyTask, Notification, UserProgress, Lab,
    StudySession, NotificationLog, MentorProfile, MentorSlot, Booking,
    AIInterviewSession, InterviewTranscriptEntry, AIPerformanceReport
)

@admin.register(LearnerProfile)
class LearnerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'skill_level', 'daily_study_time', 'onboarding_completed')
    list_editable = ('skill_level', 'daily_study_time', 'onboarding_completed')
    search_fields = ('user__username', 'user__email')

class ChapterInline(admin.StackedInline):
    model = Chapter
    extra = 1

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'difficulty', 'estimated_hours', 'created_at')
    list_editable = ('difficulty', 'estimated_hours')
    search_fields = ('title',)
    list_filter = ('difficulty',)
    inlines = [ChapterInline]

class ConceptInline(admin.StackedInline):
    model = Concept
    extra = 1

@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order')
    list_editable = ('order',)
    list_filter = ('course',)
    inlines = [ConceptInline]

@admin.register(Concept)
class ConceptAdmin(admin.ModelAdmin):
    list_display = ('title', 'chapter', 'content_type', 'duration', 'order')
    list_editable = ('duration', 'order', 'content_type')
    list_filter = ('content_type',)
    search_fields = ('title', 'chapter__title')

@admin.register(Roadmap)
class RoadmapAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'progress', 'current_chapter', 'current_concept', 'last_accessed_at')
    list_editable = ('progress', 'current_chapter', 'current_concept')
    list_filter = ('course',)
    search_fields = ('user__username', 'course__title')

@admin.register(ConceptProgress)
class ConceptProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'concept', 'completed', 'completed_at')
    list_editable = ('completed',)
    list_filter = ('completed',)

@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ('concept', 'time_limit', 'created_at')
    list_editable = ('time_limit',)

@admin.register(AssessmentResult)
class AssessmentResultAdmin(admin.ModelAdmin):
    list_display = ('user', 'assessment', 'score', 'completed_at')
    list_editable = ('score',)

from django.utils import timezone

@admin.action(description='Backfill activity history to match streak')
def backfill_streak_history(modeladmin, request, queryset):
    for user_progress in queryset:
        user = user_progress.user
        streak = user_progress.current_streak
        
        # Get all concepts (potential tasks to mark complete)
        all_concepts = list(Concept.objects.all())
        if not all_concepts:
            continue
            
        # Iterate backwards to fill history
        for i in range(streak):
            target_date = timezone.now().date() - timezone.timedelta(days=i)
            target_time = timezone.now() - timezone.timedelta(days=i)
            
            # Check if any progress exists for this date
            exists = ConceptProgress.objects.filter(
                user=user, 
                completed_at__date=target_date
            ).exists()
            
            if not exists:
                # Find a concept to mark complete. 
                # Use modulo to cycle through concepts if streak > concept_count
                concept = all_concepts[i % len(all_concepts)]
                
                # Create or Update progress for this concept to be on the target date
                # Note: This might move a concept's completion date if it was already completed
                ConceptProgress.objects.update_or_create(
                    user=user,
                    concept=concept,
                    defaults={
                        'completed': True,
                        'completed_at': target_time
                    }
                )

@admin.register(DailyTask)
class DailyTaskAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'task_type', 'scheduled_date', 'completed')
    list_editable = ('completed', 'scheduled_date')
    list_filter = ('completed', 'task_type', 'scheduled_date')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'notification_type', 'read', 'created_at')
    list_editable = ('read',)
    list_filter = ('read', 'notification_type')

@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_minutes_learned', 'current_streak')
    list_editable = ('total_minutes_learned', 'current_streak')
    actions = [backfill_streak_history]

@admin.register(Lab)
class LabAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'language', 'updated_at')
    list_editable = ('name', 'language')

@admin.register(StudySession)
class StudySessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'started_at', 'total_duration', 'focus_duration', 'focus_percentage')
    list_filter = ('user',)

@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'event_name', 'status', 'created_at')
    list_filter = ('notification_type', 'status')

@admin.register(MentorProfile)
class MentorProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'company', 'hourly_rate', 'is_verified')
    list_editable = ('is_verified', 'hourly_rate')
    search_fields = ('user__username', 'title', 'company')
    list_filter = ('is_verified',)

@admin.register(MentorSlot)
class MentorSlotAdmin(admin.ModelAdmin):
    list_display = ('mentor', 'start_time', 'end_time', 'is_booked')
    list_filter = ('is_booked', 'start_time')

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('learner', 'mentor', 'topic', 'status', 'amount_paid', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('learner__username', 'mentor__user__username', 'topic')


# AI Interview Admin
class TranscriptEntryInline(admin.TabularInline):
    model = InterviewTranscriptEntry
    extra = 0
    fields = ('sequence_number', 'speaker', 'text', 'timestamp')
    readonly_fields = ('timestamp',)
    ordering = ('sequence_number',)


@admin.register(AIInterviewSession)
class AIInterviewSessionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'user', 'skill_topic', 'level', 'status', 'started_at', 'duration_seconds')
    list_filter = ('status', 'level', 'started_at')
    search_fields = ('user__username', 'skill_topic', 'session_id')
    readonly_fields = ('session_id', 'started_at', 'created_at', 'updated_at')
    fieldsets = (
        ('Session Info', {
            'fields': ('session_id', 'user', 'status', 'started_at', 'ended_at', 'duration_seconds')
        }),
        ('Interview Config', {
            'fields': ('skill_topic', 'level', 'cv_text', 'system_prompt')
        }),
        ('Tavus Integration', {
            'fields': ('tavus_persona_id', 'tavus_conversation_id', 'conversation_url')
        }),
    )
    inlines = [TranscriptEntryInline]


@admin.register(InterviewTranscriptEntry)
class InterviewTranscriptEntryAdmin(admin.ModelAdmin):
    list_display = ('session', 'sequence_number', 'speaker', 'text_preview', 'timestamp')
    list_filter = ('speaker', 'timestamp')
    search_fields = ('session__session_id', 'text')
    readonly_fields = ('timestamp',)
    
    def text_preview(self, obj):
        return obj.text[:100] + "..." if len(obj.text) > 100 else obj.text
    text_preview.short_description = 'Text Preview'


@admin.register(AIPerformanceReport)
class AIPerformanceReportAdmin(admin.ModelAdmin):
    list_display = ('session', 'overall_score', 'topic_knowledge_score', 'communication_score', 'generated_at')
    list_filter = ('generated_at', 'overall_score')
    search_fields = ('session__session_id', 'session__skill_topic')
    readonly_fields = ('generated_at', 'overall_score')
    fieldsets = (
        ('Session', {
            'fields': ('session',)
        }),
        ('Summary', {
            'fields': ('performance_summary', 'recommendation')
        }),
        ('Detailed Feedback', {
            'fields': ('strengths', 'improvements')
        }),
        ('Scores', {
            'fields': (
                'topic_knowledge_score', 
                'communication_score', 
                'problem_solving_score', 
                'overall_score'
            )
        }),
    )
