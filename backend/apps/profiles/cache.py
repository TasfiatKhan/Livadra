from django.core.cache import cache
from django.conf import settings

_PREFIX = 'profile'


def _key(user_id: int) -> str:
    return f'{_PREFIX}:{user_id}'


def get_cached_profile(user_id: int) -> dict | None:
    return cache.get(_key(user_id))


def set_cached_profile(user_id: int, profile_data: dict) -> None:
    cache.set(_key(user_id), profile_data, timeout=settings.PROFILE_CACHE_TTL)


def invalidate_profile_cache(user_id: int) -> None:
    cache.delete(_key(user_id))
