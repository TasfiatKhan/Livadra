from django.db.models import Count
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

_AUDIO_MAX_BYTES = 10 * 1024 * 1024  # 10 MB


class MomentMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = MomentMessage
        fields = ['id', 'role', 'content', 'response_record_id', 'created_at']


class MomentSerializer(serializers.ModelSerializer):
    message_count = serializers.IntegerField(read_only=True)

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
    relationship_other = serializers.CharField(required=False, default='', allow_blank=True, max_length=200)
    mode = serializers.ChoiceField(choices=[('texting', 'Texting'), ('live', 'Live')], required=False, default='texting')
    environment = serializers.CharField(required=False, default='', allow_blank=True, max_length=300)
    initial_input = serializers.CharField(required=False, default='', allow_blank=True, max_length=2000)
    audio = serializers.FileField(required=False)

    def validate_audio(self, value):
        if value.size > _AUDIO_MAX_BYTES:
            raise serializers.ValidationError('Audio file too large (max 10 MB).')
        return value

    def validate(self, data):
        has_text = bool(data.get('initial_input', '').strip())
        has_audio = bool(data.get('audio'))
        if not has_text and not has_audio:
            raise serializers.ValidationError(
                'Either initial_input or audio must be provided.'
            )
        return data


class MomentContinueSerializer(serializers.Serializer):
    new_input = serializers.CharField(required=False, default='', allow_blank=True, max_length=1000)
    environment = serializers.CharField(required=False, default='', allow_blank=True, max_length=300)
    audio = serializers.FileField(required=False)

    def validate_audio(self, value):
        if value.size > _AUDIO_MAX_BYTES:
            raise serializers.ValidationError('Audio file too large (max 10 MB).')
        return value

    def validate(self, data):
        has_text = bool(data.get('new_input', '').strip())
        has_audio = bool(data.get('audio'))
        if not has_text and not has_audio:
            raise serializers.ValidationError('Either new_input or audio must be provided.')
        return data
