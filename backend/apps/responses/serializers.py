from rest_framework import serializers
from .models import ResponseFeedback, SavedResponse, CopiedResponse


class FeedbackSerializer(serializers.Serializer):
    response_record_id = serializers.IntegerField()
    feedback_type = serializers.ChoiceField(choices=ResponseFeedback.FeedbackType.choices)


class SavedResponseSerializer(serializers.Serializer):
    response_record_id = serializers.IntegerField()
    option_type = serializers.ChoiceField(choices=SavedResponse.OptionType.choices)
    option_text = serializers.CharField()


class CopyResponseSerializer(serializers.Serializer):
    response_record_id = serializers.IntegerField()
    option_type = serializers.ChoiceField(choices=CopiedResponse.OptionType.choices)


class SavedResponseListSerializer(serializers.ModelSerializer):
    mode = serializers.CharField(source='response_record.mode')
    relationship_context = serializers.CharField(source='response_record.relationship_context')
    situation_summary = serializers.CharField(source='response_record.situation_summary')

    class Meta:
        model = SavedResponse
        fields = ['id', 'option_type', 'option_text', 'mode', 'relationship_context', 'situation_summary', 'created_at']
