# Prompt Versioning Policy

Prompts live in versioned folders (`v1/`, `v2/`, ...).

## When to bump the version
- Any change to the structure or ordering of prompt layers
- Rewording that meaningfully changes AI behavior
- Adding or removing a variable placeholder

Bug fixes to spelling or trivial wording can be patched in-place within a version.

## Version history

### v1 (initial)
Plain text responses. System prompt framed the AI as a humor coach ("helping someone be funnier"). Mode prompts returned 3 numbered options as a plain text list. No structured output.

### v2 (product vision reframe)
Complete rewrite. Product direction changed from joke generator to social confidence and conversational intelligence assistant. Key changes:
- System prompt reframes AI identity: social coach, not comedian. "You are not here to write jokes."
- Output format changed from plain text to structured JSON: 3 options (safe / playful / bold), each with a `text` field and a `note`, plus a top-level `delivery` field for situational coaching
- Mode prompts add mode-specific framing: texting prompts ask for texting-aware delivery guidance; live prompts emphasize brevity and in-person delivery factors
- `ai_service.py` updated from streaming (`StreamingHttpResponse`) to a single `messages.create()` call with JSON parsing

## Structure
Each version folder contains three files:

| File | Purpose |
|------|---------|
| `system_personality.txt` | Layer (a): user personality — injected as system context on every request |
| `texting_mode.txt` | Layer (b)+(c): situational context + request for Texting Mode |
| `live_mode.txt` | Layer (b)+(c): situational context + request for Live Mode |

## Placeholders
Prompts use Python `str.format()` syntax: `{variable_name}`.
Document every placeholder in the template file itself with a comment line starting with `# VAR:`.
