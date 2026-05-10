from django.urls import path
from .views import FeedbackView, SavedResponseView, SavedResponseListView, CopyResponseView

urlpatterns = [
    path('feedback/', FeedbackView.as_view(), name='feedback'),
    path('save/', SavedResponseView.as_view(), name='save-response'),
    path('saved/', SavedResponseListView.as_view(), name='saved-responses'),
    path('copy/', CopyResponseView.as_view(), name='copy-response'),
]
