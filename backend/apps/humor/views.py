from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from services.ai_service import ai_service
from .serializers import TextingRequestSerializer, LiveRequestSerializer


class TextingModeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TextingRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.is_onboarding_complete:
            return Response(
                {'detail': 'Please complete your profile before using this feature.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = ai_service.get_texting_response(
            user_id=request.user.id,
            context=serializer.validated_data['context'],
            user_request=serializer.validated_data['user_request'],
            relationship_context=serializer.validated_data['relationship_context'],
            relationship_other=serializer.validated_data['relationship_other'],
            environment=serializer.validated_data['environment'],
        )
        return Response(data)


class LiveModeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LiveRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.is_onboarding_complete:
            return Response(
                {'detail': 'Please complete your profile before using this feature.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = ai_service.get_live_response(
            user_id=request.user.id,
            situation=serializer.validated_data['situation'],
            user_request=serializer.validated_data['user_request'],
            relationship_context=serializer.validated_data['relationship_context'],
            relationship_other=serializer.validated_data['relationship_other'],
            environment=serializer.validated_data['environment'],
        )
        return Response(data)
