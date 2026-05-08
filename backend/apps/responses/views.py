from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from .models import AIResponseRecord, ResponseFeedback, SavedResponse
from .serializers import FeedbackSerializer, SavedResponseSerializer, SavedResponseListSerializer


class FeedbackView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data

        try:
            record = AIResponseRecord.objects.get(id=vd['response_record_id'], user=request.user)
        except AIResponseRecord.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_type = vd['feedback_type']
        existing = ResponseFeedback.objects.filter(user=request.user, response_record=record).first()

        if existing is None:
            ResponseFeedback.objects.create(user=request.user, response_record=record, feedback_type=new_type)
            record.feedback_counts[new_type] = record.feedback_counts.get(new_type, 0) + 1
            action = 'added'
        elif existing.feedback_type == new_type:
            existing.delete()
            record.feedback_counts[new_type] = max(0, record.feedback_counts.get(new_type, 0) - 1)
            action = 'removed'
        else:
            old_type = existing.feedback_type
            existing.feedback_type = new_type
            existing.save(update_fields=['feedback_type'])
            record.feedback_counts[old_type] = max(0, record.feedback_counts.get(old_type, 0) - 1)
            record.feedback_counts[new_type] = record.feedback_counts.get(new_type, 0) + 1
            action = 'replaced'

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

        SavedResponse.objects.create(
            user=request.user,
            response_record=record,
            option_type=vd['option_type'],
            option_text=vd['option_text'],
        )
        return Response({'status': 'ok'}, status=status.HTTP_201_CREATED)


class SavedResponseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        saved = SavedResponse.objects.filter(user=request.user).select_related('response_record')
        return Response(SavedResponseListSerializer(saved, many=True).data)
