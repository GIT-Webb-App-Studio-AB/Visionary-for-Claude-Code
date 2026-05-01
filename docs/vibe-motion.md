# Vibe Motion Editor

Sprint 13 introduces `/visionary-motion` — a deterministic NL → motion-token re-tuner that closes the feedback loop between Motion Scoring 2.0 and the user.

## How it works

1. User says e.g. `/visionary-motion "mer energiskt"`
2. `intent-map.mjs` resolves the phrase against 12 known vibes (svenska + engelska + fuzzy fallback)
3. Each vibe maps to deterministic adjustments on these tokens: `duration`, `bounce`, `visualDuration`, `easing_profile`, `aars`, `stagger_ms`, `easeout_heavy`
4. `apply-diff.mjs` patches the source — DTCG tokens.json file → JSX inline props → CSS shorthand (in that priority)
5. `scoring-diff.mjs` runs `scoreMotion2` on before AND after, emits a delta report with per-sub-score arrows

## When the model has no clear handle

- `--preview` writes nothing, just produces a diff + delta payload
- Unknown intents return three suggestions ordered by edit-distance
- Tokens not present in DTCG → `manual_hint` flag (CLI does not silently insert)

## CLI shape

```bash
node scripts/visionary-motion-cli.mjs --intent "snabbare" --component src/Card.tsx [--preview]
```

JSON output:

```json
{
  "vibe": "faster",
  "patches": [{ "token": "duration", "from": "200ms", "to": "140ms" }],
  "scoring": {
    "before": { "tier": "Subtle", "mr_10": 2.5 },
    "after":  { "tier": "Subtle", "mr_10": 3.0 },
    "delta":  { "total": 0.05 }
  },
  "summary": "Motion Readiness: 2.5 → 3.0 (+0.50)\n..."
}
```

## Limitations

- Only `duration` / `bounce` / `visualDuration` are auto-patched; the rest emit `manual_hint`. Future rounds will widen this.
- Trace-based component auto-resolution is a follow-up — for now `--component <path>` is required.
- Playwright preview side-by-side is documented in the spec but not implemented in v1 (CLI returns the diff and Claude can render preview via Playwright MCP).
