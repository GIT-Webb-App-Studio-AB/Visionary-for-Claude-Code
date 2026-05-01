# Active Governance

Sprint 14 introduces a strict deterministic gate that prevents token drift from sliding into the codebase between AI generations. Locked DTCG tokens (from `/apply`) become a contract that pre-commit and CI both enforce.

## Setup

1. Run `/apply <style>` to generate or update `tokens/<style-id>.tokens.json`.
2. Mark the file as locked:
   ```json
   {
     "$visionary": {
       "locked": true,
       "governance": {
         "drift_threshold": "block",
         "near_match_tolerance": 0.05,
         "allowed_drifts": ["legacy-token-name"]
       }
     },
     "color": { ... },
     "spacing": { ... },
     "motion": { ... }
   }
   ```
3. Install husky if not present:
   ```bash
   npx husky init
   cp .husky/pre-commit .husky/pre-commit
   ```
4. The supplied `.github/workflows/visionary-governance.yml` runs the same check on every PR and posts a report comment on failure.

## What it catches

- Hex colours (`#06b6d4`) not in `tokens.color.*.$value`
- Tailwind utility classes (`bg-cyan-400`, `p-7`, `duration-450`) not represented in tokens
- Spacing in px / rem / Tailwind not in `tokens.spacing.*`
- Durations in ms / s / `duration-*` not in `tokens.motion.*`
- Typography classes / sizes not in `tokens.typography.*`

## Bypass mechanisms

| Method | When |
|---|---|
| `git commit --no-verify` | Emergency only — logged via husky exit |
| `// visionary-governance: ignore` magic comment | Per-file legacy code that won't be migrated |
| `allowed_drifts: ["pattern"]` in tokens | Per-token escapes (e.g. `legacy-tokens`) |
| `drift_threshold: "warn"` | Soft warnings instead of block |
| `drift_threshold: "off"` | Disable for repo |

## CI integration

`.github/workflows/visionary-governance.yml` triggers on pull-requests touching JSX/CSS/Vue/Svelte/HTML or `tokens/`. On drift, the workflow exits 1 and posts a comment with the report.

## CLI

```bash
node scripts/governance-check.mjs --staged             # husky pre-commit mode
node scripts/governance-check.mjs --base origin/main   # CI mode
node scripts/governance-check.mjs --files src/Card.tsx --tokens tokens/oxblood.tokens.json
node scripts/governance-check.mjs --json               # machine-readable output
```

Exit codes: `0` ok, `1` drift detected (block mode), `2` invocation error.
