# HumorAI — CLAUDE.md

Session continuity document. Update after every significant implementation step.

## Project
Mobile-first AI-powered social confidence and conversational intelligence assistant. Helps users break the ice, reduce awkwardness, flirt naturally, text better, navigate conversations, and become more socially confident. "AI wingman for social confidence."

## Product Vision
**We are NOT building a joke generator.** We are building an AI-powered social confidence and conversational intelligence assistant. The AI must feel human, emotionally intelligent, context-aware, and socially calibrated.

### Core Philosophy
- Social intelligence assistant, not a comedy app
- Prioritize naturalness over cleverness, confidence over jokes, subtle wit over forced humor, realism over maximum humor
- Responses must sound like something a smart, socially skilled human would actually say — never like AI trying to be funny

### What the AI Must Understand
Dating situations, parties, texting, workplace interactions, networking, awkward silences, friend groups, social anxiety, casual banter, playful teasing.

### What the AI Must Avoid
Creepy behavior, manipulation, aggressive flirting, try-hard humor, edgy internet humor, offensive jokes, robotic phrasing, AI-sounding responses, cringe.

### Response Structure
Every AI response must return **structured JSON with 4 options**:
1. Safe response
2. Playful/witty response
3. Bold/confident response
4. Delivery guidance

Each option includes the response text and a brief delivery note.

### Context Quality Principle
The more context the user provides, the better and more personalized the output. The app should actively encourage users to provide rich situational context — who they're talking to, what the relationship is, what the vibe is, what they want to achieve. **Thin context produces generic responses. Rich context produces responses that feel like they were written specifically for that moment.** This principle should inform UX copy, input placeholders, and onboarding guidance throughout the app.

## Upcoming Changes (not yet implemented)
- Profile model will be expanded with relationship context and social anxiety level fields
- Frontend will be updated to render 4-option structured responses (TextingModeScreen, LiveModeScreen)

## Stack
| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2 + DRF |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Auth | JWT via djangorestframework-simplejwt |
| AI | Claude API — `claude-sonnet-4-6` |
| AI response | Structured JSON via DRF `Response` (replaced `StreamingHttpResponse`) |
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
| 1 | Onboarding / Personality Profile | complete |
| 2 | Texting Mode | complete |
| 3 | Live Mode | complete |
| 4 | Structured JSON response format (4 options) | backend complete, frontend pending |
| 5 | Expanded profile (relationship context, social anxiety) | upcoming |
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
- **2026-05-05** — Docker Engine installed on Ubuntu 24. `backend/.env` created from `.env.example` (DB_HOST=db, REDIS_URL uses redis service name). Containers running, migrations applied, admin verified, JWT auth tested.
- **2026-05-05** — `services/ai_service.py` written: `AIService` class with Redis-first profile loading, three-layer prompt assembly, per-mode `max_tokens` (texting 512, live 1024), streaming via `client.messages.stream()`. Module-level singleton `ai_service`. `services/redis_client.py` written. Prompt templates written for all three layers in `prompts/v1/`. `personality_description` added to both profile serializers (was missing after field was added to model).
- **2026-05-05** — `humor` app complete: `TextingModeView` (POST `/api/humor/texting/`) and `LiveModeView` (POST `/api/humor/live/`) — both JWT-authenticated, onboarding-gated (403 if `is_onboarding_complete` is false), streaming `text/plain` responses via `StreamingHttpResponse`. Backend feature-complete for all three priority features.
- **2026-05-05** — `username` field added to `UserProfile` (migration 0004). Texting Mode: renamed `conversation` → `context` across serializer, view, `ai_service.stream_texting_response()` signature, and `texting_mode.txt` prompt template.
- **2026-05-05** — Backend complete. Both AI endpoints (POST `/api/humor/texting/`, POST `/api/humor/live/`) working and tested end-to-end. All committed and pushed. Next phase: frontend — React Native + Expo bare workflow.
- **2026-05-06** — Frontend foundation built: Axios API client with JWT request/response interceptors and token refresh (expo-secure-store, namespaced keys), authService (register/login/logout), AuthContext (isAuthenticated + isLoading, signOut escape hatch), useAuth hook, full navigation stack (AppNavigator → AuthNavigator/MainNavigator), App.tsx wired with GestureHandlerRootView + AuthProvider, LoginScreen and RegisterScreen (password_confirm client-side validation, error extraction from DRF responses).
- **2026-05-06** — Frontend feature-complete: profileService (GET/PATCH /api/profiles/me/), useProfile hook (fetch on mount, update function), PersonalitySetupScreen (chip selectors for all 4 personality fields + personality_description textarea, pre-populated from existing profile, dynamic button label based on is_onboarding_complete), humor constants matching backend TextChoices exactly, useStreamingResponse hook, TextingModeScreen, LiveModeScreen. Full stack complete.
- **2026-05-06** — Bug fixes and device compatibility: index.js entry point added (registerRootComponent for bare workflow, package.json main updated), password_confirm threaded through RegisterScreen → AuthContext → authService → POST body, useStreamingResponse replaced ReadableStream approach (not supported on Hermes) with axios api.post + responseType:text — full response displayed at once. ALLOWED_HOSTS updated in development.py for physical device IP (10.0.0.228).
- **2026-05-06** — Product vision refined: reframed from humor/joke generator to social confidence and conversational intelligence assistant. New response format (structured JSON, 4 options), Context Quality Principle added, upcoming changes documented in CLAUDE.md.
- **2026-05-06** — Prompt templates rewritten to v2: social intelligence framing throughout, structured JSON output format (3 options: safe/playful/bold, each with text + note, plus top-level delivery field), mode-specific delivery guidance. `ai_service.py` updated: `StreamingHttpResponse` replaced with `messages.create()` + `json.loads()`, `_build_system_prompt` switched to `str.replace()` to avoid `.format()` KeyError on JSON braces in template, methods renamed `get_texting_response` / `get_live_response`. `views.py` updated to return `Response(data)`. Backend verified working end-to-end with new format. Frontend screens not yet updated.
