# Prompt Versioning Policy

Prompts live in versioned folders (`v1/`, `v2/`, ...).

## When to bump the version
- Any change to the structure or ordering of prompt layers
- Rewording that meaningfully changes AI behavior
- Adding or removing a variable placeholder

Bug fixes to spelling or trivial wording can be patched in-place within a version.

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
