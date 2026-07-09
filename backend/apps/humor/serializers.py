from rest_framework import serializers

RELATIONSHIP_CHOICES = [
    ('stranger', 'Stranger'),
    ('new_acquaintance', 'New Acquaintance'),
    ('crush', 'Crush'),
    ('friend', 'Friend'),
    ('close_friend', 'Close Friend'),
    ('colleague', 'Colleague'),
    ('date', 'Date'),
    ('other', 'Other'),
]

_AUDIO_MAX_BYTES = 10 * 1024 * 1024  # 10 MB


class TextingRequestSerializer(serializers.Serializer):
    context = serializers.CharField(min_length=1, max_length=2000)
    user_request = serializers.CharField(min_length=1, max_length=500)
    relationship_context = serializers.ChoiceField(choices=RELATIONSHIP_CHOICES)
    relationship_other = serializers.CharField(required=False, allow_blank=True, default='', max_length=200)
    environment = serializers.CharField(required=False, allow_blank=True, default='', max_length=300)


class LiveRequestSerializer(serializers.Serializer):
    situation = serializers.CharField(min_length=1, max_length=2000)
    user_request = serializers.CharField(min_length=1, max_length=500)
    relationship_context = serializers.ChoiceField(choices=RELATIONSHIP_CHOICES)
    relationship_other = serializers.CharField(required=False, allow_blank=True, default='', max_length=200)
    environment = serializers.CharField(required=False, allow_blank=True, default='', max_length=300)


class LiveVoiceRequestSerializer(serializers.Serializer):
    audio = serializers.FileField()
    relationship_context = serializers.ChoiceField(choices=RELATIONSHIP_CHOICES, required=False, default='other')
    relationship_other = serializers.CharField(required=False, allow_blank=True, default='', max_length=200)
    environment = serializers.CharField(required=False, allow_blank=True, default='', max_length=300)

    def validate_audio(self, value):
        if value.size > _AUDIO_MAX_BYTES:
            raise serializers.ValidationError('Audio file too large (max 10 MB).')
        return value
