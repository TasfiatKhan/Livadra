# Livadra

AI-powered social intelligence for real-world conversations. Helps people navigate texting, in-person moments, and ongoing social situations with more ease, warmth, and confidence.

## What it does

Three modes cover the full range of social life:

- **Texting Mode** — describe the situation, get three calibrated response options (safe / playful / bold), each with delivery guidance
- **Live Mode** — tap to record, speak your situation, get something glanceable in seconds for real-time in-person moments
- **Moments** — persistent threads with memory for ongoing situations (a slow-burn conversation, a tricky colleague, a new friendship)

Every response is structured JSON with three options and a delivery coaching note. Nothing prescriptive — suggestions only, framed collaboratively.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2 + DRF |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Auth | JWT via djangorestframework-simplejwt |
| AI | Claude API (`claude-sonnet-4-6`) |
| Transcription | OpenAI Whisper (`whisper-1`) |
| Frontend | React Native + Expo bare workflow |
| Language | TypeScript (frontend), Python 3.11 (backend) |

## Quick start

```bash
cp backend/.env.example backend/.env
# fill in ANTHROPIC_API_KEY, OPENAI_API_KEY, and DB/Redis config
docker compose up --build
```

Backend runs at `http://localhost:8000`.

First run — apply migrations:

```bash
docker compose exec backend python manage.py migrate
```

## Verification

```bash
npm --prefix frontend run ts:check
docker compose exec backend python manage.py check
docker compose exec backend python manage.py test
```

## Production deployment

`docker-compose.yml` is for local development. Production uses the override
file, private database/cache networking, and a TLS reverse proxy:

```bash
DOMAIN=api.example.com \
DB_NAME=livadra DB_USER=livadra DB_PASSWORD=replace-me \
REDIS_PASSWORD=replace-me \
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d
```

Legal pages (hosted by the landing site, linked from the app's Register and
My Profile screens via `frontend/src/constants/links.ts`):

- Privacy Policy: https://livadra.com/privacy-policy
- Account deletion: https://livadra.com/account-deletion

The API supports account deletion at `DELETE /api/users/me/` (the in-app
"Delete my account" flow), plus per-item deletion of Moments and saved responses.

## Project structure

```
backend/
  apps/
    users/        # auth, custom User model
    profiles/     # personality profile, Redis cache
    humor/        # Texting + Live Mode endpoints
    moments/      # Moments threads and continuation
    responses/    # AIResponseRecord, feedback, saved, copy tracking
  prompts/v2/     # system_personality, texting_mode, live_mode, moments_mode
  services/       # ai_service.py — all Claude calls go here

frontend/
  src/
    screens/      # HomeScreen, TextingMode, LiveMode, Moments, Profile, etc.
    services/     # all API calls (never called from screens directly)
    context/      # AuthContext, ThemeContext
    theme.ts      # design token system (colors, typography, spacing, radii)
```

## Architecture rules

- All Claude API calls go through `backend/services/ai_service.py` — never directly from views
- Prompts are three independent layers: personality, situational context, request
- Personality profile is always Redis-cached — never hit DB on every AI request
- Frontend never calls the API from screens — all network calls go through `frontend/src/services/`

## Related
Website: [livadra.com](https://livadra.com) — source: [github.com/TasfiatKhan/Livadra_Landing](https://github.com/TasfiatKhan/Livadra_Landing)


## Author
Tasfiat Khan — operating as Zabmation
- LinkedIn: [https://www.linkedin.com/in/tasfiat-zabir-khan-0ab4971b6/]
- Email: tasfiatzabirkhan@gmail.com
- Available for contract work
