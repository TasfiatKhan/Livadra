from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from .models import UserProfile
from .serializers import ProfileSerializer, ProfileUpdateSerializer
from .cache import invalidate_profile_cache, set_cached_profile


class ProfileView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, _ = UserProfile.objects.select_related('user').get_or_create(user=self.request.user)
        return profile

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ProfileUpdateSerializer
        return ProfileSerializer

    def perform_update(self, serializer):
        profile = serializer.save()
        invalidate_profile_cache(profile.user_id)
        set_cached_profile(profile.user_id, ProfileSerializer(profile).data)
