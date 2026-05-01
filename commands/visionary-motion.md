---
description: Re-tune motion tokens on the most recent generated component using natural language ("mer energiskt", "softer", etc.)
allowed-tools: Read, Edit, Bash, Glob
argument-hint: <intent> [--component <path>] [--preview]
---

# /visionary-motion

Apply a vibe-based motion adjustment to an existing component. Backed by `hooks/scripts/lib/vibe-motion/intent-map.mjs` (12 vibes, deterministic).

## Usage

```
/visionary-motion "mer energiskt"
/visionary-motion "mjukare övergångar" --component src/Card.tsx
/visionary-motion "snabbare" --preview
```

## Pipeline

1. Resolve the intent against the 12-vibe map. Unknown intents print 3 closest suggestions.
2. Identify target component:
   - If `--component <path>` is set, use that
   - Otherwise read the latest `traces/*.jsonl` for the most recent `generation_complete` event
3. Detect token target:
   - DTCG `tokens/*.tokens.json` for the locked style if present
   - JSX inline (`transition={{...}}`, `animate={{...}}`)
   - CSS shorthand (`transition: 200ms ease`)
4. Run `scoreMotion2` before AND after the patch
5. Emit a delta report
6. With `--preview`: do not write changes; capture two Playwright screenshots side-by-side
7. Without `--preview`: apply the patch via Edit and report

## Vibes

| Vibe | Effect |
|---|---|
| `mer energiskt` / `energetic` | bounce += 0.2, duration × 0.8 |
| `mjukare` / `softer` | bounce -= 0.2, ease-out-heavy curve |
| `snabbare` / `faster` | duration × 0.7 (min 100ms) |
| `långsammare` / `slower` | duration × 1.4 (max 800ms) |
| `mer studsigt` / `bouncier` | bounce += 0.3 |
| `lugnare` / `calmer` | linear() multi-stop, no overshoot |
| `kinetiskt` / `kinetic` | enable AARS + stagger 80ms |
| `minimalistiskt` / `minimal` | bounce = 0, duration × 0.8 |
| `filmiskt` / `cinematic` | linear() 6 stops + ease-out-heavy |
| `respons-snäppt` / `snappy` | duration ≤ 150ms, no overshoot |
| `mer lager` / `more-layered` | stagger += 75ms |
| `mindre dramatiskt` / `less-dramatic` | half overshoot, snappier |

## How Claude should drive this

When the user invokes `/visionary-motion`:

1. Read the user's argument string (after the command name)
2. Run `node scripts/visionary-motion-cli.mjs --intent "<intent>" --component <resolved-path> [--preview]`
3. The CLI returns a JSON report with `before`, `after`, `delta`, and `patches`
4. Apply the patches via Edit (unless `--preview` is set)
5. Print a human-readable summary to the user
