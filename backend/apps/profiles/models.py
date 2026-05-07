from django.db import models
from django.conf import settings


class UserProfile(models.Model):
    class HumorStyle(models.TextChoices):
        DRY = 'dry', 'Dry'
        SARCASTIC = 'sarcastic', 'Sarcastic'
        GOOFY = 'goofy', 'Goofy'
        WITTY = 'witty', 'Witty'
        SELF_DEPRECATING = 'self_deprecating', 'Self-Deprecating'
        OBSERVATIONAL = 'observational', 'Observational'
        DARK = 'dark', 'Dark'
        ABSURD = 'absurd', 'Absurd'

    class PersonaType(models.TextChoices):
        STORYTELLER = 'storyteller', 'The Storyteller'
        CHARMER = 'charmer', 'The Charmer'
        OBSERVER = 'observer', 'The Observer'
        WITTY = 'witty', 'The Witty One'
        CONFIDENT = 'confident', 'The Confident One'

    class ConfidenceLevel(models.TextChoices):
        SHY = 'shy', 'Shy'
        MODERATE = 'moderate', 'Moderate'
        CONFIDENT = 'confident', 'Confident'
        FEARLESS = 'fearless', 'Fearless'

    # country-level choices; grouping by region is a frontend display concern
    class CulturalTone(models.TextChoices):
        USA = 'usa', 'United States'
        CANADA = 'canada', 'Canada'

    class SocialAnxietyLevel(models.TextChoices):
        NONE = 'none', 'None'
        MILD = 'mild', 'Mild'
        MODERATE = 'moderate', 'Moderate'
        HIGH = 'high', 'High'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile',
    )
    humor_style = models.CharField(max_length=20, choices=HumorStyle.choices, blank=True, default='')
    persona_type = models.CharField(max_length=20, choices=PersonaType.choices, blank=True, default='')
    confidence_level = models.CharField(max_length=20, choices=ConfidenceLevel.choices, blank=True, default='')
    cultural_tone = models.CharField(max_length=30, choices=CulturalTone.choices, blank=True, default='')
    username = models.CharField(max_length=50, blank=True, default='')
    personality_description = models.TextField(max_length=1000, blank=True, default='')
    social_anxiety_level = models.CharField(
        max_length=20, choices=SocialAnxietyLevel.choices, default=SocialAnxietyLevel.MILD,
    )
    is_onboarding_complete = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'profiles'

    def __str__(self):
        return f'Profile({self.user.email})'
