from django.urls import path
from .views import TextingModeView, LiveModeView

urlpatterns = [
    path('texting/', TextingModeView.as_view(), name='texting-mode'),
    path('live/', LiveModeView.as_view(), name='live-mode'),
]
