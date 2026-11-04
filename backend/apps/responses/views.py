from django.db import transaction
from django.db.models import Count
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from .models import AIResponseRecord, ResponseFeedback, SavedResponse, CopiedResponse
from .serializers import FeedbackSerializer, SavedResponseSerializer, SavedResponseListSerializer, CopyResponseSerializer


class FeedbackView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data

        with transaction.atomic():
            try:
                record = AIResponseRecord.objects.select_for_update().get(
                    id=vd['response_record_id'], user=request.user
                )
            except AIResponseRecord.DoesNotExist:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

            new_type = vd['feedback_type']
            option_type = vd['option_type']
            existing = ResponseFeedback.objects.filter(
                user=request.user,
                response_record=record,
                option_type=option_type,
            ).first()

            if existing is None:
                ResponseFeedback.objects.create(
                    user=request.user,
                    response_record=record,
                    option_type=option_type,
                    feedback_type=new_type,
                )
                action = 'added'
            elif existing.feedback_type == new_type:
                existing.delete()
                action = 'removed'
            else:
                existing.feedback_type = new_type
                existing.save(update_fields=['feedback_type'])
                action = 'replaced'

            counts = dict(
                ResponseFeedback.objects
                .filter(response_record=record)
                .values_list('feedback_type')
                .annotate(total=Count('id'))
            )
            record.feedback_counts = {
                'natural': counts.get('natural', 0),
                'loved': counts.get('loved', 0),
                'cringe': counts.get('cringe', 0),
                'risky': counts.get('risky', 0),
                'saved': 0,
            }
            record.save(update_fields=['feedback_counts'])

        return Response({'status': 'ok', 'action': action})


class SavedResponseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SavedResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data

        try:
            record = AIResponseRecord.objects.get(id=vd['response_record_id'], user=request.user)
        except AIResponseRecord.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        option = next(
            (
                item for item in record.response_json.get('options', [])
                if item.get('type') == vd['option_type']
            ),
            None,
        )
        if option is None:
            return Response({'detail': 'That option does not exist on this response.'}, status=status.HTTP_400_BAD_REQUEST)

        SavedResponse.objects.get_or_create(
            user=request.user,
            response_record=record,
            option_type=vd['option_type'],
            defaults={'option_text': option['text']},
        )
        return Response({'status': 'ok'}, status=status.HTTP_201_CREATED)


class SavedResponseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        saved = SavedResponse.objects.filter(user=request.user).select_related('response_record')
        return Response(SavedResponseListSerializer(saved, many=True).data)


class CopyResponseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CopyResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data

        try:
            record = AIResponseRecord.objects.get(id=vd['response_record_id'], user=request.user)
        except AIResponseRecord.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        CopiedResponse.objects.get_or_create(
            user=request.user,
            response_record=record,
            option_type=vd['option_type'],
        )
        return Response({'status': 'ok'})


class ResponseStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            record_ids = [int(value) for value in request.query_params.getlist('id')]
        except ValueError:
            return Response({'detail': 'Invalid response id.'}, status=status.HTTP_400_BAD_REQUEST)

        feedback = ResponseFeedback.objects.filter(
            user=request.user,
            response_record_id__in=record_ids,
        ).values('response_record_id', 'option_type', 'feedback_type')
        saved = SavedResponse.objects.filter(
            user=request.user,
            response_record_id__in=record_ids,
        ).values_list('response_record_id', 'option_type')
        return Response({'feedback': list(feedback), 'saved': list(saved)})
