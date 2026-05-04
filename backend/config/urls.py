# TODO: add URL versioning (/api/v1/) before public launch
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('api/users/', include('apps.users.urls')),
    path('api/profiles/', include('apps.profiles.urls')),
    path('api/humor/', include('apps.humor.urls')),
]
