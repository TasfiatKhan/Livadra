from django.http import StreamingHttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from services.ai_service import ai_service
from .serializers import TextingRequestSerializer


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

        stream = ai_service.stream_texting_response(
            user_id=request.user.id,
            conversation=serializer.validated_data['conversation'],
            user_request=serializer.validated_data['user_request'],
        )
        return StreamingHttpResponse(stream, content_type='text/plain; charset=utf-8')
