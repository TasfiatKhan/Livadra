import openai
from django.conf import settings
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from apps.responses.models import AIResponseRecord
from services.ai_service import ai_service
from .serializers import TextingRequestSerializer, LiveRequestSerializer, LiveVoiceRequestSerializer


def _record_response(user, mode, relationship_context, situation_summary, data):
    try:
        record = AIResponseRecord.objects.create(
            user=user,
            mode=mode,
            relationship_context=relationship_context,
            situation_summary=situation_summary[:200],
            response_json=data,
        )
        return record.id
    except Exception as e:
        print(f'AIResponseRecord save failed ({mode}):', str(e))
        return None


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

        vd = serializer.validated_data
        data = ai_service.get_texting_response(
            user_id=request.user.id,
            context=vd['context'],
            user_request=vd['user_request'],
            relationship_context=vd['relationship_context'],
            relationship_other=vd['relationship_other'],
            environment=vd['environment'],
        )
        record_id = _record_response(
            user=request.user,
            mode=AIResponseRecord.Mode.TEXTING,
            relationship_context=vd['relationship_context'],
            situation_summary=vd['user_request'],
            data=data,
        )
        return Response({**data, 'record_id': record_id})


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

        vd = serializer.validated_data
        data = ai_service.get_live_response(
            user_id=request.user.id,
            situation=vd['situation'],
            user_request=vd['user_request'],
            relationship_context=vd['relationship_context'],
            relationship_other=vd['relationship_other'],
            environment=vd['environment'],
        )
        summary = (vd['situation'] + ' ' + vd['user_request']).strip()
        record_id = _record_response(
            user=request.user,
            mode=AIResponseRecord.Mode.LIVE,
            relationship_context=vd['relationship_context'],
            situation_summary=summary,
            data=data,
        )
        return Response({**data, 'record_id': record_id})


class LiveVoiceView(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LiveVoiceRequestSerializer(data=request.data)
        if not serializer.is_valid():
            print("LiveVoiceView validation errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.is_onboarding_complete:
            return Response(
                {'detail': 'Please complete your profile before using this feature.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        audio_file = serializer.validated_data['audio']
        try:
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            transcription = client.audio.transcriptions.create(
                model='whisper-1',
                file=(audio_file.name, audio_file.read(), audio_file.content_type),
            )
        except Exception as e:
            print("Whisper transcription error:", str(e))
            return Response(
                {'detail': 'Audio transcription failed. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        vd = serializer.validated_data
        data = ai_service.get_live_response(
            user_id=request.user.id,
            situation='',
            user_request=transcription.text,
            relationship_context=vd['relationship_context'],
            relationship_other=vd['relationship_other'],
            environment=vd['environment'],
        )
        record_id = _record_response(
            user=request.user,
            mode=AIResponseRecord.Mode.LIVE_VOICE,
            relationship_context=vd['relationship_context'],
            situation_summary=transcription.text,
            data=data,
        )
        return Response({**data, 'record_id': record_id})
