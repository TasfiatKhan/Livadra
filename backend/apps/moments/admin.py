from django.contrib import admin
from .models import Moment, MomentMessage


@admin.register(Moment)
class MomentAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'mode', 'relationship_context', 'is_archived', 'last_active_at')
    list_filter = ('mode', 'is_archived', 'last_active_at')
    search_fields = ('user__email', 'title')
    readonly_fields = ('created_at', 'last_active_at')


@admin.register(MomentMessage)
class MomentMessageAdmin(admin.ModelAdmin):
    list_display = ('moment', 'role', 'created_at')
    list_filter = ('role',)
    readonly_fields = ('created_at',)
