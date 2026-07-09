import json
import logging

import anthropic
import openai
from django.conf import settings
from django.db.models import Count
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView
from rest_framework import status

from services.ai_service import ai_service
from apps.responses.models import AIResponseRecord
from .models import Moment, MomentMessage
from .serializers import (
    MomentSerializer, MomentDetailSerializer,
    MomentCreateSerializer, MomentContinueSerializer,
)

logger = logging.getLogger(__name__)

MESSAGE_CAP = 38  # 19 pairs
ACTIVE_MOMENT_CAP = 5


class AIRateThrottle(UserRateThrottle):
    scope = 'ai'


def _resolve_rel(ctx, other):
    if ctx == 'other' and other.strip():
        return other.strip()
    return ctx


class MomentListCreateView(APIView):
    parser_classes = [MultiPartParser, JSONParser]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        archived = request.query_params.get('archived', 'false').lower() == 'true'
        moments = (
            Moment.objects
            .filter(user=request.user, is_archived=archived)
            .annotate(message_count=Count('messages'))
        )
        return Response(MomentSerializer(moments, many=True).data)

    def post(self, request):
        serializer = MomentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data

        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.is_onboarding_complete:
            return Response(
                {'detail': 'Please complete your profile before using this feature.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        active_count = Moment.objects.filter(user=request.user, is_archived=False).count()
        if active_count >= ACTIVE_MOMENT_CAP:
            return Response(
                {'detail': f'You have {active_count} active moments. Archive or close one before starting a new one.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        audio_file = vd.get('audio')
        if audio_file:
            try:
                client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
                transcription = client.audio.transcriptions.create(
                    model='whisper-1',
                    file=(audio_file.name, audio_file.read(), audio_file.content_type),
                )
                initial_input_text = transcription.text
            except Exception as e:
                logger.error('Whisper transcription error (moments): %s', e)
                return Response(
                    {'detail': 'Audio transcription failed. Please try again.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            initial_input_text = vd['initial_input'].strip()

        relationship = _resolve_rel(vd['relationship_context'], vd['relationship_other'])
        moment = Moment.objects.create(
            user=request.user,
            title=initial_input_text[:80].strip(),
            relationship_context=relationship,
            mode=vd['mode'],
        )
        MomentMessage.objects.create(
            moment=moment,
            role=MomentMessage.Role.USER,
            content=initial_input_text,
        )

        try:
            data = ai_service.get_response_with_history(
                user_id=request.user.id,
                relationship_context=relationship,
                relationship_other='',
                environment=vd['environment'],
                history=[],
                new_input=initial_input_text,
            )
        except anthropic.APITimeoutError:
            return Response({'detail': 'AI response timed out. Please try again.'}, status=status.HTTP_504_GATEWAY_TIMEOUT)
        except ValueError as e:
            logger.error('AI invalid JSON (moments create): %s', e)
            return Response({'detail': 'AI returned an unexpected response. Please try again.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        record_id = None
        try:
            record = AIResponseRecord.objects.create(
                user=request.user,
                mode=AIResponseRecord.Mode.MOMENTS,
                relationship_context=relationship,
                situation_summary=initial_input_text[:200],
                response_json=data,
            )
            record_id = record.id
        except Exception as e:
            logger.error('AIResponseRecord save failed (moments create): %s', e)

        MomentMessage.objects.create(
            moment=moment,
            role=MomentMessage.Role.ASSISTANT,
            content=json.dumps(data),
            response_record_id=record_id,
        )

        return Response({'moment_id': moment.id, **data, 'record_id': record_id}, status=status.HTTP_201_CREATED)


class MomentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            moment = Moment.objects.prefetch_related('messages').get(id=pk, user=request.user)
        except Moment.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(MomentDetailSerializer(moment).data)


class MomentContinueView(APIView):
    parser_classes = [MultiPartParser, JSONParser]
    permission_classes = [IsAuthenticated]
    throttle_classes = [AIRateThrottle]

    def post(self, request, pk):
        try:
            moment = Moment.objects.get(id=pk, user=request.user)
        except Moment.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if moment.is_archived:
            return Response(
                {'detail': 'This moment has ended. Start a new one.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.is_onboarding_complete:
            return Response(
                {'detail': 'Please complete your profile before using this feature.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = MomentContinueSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data

        audio_file = vd.get('audio')
        if audio_file:
            try:
                client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
                transcription = client.audio.transcriptions.create(
                    model='whisper-1',
                    file=(audio_file.name, audio_file.read(), audio_file.content_type),
                )
                user_input = transcription.text
            except Exception as e:
                logger.error('Whisper transcription error (moments continue): %s', e)
                return Response(
                    {'detail': 'Audio transcription failed. Please try again.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            user_input = vd['new_input'].strip()

        if len(user_input.strip()) < 10:
            coaching_data = {
                'options': [{'type': 'safe', 'text': 'Tap to speak clearly and in detail.', 'note': ''}],
                'delivery': '',
                'coaching': True,
            }
            MomentMessage.objects.create(moment=moment, role=MomentMessage.Role.USER, content='(no speech captured)')
            MomentMessage.objects.create(
                moment=moment,
                role=MomentMessage.Role.ASSISTANT,
                content=json.dumps(coaching_data),
                response_record_id=None,
            )
            if moment.messages.count() >= MESSAGE_CAP:
                moment.is_archived = True
            moment.save()
            return Response({**coaching_data, 'is_archived': moment.is_archived, 'record_id': None, 'user_input': ''})

        history = list(moment.messages.order_by('created_at').values('role', 'content'))

        MomentMessage.objects.create(
            moment=moment,
            role=MomentMessage.Role.USER,
            content=user_input,
        )

        try:
            data = ai_service.get_response_with_history(
                user_id=request.user.id,
                relationship_context=moment.relationship_context,
                relationship_other='',
                environment=vd['environment'],
                history=history,
                new_input=user_input,
            )
        except anthropic.APITimeoutError:
            return Response({'detail': 'AI response timed out. Please try again.'}, status=status.HTTP_504_GATEWAY_TIMEOUT)
        except ValueError as e:
            logger.error('AI invalid JSON (moments continue): %s', e)
            return Response({'detail': 'AI returned an unexpected response. Please try again.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        record_id = None
        try:
            record = AIResponseRecord.objects.create(
                user=request.user,
                mode=AIResponseRecord.Mode.MOMENTS,
                relationship_context=moment.relationship_context,
                situation_summary=user_input[:200],
                response_json=data,
            )
            record_id = record.id
        except Exception as e:
            logger.error('AIResponseRecord save failed (moments continue): %s', e)

        MomentMessage.objects.create(
            moment=moment,
            role=MomentMessage.Role.ASSISTANT,
            content=json.dumps(data),
            response_record_id=record_id,
        )

        if moment.messages.count() >= MESSAGE_CAP:
            moment.is_archived = True

        moment.save()

        return Response({**data, 'is_archived': moment.is_archived, 'record_id': record_id, 'user_input': user_input})


class MomentArchiveView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            moment = Moment.objects.get(id=pk, user=request.user)
        except Moment.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        if moment.is_archived:
            active_count = Moment.objects.filter(user=request.user, is_archived=False).count()
            if active_count >= ACTIVE_MOMENT_CAP:
                return Response(
                    {'detail': f'You can have at most {ACTIVE_MOMENT_CAP} active moments. Archive one first.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            moment.is_archived = False
        else:
            moment.is_archived = True
        moment.save(update_fields=['is_archived'])
        return Response({'is_archived': moment.is_archived})
