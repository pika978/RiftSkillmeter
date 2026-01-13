from django.contrib import admin
from .models import (
    LearnerProfile, Course, Chapter, Concept, Roadmap, ConceptProgress,
    Assessment, AssessmentResult, DailyTask, Notification, UserProgress, Lab
)

@admin.register(LearnerProfile)
class LearnerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'skill_level', 'daily_study_time', 'onboarding_completed')
    search_fields = ('user__username', 'user__email')

class ChapterInline(admin.StackedInline):
    model = Chapter
    extra = 1

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'difficulty', 'estimated_hours', 'created_at')
    search_fields = ('title',)
    list_filter = ('difficulty',)
    inlines = [ChapterInline]

class ConceptInline(admin.StackedInline):
    model = Concept
    extra = 1

@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order')
    list_filter = ('course',)
    inlines = [ConceptInline]

@admin.register(Concept)
class ConceptAdmin(admin.ModelAdmin):
    list_display = ('title', 'chapter', 'content_type', 'duration', 'order')
    list_filter = ('content_type',)
    search_fields = ('title', 'chapter__title')

@admin.register(Roadmap)
class RoadmapAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'progress', 'current_chapter', 'current_concept', 'last_accessed_at')
    list_filter = ('course',)
    search_fields = ('user__username', 'course__title')

@admin.register(ConceptProgress)
class ConceptProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'concept', 'completed', 'completed_at')
    list_filter = ('completed',)

@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ('concept', 'time_limit', 'created_at')

@admin.register(AssessmentResult)
class AssessmentResultAdmin(admin.ModelAdmin):
    list_display = ('user', 'assessment', 'score', 'completed_at')

@admin.register(DailyTask)
class DailyTaskAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'task_type', 'scheduled_date', 'completed')
    list_filter = ('completed', 'task_type', 'scheduled_date')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'notification_type', 'read', 'created_at')
    list_filter = ('read', 'notification_type')

@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_minutes_learned', 'current_streak')

@admin.register(Lab)
class LabAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'language', 'updated_at')
