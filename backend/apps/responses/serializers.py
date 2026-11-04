from rest_framework import serializers
from .models import ResponseFeedback, SavedResponse, CopiedResponse


class AIOptionOutputSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=['safe', 'playful', 'bold'])
    text = serializers.CharField(max_length=500)
    note = serializers.CharField(max_length=500)


class AIResponseOutputSerializer(serializers.Serializer):
    options = AIOptionOutputSerializer(many=True, min_length=3, max_length=3)
    delivery = serializers.CharField(max_length=1000)

    def validate_options(self, options):
        if {option['type'] for option in options} != {'safe', 'playful', 'bold'}:
            raise serializers.ValidationError(
                'Expected exactly safe, playful, and bold options.'
            )
        return options


class FeedbackSerializer(serializers.Serializer):
    response_record_id = serializers.IntegerField()
    option_type = serializers.ChoiceField(choices=SavedResponse.OptionType.choices)
    feedback_type = serializers.ChoiceField(choices=ResponseFeedback.FeedbackType.choices)


class SavedResponseSerializer(serializers.Serializer):
    response_record_id = serializers.IntegerField()
    option_type = serializers.ChoiceField(choices=SavedResponse.OptionType.choices)


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
