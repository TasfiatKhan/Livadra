from rest_framework import serializers
from .models import Moment, MomentMessage

RELATIONSHIP_CHOICES = [
    ('stranger', 'Stranger'),
    ('new_acquaintance', 'New acquaintance'),
    ('crush', 'Crush'),
    ('friend', 'Friend'),
    ('close_friend', 'Close friend'),
    ('colleague', 'Colleague'),
    ('date', 'Date'),
    ('other', 'Other'),
]


class MomentMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = MomentMessage
        fields = ['id', 'role', 'content', 'response_record_id', 'created_at']


class MomentSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()

    def get_message_count(self, obj):
        return obj.messages.count()

    class Meta:
        model = Moment
        fields = ['id', 'title', 'relationship_context', 'mode', 'is_archived', 'created_at', 'last_active_at', 'message_count']


class MomentDetailSerializer(serializers.ModelSerializer):
    messages = MomentMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Moment
        fields = ['id', 'title', 'relationship_context', 'mode', 'is_archived', 'created_at', 'last_active_at', 'messages']


class MomentCreateSerializer(serializers.Serializer):
    relationship_context = serializers.ChoiceField(choices=RELATIONSHIP_CHOICES)
    relationship_other = serializers.CharField(required=False, default='', allow_blank=True)
    mode = serializers.ChoiceField(choices=[('texting', 'Texting'), ('live', 'Live')])
    environment = serializers.CharField(required=False, default='', allow_blank=True)
    initial_input = serializers.CharField(required=False, default='', allow_blank=True)
    audio = serializers.FileField(required=False)

    def validate(self, data):
        has_text = bool(data.get('initial_input', '').strip())
        has_audio = bool(data.get('audio'))
        if not has_text and not has_audio:
            raise serializers.ValidationError(
                'Either initial_input or audio must be provided.'
            )
        return data


class MomentContinueSerializer(serializers.Serializer):
    new_input = serializers.CharField()
    environment = serializers.CharField(required=False, default='', allow_blank=True)
