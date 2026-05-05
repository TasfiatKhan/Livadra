from django.urls import path
from .views import TextingModeView

urlpatterns = [
    path('texting/', TextingModeView.as_view(), name='texting-mode'),
]
