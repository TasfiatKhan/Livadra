from pathlib import Path
from decouple import config
import anthropic

from apps.profiles.cache import get_cached_profile, set_cached_profile

_PROMPT_DIR = Path(__file__).resolve().parent.parent / 'prompts' / 'v1'


class AIService:
    MODEL = 'claude-sonnet-4-6'
    _MAX_TOKENS = {
        'texting': 512,
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
        return self._personality_template.format(
            humor_style=profile.get('humor_style', ''),
            persona_type=profile.get('persona_type', ''),
            confidence_level=profile.get('confidence_level', ''),
            cultural_tone=profile.get('cultural_tone', ''),
            personality_description=profile.get('personality_description', ''),
        )

    def stream_texting_response(self, user_id: int, context: str, user_request: str):
        profile = self._get_profile(user_id)
        system_prompt = self._build_system_prompt(profile)
        user_message = self._texting_template.format(
            context=context,
            user_request=user_request,
        )
        return self._stream(system_prompt, user_message, self._MAX_TOKENS['texting'])

    def stream_live_response(self, user_id: int, situation: str, user_request: str):
        profile = self._get_profile(user_id)
        system_prompt = self._build_system_prompt(profile)
        user_message = self._live_template.format(
            situation=situation,
            user_request=user_request,
        )
        return self._stream(system_prompt, user_message, self._MAX_TOKENS['live'])

    def _stream(self, system_prompt: str, user_message: str, max_tokens: int):
        with self._client.messages.stream(
            model=self.MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{'role': 'user', 'content': user_message}],
        ) as stream:
            for text in stream.text_stream:
                yield text


ai_service = AIService()
