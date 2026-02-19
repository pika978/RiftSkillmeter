from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from django.db.models import Sum, Count
from datetime import timedelta


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    is_mentor = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name', 'is_mentor')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': False},
            'email': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        from .models import LearnerProfile, MentorProfile
        
        # Pop is_mentor before creating user
        is_mentor = validated_data.pop('is_mentor', False)
        validated_data.pop('password2')  # Remove password2 as it's not a User field
        
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        user.set_password(validated_data['password'])
        user.save()
        
        if is_mentor:
            # Create MentorProfile for mentors
            MentorProfile.objects.get_or_create(
                user=user,
                defaults={
                    'title': 'Mentor',
                    'hourly_rate': 10.00,
                    'about': 'New mentor on SkillMeter',
                    'skills': []
                }
            )
        else:
            # Auto-create LearnerProfile for students
            LearnerProfile.objects.get_or_create(
                user=user,
                defaults={'phone_number': '+919518380879'}
            )
        
        return user


class UserSerializer(serializers.ModelSerializer):
    isMentor = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'isMentor')
        read_only_fields = ('id', 'date_joined', 'isMentor')
    
    def get_isMentor(self, obj):
        return hasattr(obj, 'mentor_profile')


from .models import (
    LearnerProfile, Course, Chapter, Concept, Roadmap, ConceptProgress,
    Assessment, AssessmentResult, DailyTask, Notification, UserProgress
)

class LearnerProfileSerializer(serializers.ModelSerializer):
    skillLevel = serializers.CharField(source='skill_level')
    learningGoals = serializers.JSONField(source='learning_goals')
    dailyStudyTime = serializers.IntegerField(source='daily_study_time')
    onboardingCompleted = serializers.BooleanField(source='onboarding_completed')
    algoWallet = serializers.CharField(source='algo_wallet', required=False, allow_blank=True, allow_null=True)
    pendingSkillTokens = serializers.IntegerField(source='pending_skill_tokens', read_only=True)

    class Meta:
        model = LearnerProfile
        fields = ('id', 'user', 'skillLevel', 'learningGoals', 'dailyStudyTime', 'onboardingCompleted', 'algoWallet', 'pendingSkillTokens')
        read_only_fields = ('user', 'pendingSkillTokens')

class ConceptSerializer(serializers.ModelSerializer):
    videoUrl = serializers.URLField(source='video_url')
    contentType = serializers.CharField(source='content_type')

    completed = serializers.SerializerMethodField()

    class Meta:
        model = Concept
        fields = ('id', 'title', 'description', 'duration', 'videoUrl', 'notes', 'contentType', 'order', 'completed')

    def get_completed(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            return ConceptProgress.objects.filter(user=user, concept=obj, completed=True).exists()
        return False

class ChapterSerializer(serializers.ModelSerializer):
    concepts = ConceptSerializer(many=True, read_only=True)
    
    class Meta:
        model = Chapter
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)
    estimatedHours = serializers.IntegerField(source='estimated_hours')

    class Meta:
        model = Course
        fields = ('id', 'title', 'description', 'thumbnail', 'difficulty', 'estimatedHours', 'tags', 'chapters')
        read_only_fields = ('created_at', 'updated_at')

class ConceptProgressSerializer(serializers.ModelSerializer):
    completedAt = serializers.DateTimeField(source='completed_at')

    class Meta:
        model = ConceptProgress
        fields = ('id', 'user', 'concept', 'completed', 'completedAt')
        read_only_fields = ('user',)

class RoadmapSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(), source='course', write_only=True
    )
    currentChapter = serializers.IntegerField(source='current_chapter')
    currentConcept = serializers.IntegerField(source='current_concept')
    startedAt = serializers.DateTimeField(source='started_at')
    lastAccessedAt = serializers.DateTimeField(source='last_accessed_at')
    completedAt = serializers.DateTimeField(source='completed_at', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    
    class Meta:
        model = Roadmap
        fields = ('id', 'user', 'course', 'course_id', 'progress', 'currentChapter', 'currentConcept', 'startedAt', 'lastAccessedAt', 'completedAt', 'certificate_id', 'nft_asset_id', 'course_title')
        read_only_fields = ('user', 'startedAt', 'lastAccessedAt', 'completedAt', 'certificate_id', 'nft_asset_id', 'course_title')

class AssessmentSerializer(serializers.ModelSerializer):
    timeLimit = serializers.IntegerField(source='time_limit')

    class Meta:
        model = Assessment
        fields = ('id', 'concept', 'questions', 'timeLimit')

class AssessmentResultSerializer(serializers.ModelSerializer):
    completedAt = serializers.DateTimeField(source='completed_at')
    conceptTitle = serializers.CharField(source='assessment.concept.title', read_only=True, default='')
    conceptId    = serializers.CharField(source='assessment.concept.id', read_only=True, default='')

    class Meta:
        model = AssessmentResult
        fields = ('id', 'user', 'assessment', 'score', 'answers', 'completedAt', 'badge_asset_id', 'conceptTitle', 'conceptId')
        read_only_fields = ('user', 'completedAt', 'badge_asset_id')

class DailyTaskSerializer(serializers.ModelSerializer):
    taskType = serializers.CharField(source='task_type')
    scheduledDate = serializers.DateField(source='scheduled_date')

    class Meta:
        model = DailyTask
        fields = ('id', 'user', 'concept', 'taskType', 'title', 'scheduledDate', 'completed')
        read_only_fields = ('user',)

class NotificationSerializer(serializers.ModelSerializer):
    notificationType = serializers.CharField(source='notification_type')
    createdAt = serializers.DateTimeField(source='created_at')

    class Meta:
        model = Notification
        fields = ('id', 'user', 'notificationType', 'title', 'message', 'read', 'createdAt')
        read_only_fields = ('user', 'createdAt')

class UserProgressSerializer(serializers.ModelSerializer):
    totalMinutesLearned = serializers.IntegerField(source='total_minutes_learned')
    totalConceptsCompleted = serializers.IntegerField(source='total_concepts_completed')
    totalAssessmentsTaken = serializers.IntegerField(source='total_assessments_taken')
    averageScore = serializers.IntegerField(source='average_score')
    currentStreak = serializers.IntegerField(source='current_streak')
    longestStreak = serializers.IntegerField(source='longest_streak')
    lastActivityDate = serializers.DateField(source='last_activity_date')
    totalCoursesEnrolled = serializers.SerializerMethodField()
    dailyProgress = serializers.SerializerMethodField()

    class Meta:
        model = UserProgress
        fields = ('id', 'user', 'totalMinutesLearned', 'totalConceptsCompleted', 'totalAssessmentsTaken', 'averageScore', 'currentStreak', 'longestStreak', 'lastActivityDate', 'totalCoursesEnrolled', 'dailyProgress')
        read_only_fields = ('user',)

    def get_totalCoursesEnrolled(self, obj):
        return obj.user.roadmaps.count()

    def get_dailyProgress(self, obj):
        today = timezone.now().date()
        daily_data = []
        
        for i in range(6, -1, -1):
            date = today - timedelta(days=i)
            # Find completed concepts for this user on this date
            completed = ConceptProgress.objects.filter(
                user=obj.user,
                completed=True,
                completed_at__date=date
            ).aggregate(
                minutes=Sum('concept__duration'),
                count=Count('id')
            )
            
            daily_data.append({
                'date': date.isoformat(),
                'minutesLearned': completed['minutes'] or 0,
                'conceptsCompleted': completed['count'] or 0
            })
            
        return daily_data

from .models import Lab

class LabSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lab
        fields = ('id', 'user', 'name', 'language', 'files', 'created_at', 'updated_at')
        read_only_fields = ('user', 'created_at', 'updated_at')


from .models import StudySession

class StudySessionSerializer(serializers.ModelSerializer):
    startedAt = serializers.DateTimeField(source='started_at')
    endedAt = serializers.DateTimeField(source='ended_at', read_only=True)
    totalDuration = serializers.IntegerField(source='total_duration')
    focusDuration = serializers.IntegerField(source='focus_duration')
    distractionCount = serializers.IntegerField(source='distraction_count')
    focusPercentage = serializers.FloatField(source='focus_percentage')

    class Meta:
        model = StudySession
        fields = ('id', 'user', 'startedAt', 'endedAt', 'totalDuration', 'focusDuration', 'distractionCount', 'focusPercentage')
        read_only_fields = ('user', 'endedAt')


from .models import MentorProfile, MentorSlot, Booking

class MentorProfileSerializer(serializers.ModelSerializer):
    hourlyRate = serializers.DecimalField(source='hourly_rate', max_digits=10, decimal_places=2)
    totalEarnings = serializers.DecimalField(source='total_earnings', max_digits=12, decimal_places=2, read_only=True)
    averageRating = serializers.FloatField(source='average_rating', read_only=True)
    firstName = serializers.CharField(source='user.first_name', read_only=True)
    lastName = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = MentorProfile
        fields = ('id', 'user', 'firstName', 'lastName', 'email', 'title', 'company', 'hourlyRate', 'about', 'skills', 'is_verified', 'totalEarnings', 'averageRating', 'created_at')
        read_only_fields = ('user', 'is_verified', 'totalEarnings', 'averageRating')

class MentorSlotSerializer(serializers.ModelSerializer):
    startTime = serializers.DateTimeField(source='start_time')
    endTime = serializers.DateTimeField(source='end_time')
    isBooked = serializers.BooleanField(source='is_booked')

    class Meta:
        model = MentorSlot
        fields = ('id', 'mentor', 'startTime', 'endTime', 'isBooked')
        read_only_fields = ('mentor',)

class BookingSerializer(serializers.ModelSerializer):
    mentorName = serializers.CharField(source='mentor.user.get_full_name', read_only=True)
    mentorTitle = serializers.CharField(source='mentor.title', read_only=True)
    learnerName = serializers.CharField(source='learner.get_full_name', read_only=True)
    amountPaid = serializers.DecimalField(source='amount_paid', max_digits=10, decimal_places=2)
    meetingLink = serializers.URLField(source='meeting_link', read_only=True)
    
    class Meta:
        model = Booking
        fields = ('id', 'learner', 'mentor', 'mentorName', 'mentorTitle', 'learnerName', 'slot', 'status', 'meetingLink', 'topic', 'amountPaid', 'created_at')
        read_only_fields = ('learner', 'meetingLink', 'created_at')
