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
from .utils.notifications import send_email_notification, send_whatsapp_notification
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Sum, F
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

            # --- Notification Trigger: Course Completion (100%) ---
            if roadmap_progress == 100:
                # Set the completion timestamp (Root Fix: Accurate completion date)
                Roadmap.objects.filter(user=request.user, course=course, completed_at__isnull=True).update(completed_at=timezone.now())
                
                print(f"🎉 Triggering Completion Notifications for {request.user.username}")
                # 1. Email
                send_email_notification(
                    user=request.user,
                    subject=f"Congratulations! You Completed {course.title} 🎓",
                    message=f"Hi {request.user.username},\n\nFantastic job completing the '{course.title}' course! You have mastered all the concepts.\n\nKeep up the great learning stride!\n\n- The SkillMeter Team"
                )
                # 2. WhatsApp
                send_whatsapp_notification(
                    user=request.user,
                    message_body=f"🚀 Milestone Unlocked: You just finished '{course.title}' on SkillMeter! 🎓 Good job!"
                )

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

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        
        # Calculate Rank (Consistent with Leaderboard API)
        try:
            from django.contrib.auth.models import User
            # Get all users with some progress
            users_with_progress = User.objects.filter(concept_progress__completed=True).distinct()
            
            leaderboard_data = [] # List of dicts {username, points}
            
            # 1. Calculate scores for all users
            for user in users_with_progress:
                concepts = ConceptProgress.objects.filter(user=user, completed=True).count()
                roadmaps = Roadmap.objects.filter(user=user).count()
                score = (concepts * 10) + (roadmaps * 50)
                
                leaderboard_data.append({
                    'username': user.username,
                    'points': score
                })

            # Check if current user is in the list, if not add them (score 0 or enrollment only)
            if not any(u['username'] == request.user.username for u in leaderboard_data):
                my_roadmaps = Roadmap.objects.filter(user=request.user).count()
                my_score = (0 * 10) + (my_roadmaps * 50)
                leaderboard_data.append({
                    'username': request.user.username,
                    'points': my_score
                })

            # 2. Deterministic Sort: Points DESC, then Username ASC
            # We sort by (-points, username) to achieve Descending Points and Ascending Username
            leaderboard_data.sort(key=lambda x: (-x['points'], x['username']))
            
            # 3. Find my rank
            rank = 0
            for i, entry in enumerate(leaderboard_data):
                if entry['username'] == request.user.username:
                    rank = i + 1
                    break
            
            data['rank'] = rank
            
        except Exception as e:
            print(f"Error calculating rank: {e}")
            data['rank'] = 0
            
        return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_leaderboard(request):
    try:
        from django.contrib.auth.models import User
        
        # Calculate leaderboard from actual data:
        # - concepts_completed: Count of completed ConceptProgress per user
        # - courses_progress: Sum of progress across Roadmaps
        
        leaderboard = []
        
        # Get all users who have any learning activity
        users_with_progress = User.objects.filter(
            concept_progress__completed=True
        ).distinct()
        
        for user in users_with_progress:
            # Count completed concepts
            concepts_completed = ConceptProgress.objects.filter(
                user=user, completed=True
            ).count()
            
            # Calculate score: concepts * 10 + each course enrollment * 50
            roadmaps_count = Roadmap.objects.filter(user=user).count()
            score = (concepts_completed * 10) + (roadmaps_count * 50)
            
            leaderboard.append({
                'rank': 0,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'username': user.username, # Added for sorting stability
                'points': score,
                'badge': ''
            })
        
        # Deterministic Sort: Points DESC, then Username ASC
        # This matches the UserStatsView rank calculation exactly
        leaderboard.sort(key=lambda x: (-x['points'], x['username']))
        
        # Take top 5 and assign ranks/badges
        top_5 = leaderboard[:5]
        for i, entry in enumerate(top_5):
            entry['rank'] = i + 1
            if i == 0: entry['badge'] = '🥇'
            elif i == 1: entry['badge'] = '🥈'
            elif i == 2: entry['badge'] = '🥉'
            else: entry['badge'] = str(i + 1)
        
        return Response(top_5)
    except Exception as e:
        print(f"Error fetching leaderboard: {e}")
        return Response({'error': str(e)}, status=500)


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
    
    if not ai_data:
        return Response({'error': 'AI Service returned no data.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if 'error' in ai_data:
        return Response({'error': f"AI Generation Failed: {ai_data['error']}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    if 'course' not in ai_data:
        return Response({'error': 'AI returned invalid format. Try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    course_data = ai_data['course']
    
    # 2. Create Course Structure
    course = Course.objects.create(
        title=course_data.get('title', f"Learn {topic}"),
        description=course_data.get('description', f"AI-generated course for {topic}"),
        thumbnail=course_data.get('thumbnail', ''), # Use dynamic thumbnail
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
            # Prioritize real video URL from YouTube API
            if 'video_url' in concept_data and concept_data['video_url']:
                 video_url = concept_data['video_url']
            else:
                 # Fallback to search query
                 query = concept_data.get('video_search_query', concept_data.get('title', ''))
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
        current_chapter=0,
        current_concept=0
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


# Certificate Generation
from django.http import HttpResponse
import hashlib
from datetime import datetime
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_certificate(request, roadmap_id):
    """
    Generate a PDF certificate for a completed course.
    Only available when progress is 100%.
    """
    try:
        roadmap = Roadmap.objects.get(id=roadmap_id, user=request.user)
        print(f"DEBUG Certificate: Found roadmap {roadmap_id}, progress={roadmap.progress}")
    except Roadmap.DoesNotExist:
        print(f"DEBUG Certificate: Roadmap {roadmap_id} not found for user {request.user}")
        return Response({'error': 'Roadmap not found'}, status=404)
    
    # Check if course is completed
    if roadmap.progress < 100:
        return Response({'error': 'Course not completed yet. Complete all lessons to get your certificate.'}, status=400)
    
    # Generate or Retrieve unique certificate ID
    if roadmap.certificate_id:
        cert_id = roadmap.certificate_id
    else:
        cert_data = f"{request.user.id}-{roadmap_id}-{roadmap.course.title}"
        cert_id = hashlib.sha256(cert_data.encode()).hexdigest()[:12].upper()
        roadmap.certificate_id = cert_id
        roadmap.save()
    
    # Generate PDF Content using Utility
    from .utils.certificate import generate_certificate_pdf
    
    user_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
    last_accessed = roadmap.last_accessed_at if roadmap.last_accessed_at else datetime.now()
    
    try:
        pdf_content = generate_certificate_pdf(
            user_name=user_name,
            course_title=roadmap.course.title,
            completion_date=last_accessed,
            cert_id=cert_id
        )
    except Exception as e:
        print(f"Error generating certificate PDF: {e}")
        return Response({'error': 'Failed to generate certificate'}, status=500)
    
    # Create response
    response = HttpResponse(pdf_content, content_type='application/pdf')
    safe_title = roadmap.course.title.replace(' ', '_')[:30]
    response['Content-Disposition'] = f'attachment; filename="SkillMeter_Certificate_{safe_title}.pdf"'
    
    # --- Notification Trigger: Email with Certificate ---
    try:
        send_email_notification(
            user=request.user,
            subject=f"Your Certificate for {roadmap.course.title}",
            message="Please find attached your official certificate of completion.",
            attachment=(f'SkillMeter_Certificate_{safe_title}.pdf', pdf_content, 'application/pdf')
        )
        # WhatsApp notification for certificate
        send_whatsapp_notification(
            user=request.user,
            message_body=f"🎓 Your certificate for '{roadmap.course.title}' is ready! Check your email for the PDF. Congrats!"
        )
    except Exception as e:
        print(f"Failed to send certificate notifications: {e}")

    return response


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_certificate(request, cert_id):
    """
    Public API to verify a certificate by its unique ID.
    Returns certificate details if valid.
    """
    try:
        roadmap = Roadmap.objects.get(certificate_id=cert_id)
        
        # Ensure it's completed (security check)
        if roadmap.progress < 100:
            return Response({'error': 'Certificate invalid'}, status=400)
            
        data = {
            'valid': True,
            'certificate_id': cert_id,
            'student_name': f"{roadmap.user.first_name} {roadmap.user.last_name}".strip() or roadmap.user.username,
            'course_title': roadmap.course.title,
            'completion_date': roadmap.completed_at or roadmap.last_accessed_at,
            'issue_date': roadmap.completed_at or roadmap.last_accessed_at,
        }
        return Response(data)
    except Roadmap.DoesNotExist:
        return Response({'valid': False, 'error': 'Certificate ID not found'}, status=404)


# ===== Study Room / Study Session API =====

from .models import StudySession
from .serializers import StudySessionSerializer

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def study_sessions_view(request):
    """
    GET: List all study sessions for the authenticated user
    POST: Create a new study session
    """
    if request.method == 'GET':
        sessions = StudySession.objects.filter(user=request.user)
        serializer = StudySessionSerializer(sessions, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = StudySessionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def study_session_stats(request):
    """
    Get aggregated statistics for the user's study sessions.
    """
    from django.db.models import Sum, Avg
    
    sessions = StudySession.objects.filter(user=request.user)
    
    total_sessions = sessions.count()
    total_focus_time = sessions.aggregate(total=Sum('focus_duration'))['total'] or 0
    total_study_time = sessions.aggregate(total=Sum('total_duration'))['total'] or 0
    total_distractions = sessions.aggregate(total=Sum('distraction_count'))['total'] or 0
    avg_focus_percentage = sessions.aggregate(avg=Avg('focus_percentage'))['avg'] or 100.0
    
    return Response({
        'totalSessions': total_sessions,
        'totalFocusTime': total_focus_time,  # in seconds
        'totalStudyTime': total_study_time,  # in seconds
        'totalDistractions': total_distractions,
        'averageFocusPercentage': round(avg_focus_percentage, 1),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_leaderboard(request):
    try:
        from django.contrib.auth.models import User
        
        # Calculate leaderboard from actual data:
        # - concepts_completed: Count of completed ConceptProgress per user
        # - courses_progress: Sum of progress across Roadmaps
        
        leaderboard = []
        
        # Get all users who have any learning activity
        users_with_progress = User.objects.filter(
            concept_progress__completed=True
        ).distinct()
        
        for user in users_with_progress:
            # Count completed concepts
            concepts_completed = ConceptProgress.objects.filter(
                user=user, completed=True
            ).count()
            
            # Calculate score: concepts * 10 + each course enrollment * 50
            roadmaps_count = Roadmap.objects.filter(user=user).count()
            score = (concepts_completed * 10) + (roadmaps_count * 50)
            
            leaderboard.append({
                'rank': 0,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'points': score,
                'badge': ''
            })
        
        # Sort by points descending
        leaderboard.sort(key=lambda x: x['points'], reverse=True)
        
        # Take top 5 and assign ranks/badges
        top_5 = leaderboard[:5]
        for i, entry in enumerate(top_5):
            entry['rank'] = i + 1
            if i == 0: entry['badge'] = '🥇'
            elif i == 1: entry['badge'] = '🥈'
            elif i == 2: entry['badge'] = '🥉'
            else: entry['badge'] = str(i + 1)
        
        return Response(top_5)
    except Exception as e:
        print(f"Error fetching leaderboard: {e}")
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_trending_topics(request):
    try:
        # Get courses with most enrollments (Roadmaps)
        # For "trending", we could filter by recent creation date, but for now usage count is good
        trending = Roadmap.objects.values('course__title').annotate(
            learners=Count('id')
        ).order_by('-learners')[:5]
        
        result = []
        for item in trending:
            # Mock growth for now as we don't have historical snapshots
            # In prod, compare with last week's count
            import random
            growth = random.randint(5, 30)
            
            result.append({
                'topic': item['course__title'],
                'learners': item['learners'],
                'growth': f"+{growth}%"
            })
            
        return Response(result)
    except Exception as e:
        print(f"Error fetching trending topics: {e}")
        return Response({'error': str(e)}, status=500)

