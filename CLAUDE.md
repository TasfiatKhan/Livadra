# Livadra — CLAUDE.md

Session continuity document. Update after every significant implementation step.

**Repo:** `https://github.com/TasfiatKhan/Livadra`
**Local path:** `/home/zab/Desktop/Projects/Livadra`
**Landing page repo:** `https://github.com/TasfiatKhan/Witly_Landing` — `/home/zab/Desktop/Projects/witly_landing`

## Skills
Before starting any task, scan `.claude/skills/` for relevant skill files and read any that apply before writing code.

## Project
An AI-powered social intelligence and situational humor assistant for real-world human interactions. Helps users navigate workplace tension, friend group dynamics, networking, parties, texting, dating, banter, and conversational flow. Humor is the tool, not the entire product.

## Product Vision

### What Livadra Is
A broader AI social copilot — not a dating reply generator. Three complementary modes:
- **Texting Mode** — quick one-off help with a specific message or situation
- **Live Mode** — real-time voice-input assistance for situations happening right now
- **Moments** — persistent ongoing social situations with memory and conversational continuity

### Tone
Human, subtle, context-aware, emotionally calibrated, naturally conversational.

**Avoid:** gimmicky rizz-app behavior, pickup-artist energy, try-hard humor, overly polished dialogue, forced cleverness.

**Prioritize:** realism, continuity, low cringe, emotional intelligence, conversational naturalness, socially believable responses.

### What the AI Must Understand
Dating, parties, texting, workplace interactions, networking, awkward silences, friend groups, social anxiety, casual banter, playful teasing, conflict de-escalation, first impressions, group dynamics.

### What the AI Must Avoid
Creepy behavior, manipulation, aggressive flirting, try-hard humor, edgy internet humor, offensive jokes, robotic phrasing, AI-sounding responses, cringe, pickup-artist framing.

### Non-Prescriptive Language (permanent product rule)
The app must **never** directly command users what to say ("Say this", "Use this line", "This will work"). All suggestions must be framed collaboratively: "You could say something like…", "A playful response could be…", "If the vibe feels right, you might try…"

Enforced in the `note` and `delivery` fields of every JSON response and in `prompts/v2/system_personality.txt`.

### Response Structure
Every AI response returns **structured JSON**: safe / playful / bold options (each with `text` + `note`) plus a top-level `delivery` field.

### Context Quality Principle
Thin context → generic responses. Rich context → responses that feel written for that exact moment. Encourage users to provide relationship, vibe, and goal in every request. Reflected in UX copy, placeholders, and onboarding.

## Current Status (as of 2026-05-17)
All Phase 1 + Phase 1.5 features complete. Full stack working end-to-end. UX refinement phase underway.

**Run migrations if not already applied:**
```
sudo docker compose exec backend python manage.py migrate
sudo docker compose up --build -d
```

## Upcoming — Phase 1.75: UX Refinement
- Apply theme tokens to remaining non-screen components (navigation headers, modals)
- Screen-by-screen UX pass: spacing, visual hierarchy, empty states
- Onboarding flow polish

## Upcoming — Phase 2: Analytics Dashboard
Admin/developer view first; user-facing "your stats" screen later. Data already collected:
- `AIResponseRecord` — mode, relationship_context, situation_summary, response_json, prompt_version, feedback_counts
- `ResponseFeedback` — natural/loved/cringe/risky per response per user
- `SavedResponse` — saved option text per user

Planned surfaces: feedback distribution by mode, usage patterns, option type save rates, Moments engagement stats.

Pre-dashboard: remove debug `print` statements in `LiveVoiceView`; broader scenario coverage in prompts; consider prompt v3.

## Upcoming — Other
- Profiles with stale `persona_type` values (`roaster`, `quick_wit`, `deadpan`) need data cleanup before production.

## Stack
| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2 + DRF |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Auth | JWT via djangorestframework-simplejwt |
| AI | Claude API — `claude-sonnet-4-6` |
| AI response | Structured JSON via DRF `Response` |
| Frontend | React Native + Expo bare workflow |
| Language | TypeScript (frontend), Python 3.11 (backend) |

## Architecture Rules (non-negotiable)
- **No direct Claude API calls from views.** All AI interactions go through `backend/services/ai_service.py`.
- **Prompts are three independent layers:** (a) user personality, (b) situational context, (c) request. Kept in `backend/prompts/v{n}/`.
- **Personality profile is always Redis-cached.** Cache logic in `backend/apps/profiles/cache.py`.
- **Frontend never calls API from screens.** All network calls go through `frontend/src/services/`.

## Django App Namespace
Apps live under `apps/` and are registered as `apps.users`, `apps.profiles`, `apps.humor`, etc. `AppConfig.name` must match this dotted path.

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
| 9 | Saved responses screen | complete — full stack |
| 10 | Undoable single-selection feedback | complete — full stack |
| 11 | Moments feedback (per-message, record_id on MomentMessage) | complete — full stack |
| 12 | Active/Archived Moments toggle + 5 active cap | complete — full stack |
| 13 | Voice input for Moment continuation | complete — full stack |
| 14 | Copy button + delivery coaching on Moment assistant cards | complete — frontend |
| 15 | Copy tracking: CopiedResponse model + trackCopy in all screens | complete — full stack |
| 16 | Archive/Unarchive toggle on Moment thread header | complete — full stack |
| 17 | Tap-to-record (replaces hold-to-record) in Live Mode + Moments | complete — full stack |
| 18 | Live Mode: empty transcription guard + pulse animation | complete — full stack |
| 19 | Short punchy response enforcement in live_mode.txt + moments_mode.txt | complete — backend |
| 20 | Design token system (`theme.ts`) + applied to all screens | complete — frontend |
| 21 | Live Mode full redesign: record-only, dark layout, thumb-friendly | complete — frontend |
| 22 | UX nav cleanup: back buttons, avatar on Home | complete — frontend |
| 23 | Moments creation: remove mode + vibe fields, update situation label | complete — full stack |
| 24 | Empty transcription UX: Live Mode error copy, Moments coaching exchange | complete — full stack |
| 25 | Dark/light theme toggle: ThemeContext, darkColors, toggle on HomeScreen | complete — frontend |
| 26 | Livadra logo: SVG + LivadraLogo RN component | complete — frontend |
| 27 | Android app icon: icon.png + mipmap directories | complete — frontend |
| 28 | Analytics dashboard | upcoming — Phase 2 |
| — | Delivery Coaching (v2) | out of scope |

## Working Style
- Architect decides approach, Claude executes.
- Confirm approach before writing significant code.
- Ask before making non-trivial assumptions.

## Settings Notes
- DB config uses individual vars (`DB_NAME`, `DB_USER`, etc.) — no `dj-database-url`.
- `ANTHROPIC_API_KEY` read directly by `AIService` via decouple, not surfaced in Django settings.
- Token blacklisting (`BLACKLIST_AFTER_ROTATION`) disabled — TODO before production.
- `PROFILE_CACHE_TTL` is in settings (not read by cache.py directly from env).
- Android `frontend/android` directory is gitignored — regenerated by `expo prebuild`. Icon changes must be written directly to `mipmap-*` directories after each prebuild.

## Progress Log
- **2026-05-03** — Scaffolded full folder/file structure.
- **2026-05-03** — `config/settings/base.py` + `development.py` written; `production.py` stubbed.
- **2026-05-03** — Core Django files written (`manage.py`, `wsgi.py`, `asgi.py`, `urls.py`); backend bootable.
- **2026-05-03** — `users` app: custom `User` model (email-as-username, `AbstractBaseUser`), registration + `/me` endpoints.
- **2026-05-05** — `profiles` app: `UserProfile` model, profile signal, `ProfileView` (GET/PUT/PATCH `/api/profiles/me/`), Redis cache with re-prime on update.
- **2026-05-05** — Docker Engine installed; containers running, migrations applied, JWT auth verified.
- **2026-05-05** — `services/ai_service.py` + `redis_client.py`; three-layer prompt assembly; `prompts/v1/` templates; `personality_description` added to profile serializers.
- **2026-05-05** — `humor` app: `TextingModeView` (POST `/api/humor/texting/`) + `LiveModeView` (POST `/api/humor/live/`); JWT-auth + onboarding-gated; `StreamingHttpResponse`.
- **2026-05-05** — `username` field added to `UserProfile` (migration 0004); `conversation` → `context` rename across serializer/view/prompt.
- **2026-05-05** — Backend complete; both AI endpoints verified end-to-end.
- **2026-05-06** — Frontend foundation: Axios API client with JWT interceptors + token refresh, `authService`, `AuthContext`, navigation stack (AppNavigator → Auth/MainNavigator), LoginScreen + RegisterScreen.
- **2026-05-06** — Frontend feature-complete: `profileService`, `useProfile`, `PersonalitySetupScreen`, `TextingModeScreen`, `LiveModeScreen`.
- **2026-05-06** — Bug fixes: `index.js` entry point, `password_confirm` fix, Hermes streaming → axios JSON, `ALLOWED_HOSTS` updated for device IP.
- **2026-05-06** — Prompts rewritten to v2: structured JSON output (safe/playful/bold + delivery); `ai_service.py` switched to `messages.create()` + `json.loads()`; `str.replace()` used in prompt builder.
- **2026-05-06** — Frontend updated for JSON responses: `useAIResponse` hook, `AIResponse`/`AIOption` types in `src/types/humor.ts`, `OptionCard` + `DeliveryCard` UI in both mode screens.
- **2026-05-06** — Context expansion: `social_anxiety_level`, `relationship_context`, `relationship_other`, `environment` added to `UserProfile` + both request serializers; `AIService._resolve_relationship()` added; v2 prompts updated; non-prescriptive language rule enforced in `system_personality.txt`.
- **2026-05-07** — Voice input for Live Mode: `LiveVoiceView` with Whisper transcription, hold-to-record UI via `expo-av`, swipeable response cards; `LIVE_VOICE_PATH` in `humorService.ts`.
- **2026-05-07** — Copy buttons on OptionCards (`expo-clipboard`, "Copied!" flash 1.5s); HomeScreen onboarding gate via `useProfile` + `navigation.replace`.
- **2026-05-07** — HomeScreen built (`src/screens/HomeScreen.tsx`); `PersonaType` replaced with social styles (Storyteller, Charmer, Observer, Witty One, Confident One); migration 0006.
- **2026-05-07** — `apps.responses`: `AIResponseRecord`, `ResponseFeedback`, `SavedResponse` models; `/api/responses/feedback/` + `/api/responses/save/`; feedback row on all OptionCards.
- **2026-05-07** — "Edit profile" → "My Profile" across HomeScreen, TextingModeScreen, LiveModeScreen.
- **2026-05-07** — `social_anxiety_level` chip selector in PersonalitySetupScreen; `SOCIAL_ANXIETY_LEVELS` constant; added to `Profile` + `ProfileUpdate` types.
- **2026-05-07** — Moments full-stack: `apps.moments`, `Moment` + `MomentMessage` models, 4 endpoints (`/api/moments/`), 19-exchange cap, `AIService.get_response_with_history()`, `MomentsScreen` + `MomentDetailScreen`.
- **2026-05-08** — `SavedResponsesScreen` + `GET /api/responses/saved/`; feedback rewritten as undoable single-selection; Moments feedback via `MomentMessage.response_record` FK.
- **2026-05-08** — Input placeholders updated in TextingModeScreen + LiveModeScreen with workplace/friend/networking examples.
- **2026-05-10** — `SavedResponsesScreen`: fixed `useFocusEffect` receiving async directly — inner `async function fetch()` pattern required.
- **2026-05-10** — Active/Archived Moments toggle: `ACTIVE_MOMENT_CAP = 5` in backend; `showArchived` pill toggle in `MomentsScreen`.
- **2026-05-10** — Voice continuation for Moments: `audio: FileField` in `MomentContinueSerializer`, Whisper in `MomentContinueView`, record button in `MomentDetailScreen` continue bar; fixed `relContext` guard blocking recording in thread view.
- **2026-05-10** — Copy + delivery on Moment cards: `msgCopied` + `deliveryExpanded` (`Record<number, ...>`) state keyed by `msg.id` in `MomentDetailScreen`.
- **2026-05-10** — `CopiedResponse` model + `POST /api/responses/copy/`; `trackCopy()` in `responsesService.ts`; fire-and-forget in all copy handlers.
- **2026-05-10** — Archive/Unarchive toggle on `MomentDetailScreen` header; `MomentArchiveView.patch()` toggles with 5-cap check; archived banner shows exchange count.
- **2026-05-10** — Tap-to-record replaces hold-to-record in LiveModeScreen + MomentDetailScreen (`onPress` + `toggleRecording()` helper).
- **2026-05-10** — Empty transcription guard in `LiveVoiceView` (< 10 chars → 400); pulse via `Animated.parallel` (scale 1→1.28 + opacity 1→0.55).
- **2026-05-10** — Short response enforcement in `live_mode.txt` + `moments_mode.txt`; live `max_tokens` 1024 → 600.
- **2026-05-11** — Design token system: `frontend/src/theme.ts` with `lightColors`, `typography`, `spacing`, `radii`, `shadow.card`; applied to all 9 screens via `useMemo([colors])`.
- **2026-05-12** — Witly logo: `logo.svg` + `WitlyLogo.tsx` RN component; HomeScreen text replaced with `<WitlyLogo size={56} />`.
- **2026-05-12** — UX nav cleanup: `←` back buttons on Texting/Moments screens; avatar circle on HomeScreen → PersonalitySetup.
- **2026-05-12** — Moments creation form: removed Mode selector + environment field; relabelled situation prompt.
- **2026-05-12** — Empty transcription UX: Live Mode error copy updated; Moments sends coaching exchange instead of 400.
- **2026-05-12** — Dark/light theme toggle: `darkColors` + `AppColors` in `theme.ts`; `ThemeContext` with SecureStore persistence; all 9 screens use `useTheme()`; toggle button on HomeScreen.
- **2026-05-12** — Live Mode full redesign: record-only, dark layout (`#1A1A1A`), thumb-zone button, `relationship_context` optional in `LiveVoiceRequestSerializer`.
- **2026-05-13** — AI prompts v2 refinement: quality test added ("would a smooth person say this?"), type descriptions sharpened, anti-pattern rules added to all 4 files in `backend/prompts/v2/`.
- **2026-05-14** — Profile save navigates to `Home` instead of `TextingMode` (`PersonalitySetupScreen.handleSubmit`).
- **2026-05-17** — Android app icon: 1024×1024 `icon.png` + `adaptive-icon.png` generated (amber `#C4956A` background, white bold serif W); `app.json` updated with `icon`, `android.icon`, `adaptiveIcon` fields; mipmap directories populated for all densities (48–192px) to fix icon not appearing on device.
- **2026-05-18** — Skills library: 3 new lead skills (`backend-lead`, `frontend-lead`, `app-lead`) as stack-agnostic decision frameworks with coordination protocols; all 13 existing skills de-Witly-ified.
- **2026-05-19** — EAS build fix: installed `expo-splash-screen@~0.27.0`, added `expo-av` + `expo-splash-screen` to `app.json` plugins, added `splash.backgroundColor` — fixes AAPT error (`splashscreen_background` color not found) that caused all EAS cloud builds to fail.
- **2026-07-12** — Livadra rename audit: found `frontend/android` + `frontend/ios` (gitignored, prebuild-generated) still referenced old names — Android `app_name`/`rootProject.name`/`applicationId`/`namespace`/Java package were `Witly`/`com.witly.app`, iOS project was still `HumorAI` (pre-Witly name). Ran `expo prebuild --clean --platform all` to regenerate both from `app.json` (now correctly `Livadra`/`com.livadra.app`). Also found `assets/images/icon.png` + `adaptive-icon.png` still had the old "W" glyph — regenerated both as a white bold serif "L" on the same `#C4956A` amber background (Liberation Serif Bold, matches original style) and re-ran prebuild so it propagated to all mipmap densities and the iOS `AppIcon.appiconset`.
- **2026-07-12** — Repo + local folder renamed: GitHub repo `TasfiatKhan/Witly` → `TasfiatKhan/Livadra` (via `gh repo rename`); local path `/home/zab/Desktop/Projects/Witly` → `/home/zab/Desktop/Projects/Livadra`; `origin` remote URL updated. Landing page repo (`Witly_Landing`) intentionally left unchanged — out of scope for this pass.
- **2026-07-15** — Premium brand asset system built: logomark redesigned from the amber/gold circle-"L" to a white/indigo/purple squircle-"L" (gradient `#4338CA → #6D28D9 → #A855F7`), matching an Apple/Notion/Linear-level design direction the user asked for explicitly over the existing in-app amber theme (`theme.ts` accent colors were intentionally left untouched — scoped to the mark and marketing collateral only, confirmed via `AskUserQuestion`). Built an HTML/CSS + headless-Chrome (`google-chrome --headless=new --screenshot`) pipeline to rasterize every asset at exact required pixel dimensions instead of hand-exporting: Play Store icon (512×512), adaptive icon foreground+background (512×512, alpha-correct), feature graphic (1024×500, no alpha), promotional banner (1920×640), social share image (1200×630), favicon (svg + 16/32/180/512 png), and 3 screenshot mockups (1080×1920) built from the real `HomeScreen.tsx` / `TextingModeScreen.tsx` / `MomentsScreen.tsx` layouts, copy, and current amber component colors inside a phone-frame template. All deliverables live in a new top-level `branding/` folder (`app-icon/`, `marketing/`, `screenshots/`, `MANIFEST.md`) plus a published gallery Artifact for visual review. Source files updated in place: `frontend/assets/images/logo.svg`, `LivadraLogo.tsx` (squircle `#6D28D9`, no new native deps), `icon.png`/`adaptive-icon.png` (1024×1024 masters), `app.json` adaptiveIcon `backgroundColor` → `#4F46E5`; ran `expo prebuild --clean --platform all` to propagate into `frontend/android/**/mipmap-*` (verified the new gradient icon renders correctly there). Screenshot mockups are high-fidelity static HTML recreations, not simulator captures — swap in real device screenshots before Play submission if pixel-exact OS chrome is required.
- **2026-07-26** — Logomark redrawn from a plain bold system-font "L" glyph (just `<text>L</text>` on the squircle) to a custom monoline vector mark: a stroked path (round caps/joins, `stroke-width 60` in a 512 grid) forming a clean "L" with a flourish curl at the foot instead of a hard corner. Iterated through several curl placements via the headless-Chrome preview pipeline first — early candidates that curled the stroke back in immediately next to the stem read as a "b"/"6" rather than an "L"; the fix was keeping a full-length horizontal foot and placing the curl only at its far tip, confirmed legible down to a 16px favicon render before committing to it (approved via `AskUserQuestion`). Same path data now drives all three: `frontend/assets/images/logo.svg`, the 1024×1024 `icon.png`/`adaptive-icon.png` masters (adaptive foreground scaled to 0.42× and centered to match the existing Android safe-zone convention), and — per explicit user scope selection — the in-app `LivadraLogo.tsx` component, which previously had no way to render real bezier curves. Added `react-native-svg@15.2.0` (via `npx expo install`, SDK 51-compatible) and rewrote `LivadraLogo.tsx` around `Svg`/`Path`/`LinearGradient` with the exact same path coordinates as `logo.svg`, so the component and the icon are now pixel-identical instead of a Text-glyph approximation. Ran `expo prebuild --clean --platform all` to link the new native module and propagate the icon into `frontend/android/**/mipmap-*` (spot-checked `mipmap-xxxhdpi/ic_launcher.png` — new glyph renders correctly). Scope was deliberately limited to the app icon + in-app logo component only (confirmed via `AskUserQuestion`) — the `branding/` marketing folder (Play Store icon, feature graphic, favicons, screenshot mockups) still reflects the old text-glyph mark from the 2026-07-15 pass and was intentionally left unregenerated.
- **2026-07-26** — Branding folder regenerated with the new curly-L mark, on user follow-up request. No original HTML source files survived from the 2026-07-15 build (only the rendered PNGs), so each asset was rebuilt fresh via the same headless-Chrome pipeline, matching the original layout/copy/gradient by eye against the existing renders rather than from a saved template: `app-icon/*` (5 files) re-rendered directly from the same path data as the live `icon.png`/`adaptive-icon.png`; `marketing/favicon*`, `apple-touch-icon-180x180.png`, and `favicon.svg` re-rendered at each required size; `feature-graphic-1024x500.png`, `promotional-banner-1920x640.png`, and `social-sharing-image-1200x630.png` rebuilt as fresh HTML/CSS compositions (sampled the original PNGs' pixel colors to match gradient stops and background tone before rebuilding). For `screenshots/screenshot-1-home-1080x1920.png`, used targeted pixel-region compositing instead of a full rebuild — located the old glyph's bounding box programmatically (`215,488` to `276,549`), rendered the new mark at 4x and downscaled with Lanczos, and pasted it directly into the existing screenshot so every other pixel (phone frame, copy, UI chrome) stayed untouched. `screenshot-2-texting-mode` and `screenshot-3-moments` don't contain the glyph anywhere, so both were left as-is.
- **2026-07-26** — `feature-graphic-1024x500.png` redesigned per explicit user brief (dark navy gradient, one tilted phone mockup with a subtle purple glow, app icon, tagline "The right thing at the right moment.", Apple-product-marketing minimalism, no eyebrow/subhead copy this time). First pass wrapped the tagline to 3 lines instead of 2 at 46px/420px column — fixed by dropping to 39px in a 460px column with an explicit line break after "at". Phone mockup screen content mirrors the real `HomeScreen.tsx` structure (icon, greeting, Texting Mode/Live Mode/Moments cards) using the actual amber `#C4956A` in-app accent, rotated -4deg, sized to fit the 500px canvas height without cropping. Replaces the previous left-aligned icon+headline feature graphic from earlier in this pass. `MANIFEST.md` header updated to note the mark refresh.
- **2026-07-26** — Full Play Store screenshot set built (12 files: 8 phone + 2×7″-tablet + 2×10″-tablet adaptations), sharing one visual system with the redesigned feature graphic (same navy gradient, black device chrome, radial glow, headline/subcopy typography). Built via a single parameterized Python/HTML generator (`gen.py`, scratchpad-only, not checked in) rather than 12 hand-written files — one template string with format placeholders for every device-frame and typography dimension, called once per asset with a `scale` factor so the phone (1080×1920), 7″ tablet (1200×1920), and 10″ tablet (1600×2560, an exact 4:3 scale of the 7″) all come from the same markup. Each of the 8 phone screens recreates one real app screen (Home, Texting Mode, Live Mode, Moments, Moment thread, Personality setup, Saved responses, dark theme) using the actual amber `#C4956A` accent and card/chip/bubble styles from the live app, paired with a 3–6 word benefit headline and one supporting sentence. First render exposed a design flaw: sparse screen content (2-3 cards) inside a tall 1300px-high device left 700+px of dead flat white space that read as broken rather than intentional. Fixed by (a) shortening the phone mockup to 1000px and (b) adding a soft radial ambient glow anchored at the bottom of every screen (warm amber-tinted for light screens, purple-tinted for dark ones) — turns unavoidable whitespace into a deliberate-looking design element instead of empty void. Tablet adaptations reuse the Home and Texting Mode screen content rather than being tablet-native designs, matching real-world practice for a phone-only (non-tablet-optimized) app. Replaced the old 3-file `branding/screenshots/` set (mismatched purple-gradient style, no headline system) entirely; `MANIFEST.md` rewritten with the full 12-file table and device-category breakdown.
- **2026-11-04** — Privacy policy audit + fixes. Compared `Livadra_Privacy_Policy_Updated_Nov_2026.pdf` against the code and fixed the gaps on both sides. Code: added per-item deletion so the policy's "until you delete them" claim is true — `DELETE /api/moments/<pk>/` (deletes the Moment, its messages, and the `AIResponseRecord`s linked from its messages, which cascade to feedback/saves/copies) and `DELETE /api/responses/saved/<pk>/` (`SavedResponseDetailView`); `deleteMoment()` / `deleteSavedResponse()` services; "Delete" button + confirm alert in `MomentDetailScreen` header, "Remove" on each `SavedResponsesScreen` card. `ai_service.py` no longer puts the first 200 chars of model output into the invalid-JSON error (logs length only), so error logs carry no user content. `deletion/index.html`: personal Gmail → `privacy@zabmation.com`, removed the unbacked "protected backups" claim. Tests: `apps/moments/tests.py` + `SavedResponseDeleteTests` (owner delete + cross-user 404). PDF regenerated with reportlab (matching original Helvetica/navy styling): 18+ minimum age, named Privacy Officer (PIPEDA accountability), hashed-password wording, mic-on-tap disclosure, first-party feedback/save/copy usage, on-device token storage, per-item vs account-level retention in §6, removed the drafting "Implementation note". Local stack note: host port 5432 is taken by a local Postgres.
- **2026-11-04** — Local Docker stack fixed: `docker-compose.yml` backend now sets `DJANGO_SETTINGS_MODULE=config.settings.development` (gunicorn's `wsgi.py` defaulted to production settings, whose `SECURE_SSL_REDIRECT` 301'd every plain-HTTP request from the device). `docker-compose.production.yml` sets production settings explicitly, so it's unaffected. Added `CORS_ALLOWED_ORIGINS` to `backend/.env` + `.env.example` (required by production settings). Docker db host port moved 5432 → 5433 so the local Postgres can keep running; containers still use `db:5432`.
