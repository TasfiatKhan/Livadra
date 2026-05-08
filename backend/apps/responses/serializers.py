from rest_framework import serializers
from .models import ResponseFeedback, SavedResponse


class FeedbackSerializer(serializers.Serializer):
    response_record_id = serializers.IntegerField()
    feedback_type = serializers.ChoiceField(choices=ResponseFeedback.FeedbackType.choices)


class SavedResponseSerializer(serializers.Serializer):
    response_record_id = serializers.IntegerField()
    option_type = serializers.ChoiceField(choices=SavedResponse.OptionType.choices)
    option_text = serializers.CharField()
