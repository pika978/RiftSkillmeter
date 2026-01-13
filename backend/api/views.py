from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import Count

from .serializers import UserRegistrationSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    
    # Allow login with either username or email
    if email and not username:
        try:
            user_obj = User.objects.get(email=email)
            username = user_obj.username
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
    user = authenticate(username=username, password=password)
    
    if user is not None:
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })
    
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Successfully logged out'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    if request.method == 'GET':
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def hello_world(request):
    return Response({"message": "Hello from Django Backend!"})


# --- New CRUD Views ---

from .models import (
    LearnerProfile, Course, Chapter, Concept, Roadmap, ConceptProgress,
    Assessment, AssessmentResult, DailyTask, Notification, UserProgress
)
from .serializers import (
    LearnerProfileSerializer, CourseSerializer, RoadmapSerializer,
    ConceptProgressSerializer, AssessmentSerializer, AssessmentResultSerializer,
    DailyTaskSerializer, NotificationSerializer, UserProgressSerializer
)
from django.utils import timezone
from .services import ContentDiscoveryService, NotesGeneratorService, QuizGeneratorService

class LearnerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = LearnerProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return LearnerProfile.objects.get_or_create(user=self.request.user)[0]


class CourseListView(generics.ListAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]


class CourseDetailView(generics.RetrieveAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]


class RoadmapListCreateView(generics.ListCreateAPIView):
    serializer_class = RoadmapSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Roadmap.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RoadmapDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RoadmapSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Roadmap.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_concept_complete(request, concept_id):
    try:
        concept = Concept.objects.get(id=concept_id)
        
        # Get or create progress
        progress, created = ConceptProgress.objects.get_or_create(
            user=request.user,
            concept=concept
        )
        
        # Check if already completed to avoid double counting
        was_completed = progress.completed
        
        progress.completed = True
        progress.completed_at = timezone.now()
        progress.save()
        
        # --- Update Roadmap Progress ---
        course = concept.chapter.course
        total_concepts = Concept.objects.filter(chapter__course=course).count()
        completed_concepts_count = ConceptProgress.objects.filter(
            user=request.user, 
            concept__chapter__course=course, 
            completed=True
        ).count()
        
        if total_concepts > 0:
            roadmap_progress = int((completed_concepts_count / total_concepts) * 100)
            Roadmap.objects.filter(user=request.user, course=course).update(progress=roadmap_progress)

        # --- Update User Global Stats ---
        if not was_completed:
            user_stats, _ = UserProgress.objects.get_or_create(user=request.user)
            user_stats.total_concepts_completed += 1
            user_stats.total_minutes_learned += concept.duration
            
            # Update Streak
            today = timezone.now().date()
            if user_stats.last_activity_date != today:
                one_day_ago = today - timezone.timedelta(days=1)
                
                if user_stats.last_activity_date == one_day_ago:
                    user_stats.current_streak += 1
                elif user_stats.last_activity_date is None or user_stats.last_activity_date < one_day_ago:
                    user_stats.current_streak = 1
                
                user_stats.last_activity_date = today
                
                if user_stats.current_streak > user_stats.longest_streak:
                    user_stats.longest_streak = user_stats.current_streak
            
            user_stats.save()
        
        return Response({'status': 'Concept marked as complete'})
    except Concept.DoesNotExist:
        return Response({'error': 'Concept not found'}, status=status.HTTP_404_NOT_FOUND)


class AssessmentDetailView(generics.RetrieveAPIView):
    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated]


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_assessment(request, assessment_id):
    try:
        assessment = Assessment.objects.get(id=assessment_id)
        score = request.data.get('score', 0)
        answers = request.data.get('answers', [])
        
        result = AssessmentResult.objects.create(
            user=request.user,
            assessment=assessment,
            score=score,
            answers=answers
        )
        
        serializer = AssessmentResultSerializer(result)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Assessment.DoesNotExist:
        return Response({'error': 'Assessment not found'}, status=status.HTTP_404_NOT_FOUND)


class DailyTaskListView(generics.ListAPIView):
    serializer_class = DailyTaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return existing uncompleted tasks for today
        today = timezone.now().date()
        return DailyTask.objects.filter(user=self.request.user, completed=False, scheduled_date=today)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # If no tasks exist for today, generate them from current roadmap
        if not queryset.exists():
            self._generate_daily_tasks(request.user)
            queryset = self.get_queryset()
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def _generate_daily_tasks(self, user):
        """Generate up to 3 tasks from user's current roadmap uncompleted concepts."""
        today = timezone.now().date()
        
        # Get user's roadmaps
        roadmaps = Roadmap.objects.filter(user=user)
        if not roadmaps.exists():
            return
        
        # Get first roadmap (primary course)
        roadmap = roadmaps.first()
        course = roadmap.course
        
        # Find uncompleted concepts
        completed_concept_ids = ConceptProgress.objects.filter(
            user=user, completed=True
        ).values_list('concept_id', flat=True)
        
        uncompleted_concepts = Concept.objects.filter(
            chapter__course=course
        ).exclude(id__in=completed_concept_ids).order_by('chapter__order', 'order')[:3]
        
        # Create tasks
        for concept in uncompleted_concepts:
            DailyTask.objects.get_or_create(
                user=user,
                concept=concept,
                scheduled_date=today,
                defaults={
                    'task_type': 'video',
                    'title': f"Complete: {concept.title}",
                    'completed': False
                }
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_task(request, task_id):
    try:
        task = DailyTask.objects.get(id=task_id, user=request.user)
        task.completed = True
        task.save()
        return Response({'status': 'Task completed'})
    except DailyTask.DoesNotExist:
        return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    try:
        notif = Notification.objects.get(id=notification_id, user=request.user)
        notif.read = True
        notif.save()
        return Response({'status': 'Notification marked read'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)


class UserStatsView(generics.RetrieveAPIView):
    serializer_class = UserProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return UserProgress.objects.get_or_create(user=self.request.user)[0]


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_concept_notes(request, concept_id):
    """
    Generates AI notes for a concept on-demand.
    Returns cached notes if already generated.
    """
    try:
        concept = Concept.objects.get(id=concept_id)
        
        # Check if notes already exist (not placeholder)
        if concept.notes and not concept.notes.endswith('*Notes will be generated when you start this lesson.*'):
            return Response({'notes': concept.notes, 'cached': True})
        
        # Generate notes using AI
        notes = NotesGeneratorService.generate_notes(concept.title, concept.description)
        
        # Save to database
        concept.notes = notes
        concept.save()
        
        return Response({'notes': notes, 'cached': False})
        
    except Concept.DoesNotExist:
        return Response({'error': 'Concept not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_concept_quiz(request, concept_id):
    """
    Generates AI quiz for a concept on-demand.
    Returns cached quiz if already generated.
    """
    try:
        concept = Concept.objects.get(id=concept_id)
        
        # Check if quiz already exists for this concept
        existing_assessment = Assessment.objects.filter(concept=concept).first()
        if existing_assessment and existing_assessment.questions:
            return Response({
                'quiz': existing_assessment.questions, 
                'assessment_id': existing_assessment.id,
                'cached': True
            })
        
        # Generate quiz using AI
        quiz_data = QuizGeneratorService.generate_quiz(concept.title, concept.notes or concept.description)
        
        if not quiz_data:
            return Response({'error': 'Failed to generate quiz'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Create or update assessment
        assessment, created = Assessment.objects.get_or_create(
            concept=concept,
            defaults={'questions': quiz_data, 'time_limit': 10}
        )
        if not created:
            assessment.questions = quiz_data
            assessment.save()
        
        return Response({
            'quiz': quiz_data, 
            'assessment_id': assessment.id,
            'cached': False
        })
        
    except Concept.DoesNotExist:
        return Response({'error': 'Concept not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_roadmap_ai(request):
    """
    Generates a personalized roadmap using Gemini.
    """
    topic = request.data.get('topic')
    skill_level = request.data.get('skillLevel', 'beginner')
    
    if not topic:
        return Response({'error': 'Topic is required'}, status=status.HTTP_400_BAD_REQUEST)

    print(f"DEBUG: generate_roadmap_ai called for topic: {topic}")
    
    # 1. Discover Content
    ai_data = ContentDiscoveryService.search_videos(topic, skill_level)
    print(f"DEBUG: ContentDiscoveryService returned: {ai_data is not None}")
    
    if not ai_data or 'course' not in ai_data:
        return Response({'error': 'Could not generate content. Try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    course_data = ai_data['course']
    
    # 2. Create Course Structure
    course = Course.objects.create(
        title=course_data.get('title', f"Learn {topic}"),
        description=course_data.get('description', f"AI-generated course for {topic}"),
        difficulty=skill_level,
        estimated_hours=course_data.get('estimated_hours', 10),
        tags=course_data.get('tags', [topic, 'AI Generated'])
    )
    
    # 3. Create Chapters and Concepts
    chapters_data = ai_data.get('chapters', [])
    
    for i, chap_data in enumerate(chapters_data):
        chapter = Chapter.objects.create(
            course=course,
            title=chap_data.get('title', f"Chapter {i+1}"),
            order=i+1
        )
        
        for j, concept_data in enumerate(chap_data.get('concepts', [])):
            # Skip inline Notes/Quiz generation for speed - generate on demand later
            # notes = NotesGeneratorService.generate_notes(concept_data['title'], concept_data.get('description', ''))
            
            # Construct Search URL for video
            if 'video_url' in concept_data and concept_data['video_url']:
                 video_url = concept_data['video_url']
            else:
                 query = concept_data.get('video_query', concept_data['title'])
                 video_url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"
            
            concept = Concept.objects.create(
                chapter=chapter,
                title=concept_data['title'],
                description=concept_data.get('description', ''),
                video_url=video_url,
                duration=concept_data.get('duration_minutes', 15),
                notes=f"# {concept_data['title']}\n\n{concept_data.get('description', '')}\n\n*Notes will be generated when you start this lesson.*",
                content_type='video',
                order=j+1
            )
            
            # Skip Quiz generation for speed - can be generated on-demand
            # if j == 0:
            #     quiz_data = QuizGeneratorService.generate_quiz(concept_data['title'], notes)
            #     if quiz_data:
            #         Assessment.objects.create(
            #             concept=concept,
            #             questions=quiz_data,
            #             time_limit=10
            #         )

    # 4. Enroll User
    roadmap = Roadmap.objects.create(
        user=request.user,
        course=course,
        current_chapter=1,
        current_concept=1
    )
    
    serializer = RoadmapSerializer(roadmap)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


class ActivityLogView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        start_date = today - timezone.timedelta(days=365)
        
        # intricate query to group by date
        # For SQLite/Django simplicity, we can just fetch all completed items in range and process in python
        # OR use values('completed_at__date').annotate(count=Count('id'))
        
        activity = ConceptProgress.objects.filter(
            user=request.user,
            completed=True,
            completed_at__date__gte=start_date
        ).values('completed_at__date').annotate(count=Count('id')).order_by('completed_at__date')
        
        # Convert to dictionary for easy lookup
        activity_dict = {
            item['completed_at__date'].isoformat(): item['count'] 
            for item in activity 
            if item['completed_at__date']
        }
        
        return Response(activity_dict)


from .models import Lab
from .serializers import LabSerializer

class LabListCreateView(generics.ListCreateAPIView):
    serializer_class = LabSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Lab.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class LabDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LabSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Lab.objects.filter(user=self.request.user)
