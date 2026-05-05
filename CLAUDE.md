# HumorAI — CLAUDE.md

Session continuity document. Update after every significant implementation step.

## Project
Mobile-first app where users get an AI agent that helps them be funny and navigate social situations with humor. "AI wingman for social confidence."

## Stack
| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2 + DRF |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Auth | JWT via djangorestframework-simplejwt |
| AI | Claude API — `claude-sonnet-4-20250514` |
| Streaming | Django `StreamingHttpResponse` |
| Frontend | React Native + Expo bare workflow |
| Language | TypeScript (frontend), Python 3.11 (backend) |

## Architecture Rules (non-negotiable)
- **No direct Claude API calls from views.** All AI interactions go through `backend/services/ai_service.py`.
- **Prompts are three independent layers:** (a) user personality, (b) situational context, (c) request. Kept in `backend/prompts/v{n}/`.
- **Personality profile is always Redis-cached.** Never hit DB on every AI request. Cache logic lives in `backend/apps/profiles/cache.py`.
- **Frontend never calls API from screens.** All network calls go through `frontend/src/services/`.

## Django App Namespace
Apps live under `apps/` and are registered as `apps.users`, `apps.profiles`, `apps.humor` in `INSTALLED_APPS`. AppConfig.name must match this dotted path.

## Feature Scope
| Priority | Feature | Status |
|----------|---------|--------|
| 1 | Onboarding / Personality Profile | not started |
| 2 | Texting Mode | not started |
| 3 | Live Mode | not started |
| — | Delivery Coaching (v2) | out of scope |

## Working Style
- Architect decides approach, engineer (Claude) executes.
- Confirm approach before writing significant code.
- Ask before making non-trivial assumptions.

## Settings Notes
- DB config uses individual vars (`DB_NAME`, `DB_USER`, etc.) — no `dj-database-url` dependency.
- `ANTHROPIC_API_KEY` is read directly by `AIService` via decouple, not surfaced in Django settings.
- Token blacklisting (`BLACKLIST_AFTER_ROTATION`) is disabled — TODO before production.
- `PROFILE_CACHE_TTL` is in settings (not read by cache.py directly from env).

## Progress Log
- **2026-05-03** — Full folder/file structure scaffolded. No logic written yet.
- **2026-05-03** — `config/settings/base.py` and `development.py` written. `production.py` stubbed.
- **2026-05-03** — `manage.py`, `config/wsgi.py`, `config/asgi.py`, `config/urls.py` written. App `urls.py` stubs added. Backend is bootable.
- **2026-05-03** — `users` app written: custom `User` model (email as username, `AbstractBaseUser`), registration and me endpoints. `AUTH_USER_MODEL` set in `base.py`.
- **2026-05-05** — `profiles` app written: `UserProfile` model (HumorStyle ×8, PersonaType ×5 archetypes, ConfidenceLevel ×4, CulturalTone country-level USA/CANADA), signal auto-creates profile on user creation, `ProfileSerializer` + `ProfileUpdateSerializer` (auto-sets `is_onboarding_complete` when all 4 personality fields filled), `ProfileView` (GET/PUT/PATCH `/api/profiles/me/`), Redis cache module (`get/set/invalidate_cached_profile`), cache re-primed on every update.
