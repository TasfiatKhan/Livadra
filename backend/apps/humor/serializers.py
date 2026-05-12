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


class TextingRequestSerializer(serializers.Serializer):
    context = serializers.CharField()
    user_request = serializers.CharField()
    relationship_context = serializers.ChoiceField(choices=RELATIONSHIP_CHOICES)
    relationship_other = serializers.CharField(required=False, allow_blank=True, default='')
    environment = serializers.CharField(required=False, allow_blank=True, default='')


class LiveRequestSerializer(serializers.Serializer):
    situation = serializers.CharField()
    user_request = serializers.CharField()
    relationship_context = serializers.ChoiceField(choices=RELATIONSHIP_CHOICES)
    relationship_other = serializers.CharField(required=False, allow_blank=True, default='')
    environment = serializers.CharField(required=False, allow_blank=True, default='')


class LiveVoiceRequestSerializer(serializers.Serializer):
    audio = serializers.FileField()
    relationship_context = serializers.ChoiceField(choices=RELATIONSHIP_CHOICES, required=False, default='other')
    relationship_other = serializers.CharField(required=False, allow_blank=True, default='')
    environment = serializers.CharField(required=False, allow_blank=True, default='')
