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
        'live': 600,
        'moments': 1024,
    }

    def __init__(self):
        self._client = anthropic.Anthropic(api_key=config('ANTHROPIC_API_KEY'), timeout=30.0)
        self._personality_template = self._load_template('system_personality.txt')
        self._texting_template = self._load_template('texting_mode.txt')
        self._live_template = self._load_template('live_mode.txt')
        self._moments_template = self._load_template('moments_mode.txt')

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

    def _call_with_messages(self, system_prompt: str, messages: list, max_tokens: int) -> dict:
        message = self._client.messages.create(
            model=self.MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=messages,
        )
        text = message.content[0].text.strip()
        if text.startswith('```'):
            lines = text.splitlines()
            text = '\n'.join(lines[1:-1]).strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            raise ValueError(f'AI returned invalid JSON: {text[:200]}') from exc

    def _call(self, system_prompt: str, user_message: str, max_tokens: int) -> dict:
        return self._call_with_messages(
            system_prompt,
            [{'role': 'user', 'content': user_message}],
            max_tokens,
        )

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

    def get_response_with_history(
        self,
        user_id: int,
        relationship_context: str,
        relationship_other: str,
        environment: str,
        history: list,
        new_input: str,
    ) -> dict:
        profile = self._get_profile(user_id)
        system_prompt = self._build_system_prompt(profile)
        relationship = self._resolve_relationship(relationship_context, relationship_other)
        environment_line = f"Environment: {environment}" if environment.strip() else ""

        new_user_message = (
            self._moments_template
            .replace('{relationship_context}', relationship)
            .replace('{environment}', environment_line)
            .replace('{new_input}', new_input)
        )

        # Cap at last 36 messages (18 pairs) to stay within token budget
        capped = history[-36:]
        messages = [{'role': m['role'], 'content': m['content']} for m in capped]
        messages.append({'role': 'user', 'content': new_user_message})

        return self._call_with_messages(system_prompt, messages, self._MAX_TOKENS['moments'])


ai_service = AIService()
