from django.conf import settings
from django.db import models


class Moment(models.Model):
    class Mode(models.TextChoices):
        TEXTING = 'texting', 'Texting'
        LIVE = 'live', 'Live'
        LIVE_VOICE = 'live_voice', 'Live Voice'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='moments')
    title = models.CharField(max_length=100)
    relationship_context = models.CharField(max_length=100)
    mode = models.CharField(max_length=20, choices=Mode.choices)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    last_active_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-last_active_at']

    def __str__(self):
        return f'{self.user} | {self.title[:40]}'


class MomentMessage(models.Model):
    class Role(models.TextChoices):
        USER = 'user', 'User'
        ASSISTANT = 'assistant', 'Assistant'

    moment = models.ForeignKey(Moment, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20, choices=Role.choices)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Moment {self.moment_id} | {self.role} | {self.created_at}'
