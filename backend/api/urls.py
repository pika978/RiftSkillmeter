from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView, login_view, logout_view, user_profile_view, hello_world,
    LearnerProfileView, CourseListView, CourseDetailView,
    RoadmapListCreateView, RoadmapDetailView, mark_concept_complete,
    AssessmentDetailView, submit_assessment, complete_task,
    mark_notification_read, generate_concept_notes, generate_concept_quiz,
    LabListCreateView, LabDetailView, generate_certificate,
    study_sessions_view, study_session_stats, verify_certificate,
    generate_roadmap_ai, DailyTaskListView, NotificationListView, 
    UserStatsView, ActivityLogView,
    get_leaderboard, get_trending_topics,
    MentorListCreateView, MentorDetailView, BookingCreateView, 
    BookingListView, MentorDashboardBookingListView, update_booking_status,
    mentor_stats_view, mentor_availability_view, mentor_payments_view,
    upload_resume,
    download_badge_image,
    mint_certificate_nft,
    list_assessment_results
)

# AI Interview routes
from .interview_routes import (
    start_interview,
    upload_cv,
    end_interview,
    get_session_status,
    get_transcript,
)

urlpatterns = [
    path('hello/', hello_world, name='hello_world'),
    
    # Resume Upload
    path('upload-resume/', upload_resume, name='upload_resume'),
    
    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/user/', user_profile_view, name='user_profile'),

    # Feature endpoints
    path('profile/', LearnerProfileView.as_view(), name='learner_profile'),
    
    path('courses/', CourseListView.as_view(), name='course_list'),
    path('courses/<int:pk>/', CourseDetailView.as_view(), name='course_detail'),
    
    path('roadmaps/', RoadmapListCreateView.as_view(), name='roadmap_list'),
    path('roadmaps/generate/', generate_roadmap_ai, name='roadmap_generate_ai'),
    path('roadmaps/<int:pk>/', RoadmapDetailView.as_view(), name='roadmap_detail'),
    path('roadmaps/<int:roadmap_id>/certificate/', generate_certificate, name='roadmap_certificate'),
    path('roadmaps/<int:roadmap_id>/mint-nft/', mint_certificate_nft, name='roadmap_mint_nft'),
    path('certificates/verify/<str:cert_id>/', verify_certificate, name='certificate_verify'),
    path('leaderboard/', get_leaderboard, name='leaderboard'),
    path('trending/', get_trending_topics, name='trending_topics'),
    
    path('concepts/<int:concept_id>/complete/', mark_concept_complete, name='concept_complete'),
    path('concepts/<int:concept_id>/generate-notes/', generate_concept_notes, name='concept_generate_notes'),
    path('concepts/<int:concept_id>/generate-quiz/', generate_concept_quiz, name='concept_generate_quiz'),
    
    path('assessments/<int:pk>/', AssessmentDetailView.as_view(), name='assessment_detail'),
    path('assessments/<int:assessment_id>/submit/', submit_assessment, name='assessment_submit'),
    path('assessments/results/', list_assessment_results, name='assessment_results'),
    path('assessments/results/<int:result_id>/badge-image/', download_badge_image, name='badge_image'),
    
    path('tasks/', DailyTaskListView.as_view(), name='task_list'),
    path('tasks/<int:task_id>/complete/', complete_task, name='task_complete'),
    
    path('notifications/', NotificationListView.as_view(), name='notification_list'),
    path('notifications/<int:notification_id>/read/', mark_notification_read, name='notification_read'),
    
    path('progress/', UserStatsView.as_view(), name='user_stats'),
    path('activity/', ActivityLogView.as_view(), name='activity_log'),
    
    # Lab endpoints
    path('labs/', LabListCreateView.as_view(), name='lab_list'),
    path('labs/<int:pk>/', LabDetailView.as_view(), name='lab_detail'),
    
    # Study Room / Study Session endpoints
    path('study-sessions/', study_sessions_view, name='study_sessions'),
    path('study-sessions/stats/', study_session_stats, name='study_session_stats'),
    
    # Mentor Connect Endpoints
    path('mentors/', MentorListCreateView.as_view(), name='mentor_list'),
    path('mentors/<int:pk>/', MentorDetailView.as_view(), name='mentor_detail'),
    
    path('bookings/request/', BookingCreateView.as_view(), name='booking_request'),
    path('bookings/my-sessions/', BookingListView.as_view(), name='booking_list_learner'),
    path('bookings/mentor-sessions/', MentorDashboardBookingListView.as_view(), name='booking_list_mentor'),
    path('bookings/<int:booking_id>/status/', update_booking_status, name='booking_update_status'),
    
    # Mentor Dashboard Real-Time Data
    path('mentor/stats/', mentor_stats_view, name='mentor_stats'),
    path('mentor/availability/', mentor_availability_view, name='mentor_availability'),
    path('mentor/payments/', mentor_payments_view, name='mentor_payments'),
    
    # AI Interview Endpoints
    path('interview/start/', start_interview, name='interview_start'),
    path('interview/<str:session_id>/upload-cv/', upload_cv, name='interview_upload_cv'),
    path('interview/<str:session_id>/end/', end_interview, name='interview_end'),
    path('interview/<str:session_id>/status/', get_session_status, name='interview_status'),
    path('interview/<str:session_id>/transcript/', get_transcript, name='interview_transcript'),
]
