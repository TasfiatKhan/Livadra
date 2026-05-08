from django.urls import path
from .views import MomentListCreateView, MomentDetailView, MomentContinueView, MomentArchiveView

urlpatterns = [
    path('', MomentListCreateView.as_view(), name='moment-list-create'),
    path('<int:pk>/', MomentDetailView.as_view(), name='moment-detail'),
    path('<int:pk>/continue/', MomentContinueView.as_view(), name='moment-continue'),
    path('<int:pk>/archive/', MomentArchiveView.as_view(), name='moment-archive'),
]
