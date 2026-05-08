from django.urls import path
from .views import FeedbackView, SavedResponseView

urlpatterns = [
    path('feedback/', FeedbackView.as_view(), name='feedback'),
    path('save/', SavedResponseView.as_view(), name='save-response'),
]
