from django.conf import settings
from django.db import models


def default_feedback_counts():
    return {'natural': 0, 'loved': 0, 'cringe': 0, 'risky': 0, 'saved': 0}


class AIResponseRecord(models.Model):
    class Mode(models.TextChoices):
        TEXTING = 'texting', 'Texting'
        LIVE = 'live', 'Live'
        LIVE_VOICE = 'live_voice', 'Live Voice'
        MOMENTS = 'moments', 'Moments'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='response_records')
    mode = models.CharField(max_length=20, choices=Mode.choices)
    relationship_context = models.CharField(max_length=50, blank=True)
    situation_summary = models.CharField(max_length=200, blank=True)
    response_json = models.JSONField()
    prompt_version = models.CharField(max_length=10, default='v2')
    generation_timestamp = models.DateTimeField(auto_now_add=True)
    feedback_counts = models.JSONField(default=default_feedback_counts)

    class Meta:
        ordering = ['-generation_timestamp']

    def __str__(self):
        return f'{self.user} | {self.mode} | {self.generation_timestamp:%Y-%m-%d %H:%M}'


class ResponseFeedback(models.Model):
    class FeedbackType(models.TextChoices):
        NATURAL = 'natural', 'Natural'
        LOVED = 'loved', 'Loved it'
        CRINGE = 'cringe', 'Cringe'
        RISKY = 'risky', 'Too risky'
        SAVED = 'saved', 'Saved'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='response_feedback')
    response_record = models.ForeignKey(AIResponseRecord, on_delete=models.CASCADE, related_name='feedback')
    feedback_type = models.CharField(max_length=20, choices=FeedbackType.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'response_record', 'feedback_type')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} | {self.feedback_type} | record #{self.response_record_id}'


class CopiedResponse(models.Model):
    class OptionType(models.TextChoices):
        SAFE = 'safe', 'Safe'
        PLAYFUL = 'playful', 'Playful'
        BOLD = 'bold', 'Bold'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='copied_responses')
    response_record = models.ForeignKey(AIResponseRecord, on_delete=models.CASCADE, related_name='copies')
    option_type = models.CharField(max_length=20, choices=OptionType.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'response_record', 'option_type')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} | {self.option_type} | record #{self.response_record_id}'


class SavedResponse(models.Model):
    class OptionType(models.TextChoices):
        SAFE = 'safe', 'Safe'
        PLAYFUL = 'playful', 'Playful'
        BOLD = 'bold', 'Bold'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_responses')
    response_record = models.ForeignKey(AIResponseRecord, on_delete=models.CASCADE, related_name='saves')
    option_type = models.CharField(max_length=20, choices=OptionType.choices)
    option_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} | {self.option_type} | record #{self.response_record_id}'
