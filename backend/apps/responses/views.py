from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from .models import AIResponseRecord, ResponseFeedback, SavedResponse
from .serializers import FeedbackSerializer, SavedResponseSerializer


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

        _, created = ResponseFeedback.objects.get_or_create(
            user=request.user,
            response_record=record,
            feedback_type=vd['feedback_type'],
        )
        if created:
            record.feedback_counts[vd['feedback_type']] += 1
            record.save(update_fields=['feedback_counts'])

        return Response({'status': 'ok'})


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
