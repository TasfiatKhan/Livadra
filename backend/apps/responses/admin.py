from django.contrib import admin
from .models import AIResponseRecord, ResponseFeedback, SavedResponse


@admin.register(AIResponseRecord)
class AIResponseRecordAdmin(admin.ModelAdmin):
    list_display = ('user', 'mode', 'relationship_context', 'prompt_version', 'generation_timestamp')
    list_filter = ('mode', 'prompt_version', 'generation_timestamp')
    search_fields = ('user__email', 'situation_summary')
    readonly_fields = ('generation_timestamp', 'feedback_counts')


@admin.register(ResponseFeedback)
class ResponseFeedbackAdmin(admin.ModelAdmin):
    list_display = ('user', 'feedback_type', 'response_record', 'created_at')
    list_filter = ('feedback_type', 'created_at')
    search_fields = ('user__email',)
    readonly_fields = ('created_at',)


@admin.register(SavedResponse)
class SavedResponseAdmin(admin.ModelAdmin):
    list_display = ('user', 'option_type', 'response_record', 'created_at')
    list_filter = ('option_type', 'created_at')
    search_fields = ('user__email', 'option_text')
    readonly_fields = ('created_at',)
