# Livadra Brand Assets

Generated 2026-07-15, mark refreshed 2026-07-26. Design language: white + indigo (`#4338CA`/`#4F46E5`) + purple (`#7C3AED`/`#A855F7`) gradient squircle, with a custom monoline "L" mark (a stroked path with a flourish curl at the foot) — replacing the original bold system-font "L" glyph. Apple/Notion/Linear-level minimalism.

## app-icon/
| File | Dimensions | Use |
|---|---|---|
| `play-store-icon-512x512.png` | 512×512, opaque | Upload directly to Play Console → Store settings → App icon |
| `adaptive-icon-foreground-512x512.png` | 512×512, transparent | Reference export of the Android adaptive icon foreground layer |
| `adaptive-icon-background-512x512.png` | 512×512, opaque | Reference export of the Android adaptive icon background layer (solid `#4F46E5`→`#8B5CF6`) |
| `app-icon-master-1024x1024.png` | 1024×1024 | Master source, wired into `app.json` as `expo.icon` / `expo.android.icon` |
| `adaptive-icon-foreground-master-1024x1024.png` | 1024×1024, transparent | Master source, wired into `app.json` as `expo.android.adaptiveIcon.foregroundImage` |

These are already live in `frontend/assets/images/icon.png` and `adaptive-icon.png`, and propagated into `frontend/android/**/mipmap-*` via `expo prebuild --clean`.

## marketing/
| File | Dimensions | Use |
|---|---|---|
| `feature-graphic-1024x500.png` | 1024×500, opaque | Play Console → Store settings → Feature graphic (exact required size) |
| `promotional-banner-1920x640.png` | 1920×640 | Website hero / social header banner |
| `social-sharing-image-1200x630.png` | 1200×630 | Open Graph / Twitter card (`og:image`) |
| `favicon.svg` | vector | Modern browsers, scales losslessly |
| `favicon-16x16.png`, `favicon-32x32.png` | 16×16, 32×32 | Classic favicon sizes |
| `apple-touch-icon-180x180.png` | 180×180 | iOS home screen bookmark icon |
| `favicon-512x512.png` | 512×512 | PWA manifest icon |

`feature-graphic-1024x500.png` was redesigned 2026-07-26 to a dark-navy Apple-product-marketing style — gradient background (`#060810`→`#141A38`), a single tilted phone mockup with a soft purple glow, the app icon, and the tagline "The right thing at the right moment." This is now the **reference visual system** (background gradient, phone device chrome, typography, glow treatment) that `screenshots/` was built to match.

## screenshots/
Redesigned 2026-07-26 to share one visual system with `feature-graphic-1024x500.png` — same dark-navy gradient (`linear-gradient(150deg, #060810 0%, #0C1024 45%, #141A38 100%)`), same black device chrome with a soft radial glow behind it, same bold white headline + lighter one-line subcopy above the device, same amber `#C4956A` in-app accent inside the mockup screens (matching the real `theme.ts` light theme). Superseded the previous 3-screenshot set (older purple-gradient style, no headline/subcopy system).

12 files across 3 required Play Store device categories, each highlighting one product benefit:

| # | File | Benefit |
|---|---|---|
| 1 | `screenshot-phone-1-home-1080x1920.png` | Your social copilot — the 3-mode home screen |
| 2 | `screenshot-phone-2-texting-mode-1080x1920.png` | Never freeze on a reply — safe/playful/bold options |
| 3 | `screenshot-phone-3-live-mode-1080x1920.png` | Help, right when you need it — Live Mode record UI |
| 4 | `screenshot-phone-4-moments-1080x1920.png` | Remembers every ongoing story — Moments list |
| 5 | `screenshot-phone-5-moment-thread-1080x1920.png` | Built for real conversations — Moment thread |
| 6 | `screenshot-phone-6-personality-1080x1920.png` | Calibrated entirely to you — onboarding chips |
| 7 | `screenshot-phone-7-saved-1080x1920.png` | Keep what works — Saved responses |
| 8 | `screenshot-phone-8-dark-mode-1080x1920.png` | Looks as good at night — dark theme |
| — | `screenshot-tablet7-1-home-1200x1920.png` | 7″ tablet adaptation of #1 |
| — | `screenshot-tablet7-2-texting-mode-1200x1920.png` | 7″ tablet adaptation of #2 |
| — | `screenshot-tablet10-1-home-1600x2560.png` | 10″ tablet adaptation of #1 |
| — | `screenshot-tablet10-2-texting-mode-1600x2560.png` | 10″ tablet adaptation of #2 |

Phone screenshots use 1080×1920 (9:16, standard Play phone spec). Tablets reuse the phone-frame content (this is not a tablet-optimized app) scaled onto larger, slightly-wider canvases matching real 7″/10″ device resolutions (Nexus 7: 1200×1920, Nexus 10: 1600×2560 — the two are an exact 4:3 scale of each other, generated from one parameterized template). All satisfy Play Store screenshot rules (min 320px, max 3840px, ratio between 1:2 and 2:1).

These are high-fidelity static mockups, not simulator captures. Swap in real device/simulator screenshots before submitting to Play if pixel-exact device chrome is required.

## Not included
Google Play no longer has a distinct "promo graphic" upload slot (deprecated); `promotional-banner-1920x640.png` covers general marketing/web use instead.
