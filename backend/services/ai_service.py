import json
from pathlib import Path
from decouple import config
import anthropic

from apps.profiles.cache import get_cached_profile, set_cached_profile

_PROMPT_DIR = Path(__file__).resolve().parent.parent / 'prompts' / 'v2'


class AIService:
    MODEL = 'claude-sonnet-4-6'
    _MAX_TOKENS = {
        'texting': 600,
        'live': 1024,
    }

    def __init__(self):
        self._client = anthropic.Anthropic(api_key=config('ANTHROPIC_API_KEY'))
        self._personality_template = self._load_template('system_personality.txt')
        self._texting_template = self._load_template('texting_mode.txt')
        self._live_template = self._load_template('live_mode.txt')

    @staticmethod
    def _load_template(filename: str) -> str:
        raw = (_PROMPT_DIR / filename).read_text()
        return '\n'.join(line for line in raw.splitlines() if not line.startswith('# VAR:')).strip()

    def _get_profile(self, user_id: int) -> dict:
        profile = get_cached_profile(user_id)
        if profile is None:
            from apps.profiles.models import UserProfile
            from apps.profiles.serializers import ProfileSerializer
            instance = UserProfile.objects.select_related('user').get(user_id=user_id)
            profile = dict(ProfileSerializer(instance).data)
            set_cached_profile(user_id, profile)
        return profile

    def _build_system_prompt(self, profile: dict) -> str:
        return (
            self._personality_template
            .replace('{humor_style}', profile.get('humor_style', ''))
            .replace('{persona_type}', profile.get('persona_type', ''))
            .replace('{confidence_level}', profile.get('confidence_level', ''))
            .replace('{cultural_tone}', profile.get('cultural_tone', ''))
            .replace('{personality_description}', profile.get('personality_description', ''))
            .replace('{social_anxiety_level}', profile.get('social_anxiety_level', 'mild'))
        )

    @staticmethod
    def _resolve_relationship(relationship_context: str, relationship_other: str) -> str:
        if relationship_context == 'other' and relationship_other.strip():
            return relationship_other.strip()
        return relationship_context

    def get_texting_response(
        self,
        user_id: int,
        context: str,
        user_request: str,
        relationship_context: str,
        relationship_other: str,
        environment: str,
    ) -> dict:
        profile = self._get_profile(user_id)
        system_prompt = self._build_system_prompt(profile)
        relationship = self._resolve_relationship(relationship_context, relationship_other)
        environment_line = f"Environment: {environment}" if environment.strip() else ""
        user_message = self._texting_template.format(
            context=context,
            user_request=user_request,
            relationship_context=relationship,
            environment=environment_line,
        )
        return self._call(system_prompt, user_message, self._MAX_TOKENS['texting'])

    def get_live_response(
        self,
        user_id: int,
        situation: str,
        user_request: str,
        relationship_context: str,
        relationship_other: str,
        environment: str,
    ) -> dict:
        profile = self._get_profile(user_id)
        system_prompt = self._build_system_prompt(profile)
        relationship = self._resolve_relationship(relationship_context, relationship_other)
        environment_line = f"Environment: {environment}" if environment.strip() else ""
        user_message = self._live_template.format(
            situation=situation,
            user_request=user_request,
            relationship_context=relationship,
            environment=environment_line,
        )
        return self._call(system_prompt, user_message, self._MAX_TOKENS['live'])

    def _call(self, system_prompt: str, user_message: str, max_tokens: int) -> dict:
        message = self._client.messages.create(
            model=self.MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{'role': 'user', 'content': user_message}],
        )
        text = message.content[0].text.strip()
        if text.startswith('```'):
            lines = text.splitlines()
            text = '\n'.join(lines[1:-1]).strip()
        return json.loads(text)


ai_service = AIService()
