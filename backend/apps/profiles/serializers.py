from rest_framework import serializers
from .models import UserProfile


class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'email', 'username',
            'humor_style', 'persona_type', 'confidence_level', 'cultural_tone',
            'personality_description', 'social_anxiety_level',
            'is_onboarding_complete', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'email', 'is_onboarding_complete', 'created_at', 'updated_at']


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'username',
            'humor_style', 'persona_type', 'confidence_level', 'cultural_tone',
            'personality_description', 'social_anxiety_level',
        ]

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        personality_fields = ['humor_style', 'persona_type', 'confidence_level', 'cultural_tone']
        if all(getattr(instance, f) for f in personality_fields):
            instance.is_onboarding_complete = True
        instance.save()
        return instance
