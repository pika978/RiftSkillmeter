from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView, login_view, logout_view, user_profile_view, hello_world,
    LearnerProfileView, CourseListView, CourseDetailView,
    RoadmapListCreateView, RoadmapDetailView, mark_concept_complete,
    AssessmentDetailView, submit_assessment,
    DailyTaskListView, complete_task,
    NotificationListView, mark_notification_read, UserStatsView,
    generate_roadmap_ai, generate_concept_notes, generate_concept_quiz,
    ActivityLogView, LabListCreateView, LabDetailView, generate_certificate,
    study_sessions_view, study_session_stats
)

urlpatterns = [
    path('hello/', hello_world, name='hello_world'),
    
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
    
    path('concepts/<int:concept_id>/complete/', mark_concept_complete, name='concept_complete'),
    path('concepts/<int:concept_id>/generate-notes/', generate_concept_notes, name='concept_generate_notes'),
    path('concepts/<int:concept_id>/generate-quiz/', generate_concept_quiz, name='concept_generate_quiz'),
    
    path('assessments/<int:pk>/', AssessmentDetailView.as_view(), name='assessment_detail'),
    path('assessments/<int:assessment_id>/submit/', submit_assessment, name='assessment_submit'),
    
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
]
