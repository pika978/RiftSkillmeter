from django.urls import re_path
from . import consumers
from .interview_websocket import InterviewAudioConsumer

websocket_urlpatterns = [
    re_path(r'ws/interview/$', consumers.InterviewConsumer.as_asgi()),
    re_path(r'ws/interview/(?P<session_id>[^/]+)/stream/$', InterviewAudioConsumer.as_asgi()),
]
