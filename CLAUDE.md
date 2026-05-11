# Witly — CLAUDE.md

Session continuity document. Update after every significant implementation step.

## Project
An AI-powered social intelligence and situational humor assistant for real-world human interactions. Helps users navigate awkward situations, social tension, workplace interactions, friendships, parties, networking, texting, dating, banter, conversational flow, charisma and confidence. Humor is the tool, not the entire product.

## Product Vision

### What Witly Is
A broader AI social copilot — not a dating reply generator. Three complementary modes cover the full range:
- **Texting Mode** — quick one-off help with a specific message or situation
- **Live Mode** — real-time voice-input assistance for situations happening right now
- **Moments** — persistent ongoing social situations with memory and conversational continuity

Most existing apps focus only on dating/text replies. Witly is built for the full spectrum: workplace tension, friend group dynamics, networking events, parties, awkward silences, first impressions, and yes — dating.

### Tone
Human, subtle, context-aware, emotionally calibrated, naturally conversational.

**Avoid:** gimmicky rizz-app behavior, pickup-artist energy, try-hard humor, overly polished dialogue, forced cleverness.

**Prioritize:** realism, continuity, low cringe, emotional intelligence, conversational naturalness, socially believable responses.

### What the AI Must Understand
Dating situations, parties, texting, workplace interactions, networking, awkward silences, friend groups, social anxiety, casual banter, playful teasing, conflict de-escalation, first impressions, group dynamics.

### What the AI Must Avoid
Creepy behavior, manipulation, aggressive flirting, try-hard humor, edgy internet humor, offensive jokes, robotic phrasing, AI-sounding responses, cringe, pickup-artist framing.

### Non-Prescriptive Language (permanent product rule)
The app must **never** directly command users what to say. Do not use language like "Say this", "Use this line", "This will work", "Say exactly this." All suggestions must be framed collaboratively: "You could say something like…", "A playful response could be…", "If the vibe feels right, you might try…", "A safer option might be…"

The AI should feel like a socially intelligent friend giving guidance, not a script generator. Every suggestion must preserve user agency, emotional intelligence, contextual flexibility, and social safety. This rule is enforced in the `note` and `delivery` fields of every JSON response and embedded in `prompts/v2/system_personality.txt`.

### Response Structure
Every AI response must return **structured JSON with 4 options**:
1. Safe response
2. Playful/witty response
3. Bold/confident response
4. Delivery guidance

Each option includes the response text and a brief delivery note.

### Context Quality Principle
The more context the user provides, the better and more personalized the output. The app should actively encourage users to provide rich situational context — who they're talking to, what the relationship is, what the vibe is, what they want to achieve. **Thin context produces generic responses. Rich context produces responses that feel like they were written specifically for that moment.** This principle should inform UX copy, input placeholders, and onboarding guidance throughout the app.

## Current Status (as of 2026-05-10)
All Phase 1 + Phase 1.5 features complete and pushed. Full stack working end-to-end.

**Pending before testing on device (run once):**
```
sudo docker compose exec backend python manage.py migrate
sudo docker compose up --build -d
```
This applies: `responses/0002_copiedresponse`, `moments/0001_initial`, `moments/0002_momentmessage_response_record`.

## Upcoming — Phase 2: Analytics Dashboard
Next major feature: an analytics dashboard for understanding how the app is being used and which responses are performing well. Likely scoped as an admin/developer view first, with potential for a user-facing "your stats" screen later. Key data already being collected:
- `AIResponseRecord` — every AI response (mode, relationship_context, situation_summary, response_json, prompt_version, feedback_counts)
- `ResponseFeedback` — per-user feedback per response (natural/loved/cringe/risky)
- `SavedResponse` — saved option text per user

**Planned analytics surfaces:**
- Response quality: feedback distribution (% natural vs cringe vs risky by mode, by relationship_context)
- Usage patterns: mode breakdown, most common relationship contexts, daily/weekly active usage
- Content quality: which option types (safe/playful/bold) get saved most often
- Moments engagement: thread length distribution, archive rate

**Planned refinements (before or alongside dashboard):**
- Remove debug `print` statements from `LiveVoiceView` once voice mode confirmed stable
- Broader social scenario coverage in prompt templates (workplace, networking, friendship tensions)
- Consider prompt v3 with richer situational framing

## Upcoming — Other
- Existing profiles with `persona_type` in `roaster`, `quick_wit`, `deadpan` hold stale values — data cleanup needed before production

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
| 4 | Structured JSON response format (3 options) | complete — full stack |
| 5 | `social_anxiety_level` on profile | complete — full stack |
| 6 | `relationship_context` + `relationship_other` + `environment` per-request | complete — full stack |
| 7 | Phase 1 analytics: AIResponseRecord, ResponseFeedback, SavedResponse | complete — full stack |
| 8 | Moments: persistent multi-turn conversation threads | complete — full stack |
| 9 | Saved responses screen (My Profile → Saved responses) | complete — full stack |
| 10 | Undoable single-selection feedback (one at a time, toggle off) | complete — full stack |
| 11 | Moments feedback (per-message feedback row, record_id on MomentMessage) | complete — full stack |
| 12 | Active/Archived Moments toggle + 5 active Moments cap | complete — full stack |
| 13 | Voice input for Moment continuation (tap-to-record in thread view) | complete — full stack |
| 14 | Copy button + delivery coaching on Moment assistant cards | complete — frontend |
| 15 | Copy tracking: CopiedResponse model + trackCopy in all screens | complete — full stack |
| 16 | Archive/Unarchive toggle on Moment thread header | complete — full stack |
| 17 | Tap-to-record (replaces hold-to-record) in Live Mode + Moments | complete — full stack |
| 18 | Live Mode: empty transcription guard + visible pulse animation | complete — full stack |
| 19 | Short punchy response enforcement in live_mode.txt + moments_mode.txt | complete — backend |
| 20 | Analytics dashboard | upcoming — Phase 2 |
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
- **2026-05-06** — Frontend updated to render structured JSON responses. `useStreamingResponse` replaced with `useAIResponse` (`src/hooks/useAIResponse.ts`): response typed as `AIResponse | null`, renamed `isStreaming` → `isLoading`, `stream` → `submit`, removed `responseType: 'text'` override so Axios parses JSON natively. `AIOption`, `AIOptionType`, `AIResponse` types added to `src/types/humor.ts`. TextingModeScreen and LiveModeScreen updated: three `OptionCard`s (colored pill label, response text, italic delivery note) + blue `DeliveryCard` for top-level coaching. Full stack now complete end-to-end.
- **2026-05-07** — Voice input for Live Mode. Backend: `openai` added to requirements, `OPENAI_API_KEY` surfaced in `settings/base.py`, `LiveVoiceRequestSerializer` (audio + relationship_context + relationship_other + environment), `LiveVoiceView` (MultiPartParser, Whisper `whisper-1` transcription, transcription passed as `user_request` with empty `situation`), `live-voice/` URL wired. `live_mode.txt` updated to extract context from `user_request` when `Situation` is empty. Frontend: LiveModeScreen fully redesigned — hold-to-record button with pulse animation (`Animated.loop`), `expo-av` `Audio.Recording`, FormData upload to `LIVE_VOICE_PATH`, swipeable single response card with `‹`/`›` navigation and "1 of 3" counter, delivery tip collapsed by default with toggle. `LIVE_VOICE_PATH` added to `humorService.ts`.
- **2026-05-07** — Copy buttons on OptionCards in TextingModeScreen and LiveModeScreen using `expo-clipboard` — tapping "Copy" copies `option.text` and flashes "Copied!" in green for 1.5s. HomeScreen onboarding gate: uses `useProfile()` to check `is_onboarding_complete` on mount; redirects to PersonalitySetup via `navigation.replace` if false; shows loading spinner while fetching. Placeholders updated across both mode screens to be example-driven and encourage rich context.
- **2026-05-07** — HomeScreen built (`src/screens/HomeScreen.tsx`): two mode cards (Texting / Live) + Edit profile link. Added as initial route in `MainNavigator.tsx`. `Home` added to `MainStackParamList`. TextingModeScreen conversation field label renamed to "What's the context?". `PersonaType` model choices replaced with social styles: Storyteller, Charmer, Observer, Witty One, Confident One (removed Roaster, Quick Wit, Deadpan). Migration 0006 generated. `PERSONA_TYPES` in `humor.ts` updated to match. `system_personality.txt` updated: VAR comment and coaching label changed from "social persona" to "social style" with updated examples.
- **2026-05-07** — Phase 1 analytics and feedback system complete. New `apps.responses` Django app with three models: `AIResponseRecord` (logs every AI response — user, mode, relationship_context, situation_summary, response_json, prompt_version, feedback_counts JSONField), `ResponseFeedback` (natural/loved/cringe/risky/saved per record, unique_together prevents duplicates), `SavedResponse` (specific option text saved by user). `FeedbackView` (POST `/api/responses/feedback/`) and `SavedResponseView` (POST `/api/responses/save/`) wired. All three humor views now return `record_id` alongside AI data and create an `AIResponseRecord` after every successful response. Frontend: `record_id` added to `AIResponse` type; feedback row (👍 Natural, 🔥 Loved It, 😬 Cringe, ⚠️ Too Risky, 💾 Save) added below every OptionCard in TextingModeScreen and LiveModeScreen — buttons go active/disabled after tap, Save tracks per-option state, feedback buttons share response-level state.
- **2026-05-07** — "Edit profile" link renamed to "My Profile" across HomeScreen, TextingModeScreen, and LiveModeScreen.
- **2026-05-07** — `social_anxiety_level` chip selector added to PersonalitySetupScreen (Comfortable / Mildly nervous / Often nervous / Social situations are hard). `SOCIAL_ANXIETY_LEVELS` constant added to `src/constants/humor.ts`. `social_anxiety_level` added to `Profile` type and `ProfileUpdate` type in `src/types/profile.ts`. Pre-populated from existing profile on load, defaults to `mild`. Full stack now complete for all expanded profile fields.
- **2026-05-07** — Moments feature complete (full stack). New `apps.moments` Django app with `Moment` (user, title, relationship_context, mode, is_archived, created_at, last_active_at) and `MomentMessage` (moment FK, role user/assistant, content, created_at) models. Four endpoints: `GET/POST /api/moments/`, `GET /api/moments/{id}/`, `POST /api/moments/{id}/continue/`, `PATCH /api/moments/{id}/archive/`. Cap at 38 messages (19 pairs) — auto-archives on cap. `AIService.get_response_with_history()` added for multi-turn Claude API calls with history capped at 36 messages; uses `moments_mode.txt` prompt template. Initial moment creation supports both text and voice (Whisper transcription, same pipeline as LiveVoiceView); continuation is text-only. Frontend: `MomentsScreen` (list with relative timestamps, rel chip, exchange counter, `useFocusEffect` reload); `MomentDetailScreen` (creation form with text + hold-to-record, thread view with right-aligned user bubbles and swipeable assistant OptionCard triplets, per-message card index state, archived banner). Navigation wired: HomeScreen → Moments card → MomentsScreen → MomentDetailScreen. Types in `src/types/moments.ts`. Service in `src/services/momentsService.ts`.
- **2026-05-08** — Product vision expanded to full-spectrum social copilot. CLAUDE.md `## Project` and `## Product Vision` rewritten: broader framing (workplace, friendships, networking, parties alongside dating), mode differentiation, tone do/avoid lists. Input placeholders updated in TextingModeScreen and LiveModeScreen to include workplace, friend group, and networking examples.
- **2026-05-08** — Three fixes. (1) Saved responses screen: `GET /api/responses/saved/` returns user's saved items; `SavedResponseListView` + `SavedResponseListSerializer` (flattens mode/relationship_context/situation_summary from related record); `SavedResponsesScreen` with FlatList, option type pill, situation context, timestamp; "💾 Saved responses" banner on My Profile screen. (2) Feedback: one-at-a-time, undoable: `FeedbackView` rewritten — same type deletes (undo), different type replaces (delete old + create new); `feedbackGiven: Set<string>` → `string | null` in TextingModeScreen and LiveModeScreen; buttons always tappable. (3) Moments feedback: `MomentMessage.response_record` FK to `AIResponseRecord` added (nullable, SET_NULL); migration `0002_momentmessage_response_record`; both Moments views create `AIResponseRecord` (mode=`moments`) and store `record_id` on assistant message; `MomentDetailScreen` adds `msgFeedback`/`msgSaved` state per message ID and renders 5-button feedback row on each assistant card.
- **2026-05-10** — `useFocusEffect` async fix. `SavedResponsesScreen` was passing an async function directly to `useFocusEffect`, which returns a Promise instead of a cleanup function. Fixed: `async fetchData()` defined inside `useCallback` body and called immediately. Pattern: `useFocusEffect(useCallback(() => { async function fetch() {...} fetch(); }, [deps]))`.
- **2026-05-10** — Active/Archived Moments toggle + 5 active cap. Backend: `ACTIVE_MOMENT_CAP = 5` in `MomentListCreateView.post()` — returns 403 if user has 5+ active moments; `GET /api/moments/?archived=true` filters archived moments. Frontend: `MomentsScreen` adds `showArchived` boolean state, pill toggle "Active / Archived", `useFocusEffect` depends on `showArchived`, `listMoments(showArchived)` passes query param; `+ New` button hidden in Archived tab; archived cards at 0.6 opacity.
- **2026-05-10** — Voice input for Moment continuation. Backend: `MomentContinueSerializer` makes `new_input` optional (allow_blank, default=''), adds `audio: FileField(required=False)`, `validate()` requires at least one; `MomentContinueView` adds `MultiPartParser` + `JSONParser`, Whisper transcription when audio present, resolves `user_input` from audio or text, returns `user_input` in response. Frontend: `MomentDetailScreen` thread view adds hold-to-record pulse-animated button (40×40, `#333` idle → `#e53e3e` active) next to text input; `stopRecording` branches on `localMomentId` — null uses creation path, not-null builds FormData and calls `continueMoment`; `momentsService.continueMoment` accepts `FormData | {new_input, environment?}` and sets `Content-Type: multipart/form-data` conditionally. Bug fixed: `startRecording` had `if (!relContext || ...)` guard — `relContext` is creation-form state, empty in thread view, silently blocked the button. Fixed to only apply the `relContext` check when `localMomentId === null`.
- **2026-05-10** — Copy button + delivery coaching on Moment assistant cards. `MomentDetailScreen`: per-message `msgCopied` (`Record<number, string | null>`) and `deliveryExpanded` (`Record<number, boolean>`) state. Each assistant card gets a Copy button (copies selected option text, flashes "Copied!" 1.5s), a "Delivery" toggle (collapsed by default, expands inline blue card). All state keyed by `msg.id` so multiple visible cards are independent.
- **2026-05-10** — Copy tracking system. Backend: `CopiedResponse` model added to `apps.responses` (`user`, `response_record`, `option_type`, `unique_together` prevents duplicate tracking); migration `0002_copiedresponse`; `CopyResponseSerializer`; `CopyResponseView` (POST `/api/responses/copy/`, uses `get_or_create`); URL wired; `CopiedResponseAdmin` (list_display, list_filter, search_fields). Frontend: `trackCopy(recordId, optionType)` added to `responsesService.ts`; called silently (fire-and-forget) in `OptionCard.handleCopy` in TextingModeScreen, LiveModeScreen, and in `MomentDetailScreen.handleCopy`.
- **2026-05-10** — Archive/Unarchive toggle on Moment thread header. Backend: `MomentArchiveView.patch()` now toggles `is_archived` — if archived, unarchives (with 5-active cap check, returns 403 if at limit); if active, archives. Returns `{is_archived: bool}`. Frontend: `archiveMoment` renamed to `toggleMomentArchive` with typed response; `MomentDetailScreen` header always shows "Archive" or "Unarchive" button with a confirmation dialog whose text adapts to the direction of the toggle; local state updated from response. Archived banner text changed from hardcoded message to actual exchange count ("x/19 exchanges used.").
- **2026-05-10** — Tap-to-record UX across Live Mode and Moments. `onPressIn`/`onPressOut` (hold-to-record) replaced with `onPress` (tap to start, tap again to stop) in `LiveModeScreen` and both recording buttons in `MomentDetailScreen` (creation form + continue bar). `toggleRecording()` helper added to each screen. Labels updated: "Hold to speak" → "Tap to speak". Minimum hold duration check removed.
- **2026-05-10** — Live Mode recording improvements. Empty/near-empty transcription guard added to `LiveVoiceView`: transcriptions under 10 characters return a 400 before reaching the AI. Pulse animation made visually distinct: `Animated.parallel` drives both scale (1→1.28) and opacity (1→0.55) at 500ms so the recording state is unmistakably visible.
- **2026-05-10** — Short punchy response enforcement in prompts. `live_mode.txt` and `moments_mode.txt` updated: `text` fields explicitly capped at 1-2 lines (speakable in under 2 seconds), `note` fields capped at one short sentence, `delivery` capped at 1-2 sentences. Analytical/explanatory framing stripped. `ai_service.py`: live mode `max_tokens` reduced 1024 → 600 to match shorter expected output and improve response speed.
- **2026-05-06** — Major context expansion and framing overhaul. `social_anxiety_level` (none/mild/moderate/high, default mild) added to `UserProfile` — migration pending (`0005`). Non-prescriptive language rule embedded as permanent product philosophy and enforced in `system_personality.txt`: all `note` and `delivery` fields must use suggestion framing, never commands. `relationship_context` (stranger/new_acquaintance/crush/friend/close_friend/colleague/date/other) and `relationship_other` (free text, used when other is selected) and `environment` (optional free text) added to both `TextingRequestSerializer` and `LiveRequestSerializer`. `AIService._resolve_relationship()` substitutes `relationship_other` into the prompt when context is "other". All three v2 prompt templates updated: `system_personality.txt` gets `{social_anxiety_level}` and non-prescriptive framing rules; `texting_mode.txt` and `live_mode.txt` get `{relationship_context}` and `{environment}`. Frontend input fields for new request fields are pending next session.
