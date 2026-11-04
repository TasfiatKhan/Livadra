from django.urls import path
from .views import FeedbackView, SavedResponseView, SavedResponseListView, SavedResponseDetailView, CopyResponseView, ResponseStatusView

urlpatterns = [
    path('feedback/', FeedbackView.as_view(), name='feedback'),
    path('save/', SavedResponseView.as_view(), name='save-response'),
    path('saved/', SavedResponseListView.as_view(), name='saved-responses'),
    path('saved/<int:pk>/', SavedResponseDetailView.as_view(), name='saved-response-detail'),
    path('copy/', CopyResponseView.as_view(), name='copy-response'),
    path('status/', ResponseStatusView.as_view(), name='response-status'),
]
