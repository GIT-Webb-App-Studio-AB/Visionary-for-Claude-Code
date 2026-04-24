---
name: visionary-taste
description: >
  Inspect, debug, and manage the taste profile (facts + pairs + aging).
  Backed by the Sprint 05 taste flywheel — the profile that learns which
  styles, palettes, motion tiers and typography you accept or reject across
  projects. Subcommands: status, show, forget, reset, age, export, import,
  browse. Invoked as /visionary-taste or /taste.
---

# /visionary-taste — Taste profile inspection & debug

After Sprint 05, Visionary maintains a structured taste profile under
`./taste/` in the project root. Active signals come from your turn phrasing
(`update-taste.mjs` hook); passive signals come from what you do to generated
files in git (`harvest-git-signal.mjs` hook); pairwise signals come from
`/variants` picks. All three feed `taste/facts.jsonl` and
`taste/pairs.jsonl`.

This command lets you see what the profile knows, remove individual facts,
reset everything, or manually trigger an aging pass.

## Subcommands

### `/visionary-taste status`

Prints counts: how many active / permanent / decayed facts, how many pairs,
and the paths to the underlying files.

### `/visionary-taste show [scope]`

Lists facts filtered by scope. Scope is one of:

- `all` (default) — every fact regardless of scope
- `project` — facts scoped to the current project only
- `global` — facts that apply everywhere
- `component_type` — facts bound to a specific component class (e.g. dashboard)
- `archetype` — facts bound to a brand archetype (Ruler, Sage, …)

Each fact shows its ULID, direction (avoid/prefer), target, scope,
confidence, evidence count, and days since last seen. Permanent facts carry
a 🔒; decayed facts carry 💤.

### `/visionary-taste forget <fact-id>`

Removes a single fact. IDs come from `/visionary-taste show`. No
confirmation — one ID, one fact gone. Pairs are not affected.

### `/visionary-taste reset [--force]`

Wipes `taste/facts.jsonl` AND `taste/pairs.jsonl`. First invocation asks
for confirmation; re-run with `--force` to proceed. `.visionary-cache/`
and `system.md` are untouched.

### `/visionary-taste age [--dry-run]`

Manually triggers the aging rules (`hooks/scripts/lib/taste-aging.mjs`):

- Active + confidence ≥ 0.9 + ≥ 3 evidence + ≥ 2 kinds → `permanent`
- Active + `last_seen > 30 days` → `decayed` (confidence ×0.5)
- Decayed + confidence < 0.2 → deleted

Normally aging runs passively as part of the flywheel; this subcommand lets
you see the effect immediately. `--dry-run` reports what would change
without writing.

### `/visionary-taste export --handle <handle> [options]`

Writes a `.taste` TOML dotfile from the current project's flywheel — the
shareable interchange format. See `docs/taste-dotfile-spec.md` for the full
schema.

Key options:

- `--handle <handle>` — REQUIRED. Lower-case, hyphen-separated. Matches
  `[a-z0-9][a-z0-9-]{2,63}`.
- `--out <path>` — file path; defaults to stdout.
- `--author "Name"` / `--description "one-liner"` — metadata.
- `--inherits-from a,b,c` — comma-separated parent handles (resolved at
  import time, not export time).
- `--max-pairs <n>` — cap FSPO examples (default 8).
- `--include-evidence-quotes` — opt-in; privacy-scrubs are ON by default.
- `--include-screenshots` — reserved for future; no-op in v1.0.

Privacy defaults (always applied unless opted out):

- project-name removed from `scope.key`
- evidence quotes dropped
- URL-like substrings in reasons replaced with `<url>`
- pair context summaries truncated to 60 chars

Example:

```bash
/visionary-taste export --handle pawelk-2026-04 --author "Pawel K." --out my-taste.taste
```

### `/visionary-taste import <source> [options]`

Reads a `.taste` file (local path or `https://` URL) and merges its
preferences into the current project's flywheel. Imported facts land at
`confidence × 0.6` — a starting point, not a ceiling. Local signals always
win on conflict.

Sources:

- local path: `./colleague.taste`
- http(s) URL: `https://raw.githubusercontent.com/user/repo/main/pawelk.taste`
- bare handle: `pawelk-2026-04` (looked up in the community index via
  `/visionary-taste browse`)

Options:

- `--dry-run` — show what would change, don't write.
- `--allow <domain>` — temporarily extend the URL allowlist.
- `--no-network` — forbid URL/handle resolution (local paths only).
- `--multiplier <0.1-1.0>` — override the import confidence multiplier.

### `/visionary-taste browse [--search <query>]`

Lists `.taste` profiles available in the community index (see
`docs/taste-index.md`). Results include handle, author, short description
and inherits_from chain. Use `--search` to filter by free text.

## How it connects to the skill

When you run `/visionary` or any Visionary generation command, the
UserPromptSubmit hook `inject-taste-context.mjs` reads `taste/facts.jsonl`
and `taste/pairs.jsonl`, selects the most-relevant top-12 facts (scoped to
the project, ranked by flag + confidence × recency), picks up to 8 diverse
pairs via the embedding-based sampler, and injects them into the current
turn's `additionalContext`.

This puts the profile into the LLM's working memory for the same turn —
Step 4.5 of the style-selection algorithm then applies structured score
adjustments instead of the old binary rejection flag. See
`skills/visionary/context-inference.md` § Step 4.5 for the exact
adjustment table.

## Privacy

- Everything stays on disk under `./taste/`. No network calls.
- `export VISIONARY_DISABLE_TASTE=1` to silence capture, harvest, and
  injection without deleting existing data.
- See `docs/taste-privacy.md` for the full data model + opt-out guide.

## Implementation

The subcommands are backed by three scripts:

| Subcommands | Script |
|-------------|--------|
| `status`, `show`, `forget`, `reset`, `age` | `scripts/taste-debug.mjs` |
| `export` | `scripts/visionary-taste-export.mjs` |
| `import`, `browse` | `scripts/visionary-taste-import.mjs` |

Run any of them directly with the same flags for CI or shell-alias use:

```bash
node scripts/taste-debug.mjs status
node scripts/visionary-taste-export.mjs --handle me-2026-04 --out me.taste
node scripts/visionary-taste-import.mjs ./colleague.taste --dry-run
```

## Bash invocation

Parse the user's argument string into `[subcommand, ...rest]` and route:

- `status | show | forget | reset | age` → `node scripts/taste-debug.mjs <sub> <rest…>`
- `export` → `node scripts/visionary-taste-export.mjs <rest…>`
- `import | browse` → `node scripts/visionary-taste-import.mjs <sub> <rest…>` (for `browse`) or `node scripts/visionary-taste-import.mjs <rest…>` (for `import`)

Trust the underlying scripts to handle unknown flags and argument
validation — they print usage text on failure.
