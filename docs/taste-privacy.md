# Taste privacy & data model

Sprint 05 introduced a passive + active signal loop that learns your design preferences over time. This doc explains **what is stored, where, and how to turn it off** — for yourself, for your organisation, or for a single session.

## TL;DR

- All taste data lives on your machine under `./taste/` in the project root. Nothing leaves the box — no network calls, no telemetry, no third-party API.
- Set `VISIONARY_DISABLE_TASTE=1` to turn off capture, harvest, and context injection entirely.
- `git-harvest` only reads files that *you generated via Visionary* (marked with `.visionary-generated` in the header). It never reads user-authored source files.
- `/visionary-taste reset` wipes everything and starts over.

## What gets stored

### `taste/facts.jsonl`

Append-only JSONL file. One line per structured **taste fact**. Schema: `skills/visionary/schemas/taste-fact.schema.json`.

Example line (pretty-printed for readability — in the file it's one line):

```json
{
  "id": "01KPWH641DAT043KS804273JYG",
  "scope": { "level": "project", "key": "my-dashboard" },
  "signal": { "direction": "avoid", "target_type": "style_id", "target_value": "fintech-trust" },
  "evidence": [
    { "kind": "explicit_rejection", "quote_or_diff": "hate this fintech-trust look", "at": "2026-04-23T10:00:00.000Z" }
  ],
  "confidence": 0.85,
  "created_at": "2026-04-23T10:00:00.000Z",
  "last_seen": "2026-04-23T10:00:00.000Z",
  "flag": "active"
}
```

Fields of interest:
- **`scope.level`**: `global` (applies to every project), `project` (only this repo), `component_type`, or `archetype`.
- **`signal.target_value`**: free text for patterns, canonical style id for style matches. Truncated to 160 chars max.
- **`evidence`**: preserved trail. `explicit_rejection` / `explicit_approval` come from phrases you typed; `git_delete` / `git_heavy_edit` / `git_kept` come from the passive harvester; `pairwise_pick` comes from `/variants` picks. Each entry stores a short quote or diff summary — **truncated to 240 characters**.
- **`flag`**: lifecycle. `active` = applied with confidence weighting. `permanent` = hard-block when `direction=avoid` (earned after 3+ evidence entries across 2+ kinds with confidence ≥ 0.9). `decayed` = dormant after 30+ days of no new evidence.

### `taste/pairs.jsonl`

Append-only JSONL. Captures which variant you picked from `/variants` sessions. Schema: `skills/visionary/schemas/taste-pair.schema.json`. Used for FSPO few-shot injection into Step 4 of the style-selection algorithm.

### `taste/accepted-examples.jsonl` — Sprint 06 DesignPref RAG

Append-only JSONL. One entry per generation you (the user) accepted. Schema: `skills/visionary/schemas/accepted-example.schema.json`. Used by the DesignPref RAG loop to surface top-k historical-taste anchors into the critic prompt.

Stored per-entry:
- **Brief summary** (truncated to 500 chars).
- **Brief embedding** — 384-dim dense vector from `hooks/scripts/lib/embed-brief.mjs`. Produced by a **zero-dep hashed n-gram embedder** (`embedder_id: "hashed-ngram-v1"`), see `docs/style-embeddings.md`. No API calls.
- **style_id, product_archetype, component_type** — for rotation + filtering.
- **final_scores + composite** — calibrated scores at acceptance.
- **screenshot_path** — relative path to `taste/screenshots/<id>.png`. Screenshots are local only, never uploaded.
- **accepted_at, acceptance_kind** — ISO timestamp + whether acceptance was explicit (you typed approval), implicit (critique auto-closed with composite ≥ 8.0), or pairwise_pick (from `/variants`).

Rotation: max 50 entries globally. When exceeded, the oldest entry from the most-overrepresented `product_archetype` is evicted.

### `taste/screenshots/`

PNG files referenced by `accepted-examples.jsonl`. Cleaned up alongside their JSONL entries on rotation. Never transmitted. Safe to delete — the RAG loop degrades gracefully when screenshots are missing.

### `taste/aging.log`

Tab-separated log of aging runs. One line per run, e.g.:

```
2026-04-23T12:00:00.000Z	promoted=1	decayed=3	deleted=0	unchanged=12	removed=0	dry-run=false
```

### `system.md` (legacy)

Pre-Sprint-05 taste file. On the first UserPromptSubmit tick after the Sprint 05 update, this file is **auto-migrated** to `taste/facts.jsonl` via `scripts/migrate-system-md-to-facts.mjs`. After migration it keeps a `<!-- MIGRATED ... -->` header and is ignored by the runtime. You can delete it, archive it, or keep it for reference.

### `.visionary-cache/last-git-harvest`

Rate-limit stamp. Unix millis of the last `harvest-git-signal` run for this project. Harvest skips if less than 24 hours have passed. Safe to delete — next session will harvest fresh.

### `.visionary-cache/last-variants-brief.json`

Snapshot of the most recent `/variants` invocation's brief + candidate list. Used by `update-taste.mjs` to pair-up your pick with rejected variants. Overwritten on every `/variants`. Safe to delete.

### `.visionary/traces/<session_id>.jsonl` — Sprint 06 trace logging

Append-only event log. One line per structured event emitted by any Visionary hook or script during a Claude Code session. Schema: `skills/visionary/schemas/trace-entry.schema.json`.

Example line (pretty-printed; stored as one line):

```json
{
  "session_id": "sess-abc123",
  "generation_id": "gen-xyz",
  "round": 2,
  "ts": "2026-04-23T10:05:00.000Z",
  "event": "critic_craft_output",
  "emitter": "critic-craft",
  "duration_ms": 1820,
  "payload": {
    "scores": { "typography": 7.5, "contrast": 9.0 },
    "top_3_fixes": [ /* … */ ]
  }
}
```

Fields of interest:
- **`session_id`** — shared across sibling hooks in the same Claude Code session (derived from `CLAUDE_SESSION_ID`, falls back to a stable daily hash).
- **`generation_id`** — one id per generated component; multiple rounds share it.
- **`event`** — closed enum, see the schema. Covers critique output, acceptance / rejection, API calls, arbitration between critics, and error events.
- **`payload`** — free-form per-event, deliberately not strictly typed so new facts can attach without a schema migration.

**Purpose.** `.visionary/traces/` feeds `scripts/visionary-stats.mjs`, which mines recurring fixes, per-session timelines, and cross-session trends. The GEPA-style "pre-apply fix X" recommendation comes from this data.

**Rotation + retention (Sprint 06 Task 19.5).** Default lifecycle:

- Files under 50 MB remain in their active form; rotated to `<id>.1.jsonl` when they cross the threshold.
- Files older than **7 days** are gzipped in place (`<id>.jsonl.gz`). Uses Node's built-in `zlib` — no dependency.
- Files older than **90 days** are deleted. Override with `VISIONARY_TRACE_RETENTION_DAYS=<n>` (accepts any positive integer).
- Rotation runs once per day on the first SessionStart hook tick.

**Opt-out.** Set `VISIONARY_NO_TRACES=1` to disable all writes. Existing trace files on disk are left untouched; the hooks simply stop appending. Re-enable and new events resume. Rotation also respects the opt-out — a disabled project will NOT compress or delete existing traces.

**No-network guarantee.** Traces are local-only. Nothing in the trace pipeline calls out. Rotation uses `zlib` (Node core) for compression.

## What does NOT get stored

- Full prompt text. Only a short quote (≤ 240 chars) per evidence entry.
- File contents outside of `.visionary-generated`-marked files. `harvest-git-signal.mjs` does not read source code from files it didn't write.
- Git blob content. The harvester uses `git log --numstat` only — line counts, not contents.
- API keys, secrets, env vars, cookies, anything you type that isn't clearly a taste phrase.

## How to opt out

### Full opt-out (strongest)

```bash
export VISIONARY_DISABLE_TASTE=1
```

Effect:
- `update-taste.mjs` returns silently without reading or writing anything.
- `harvest-git-signal.mjs` returns empty without scanning the repo.
- `inject-taste-context.mjs` returns silently — no facts or pairs are added to additionalContext.
- Existing `taste/facts.jsonl` / `taste/pairs.jsonl` are untouched. Re-enable and they resume.

### Trace-only opt-out

Leave taste capture on, disable only the Sprint 06 trace log:

```bash
export VISIONARY_NO_TRACES=1
```

Effect:
- `hooks/scripts/lib/trace.mjs` short-circuits on every `trace()` call.
- `scripts/visionary-stats.mjs` still runs but reports "no trace files" until traces resume.
- Taste capture, harvesting, and context injection are unaffected.

Set this in your shell profile, in a CI script, in a `.env` your editor loads, or in an org-wide wrapper — anywhere the hooks' process environment can pick it up.

### Per-project opt-out

Add a `.env` file or an editor-specific config that exports `VISIONARY_DISABLE_TASTE=1` when this project is active.

### Temporary opt-out

Run a single session with the env var set, no permanent config change needed:

```bash
VISIONARY_DISABLE_TASTE=1 claude
```

### Capture-only opt-out (advanced)

Want facts to accumulate but never influence the next generation? You can run `VISIONARY_DISABLE_TASTE=1` selectively on the inject-context side by commenting out that hook in `hooks/hooks.json`. The capture-only mode is rarely useful in practice — if you don't trust the profile, reset it.

### One-off forget

```
/visionary-taste forget <fact-id>
```

Removes a single fact. IDs come from `/visionary-taste show`.

### Full reset

```
/visionary-taste reset
```

Prompts for confirmation, then deletes `taste/facts.jsonl` and `taste/pairs.jsonl`. The next hook tick starts from scratch (legacy `system.md` migration only runs if that file is un-migrated — a migrated one is ignored).

## How to audit

Whenever you want to see what the profile knows about you:

```
/visionary-taste status          # counts (active, permanent, pairs, decayed)
/visionary-taste show project    # list all facts scoped to the current project
/visionary-taste show global     # list all globally-scoped facts
```

Or just open `taste/facts.jsonl` in any text editor. It's JSONL — one JSON object per line, human-readable.

## Sharing, exporting, committing

`taste/` is a normal directory. You can:
- **Commit it** — your team shares the profile. Useful for a design-system repo where consistent taste across authors matters.
- **Gitignore it** — personal profile. Default-recommended for most projects.
- **Export / import** — copy `taste/facts.jsonl` between machines to carry your profile with you.

A `.gitignore` stanza to keep it local:

```
# Visionary taste profile — personal, not team-shared
taste/
.visionary-cache/
```

## Version migration

If a future Sprint changes the schema (`taste-fact.schema.json` version bump), the migration script will read the old format and write the new one, stamping `<!-- MIGRATED ... -->` on the pre-migration file so it's clear what happened. Rollback = keep the old file and the new file never wins.

## No-network guarantee

Nothing in the Sprint 05 taste flow calls out. Specifically:
- No Anthropic API, OpenAI API, or other LLM API at capture time.
- No Voyage / OpenAI / any embedding API — style embeddings are pre-computed heuristically by `scripts/build-style-embeddings.mjs` and shipped in the repo.
- No telemetry, analytics, crash reporting.
- No DNS lookups triggered by these hooks.

`check-for-updates.mjs` (SessionStart) runs `claude plugin update` which does contact the marketplace — that is a Claude Code CLI operation, not a taste operation, and is separately disable-able via `VISIONARY_NO_AUTOUPDATE=1`.

## Security posture

- All writes are atomic (`rename(tmp, target)` on POSIX; best-effort on Windows).
- JSONL readers tolerate corruption — a single broken line is skipped, never fatal.
- Fact evidence is truncated at write time (240 chars) to bound line length.
- No subprocess spawning except `git` for the harvester (whitelisted flags only: `log`, `ls-files`).
- No shell interpolation — Node's `spawnSync` with an explicit argv array, no `shell: true`.

If you find a privacy or security issue, open an issue at the project's GitHub repo (see `README.md` for the link). Do not include your `taste/` contents in the report unless you've sanitised them.
