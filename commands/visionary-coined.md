---
name: visionary-coined
description: >
  Inspect, rename, view and eject auto-promoted "coined" styles —
  emergent points in the 8D embedding space the user has converged on
  enough times that Visionary promoted them to the extended catalog.
  Backed by Sprint 17 blend persistence + Sprint 21 promotion logic.
  Subcommands: list, view, rename, eject. Invoked as
  /visionary-coined or /coined.
---

# /visionary-coined — Coined-Style Management

Visionary keeps a private list of *coined* styles: blends you've accepted
3+ times across at least 7 days. When that gate is crossed, Visionary
auto-generates a markdown style file under `skills/visionary/styles/extended/`
so the blend behaves like any other catalog entry — searchable, loadable,
indexable.

This command lets you inspect that list, rename auto-generated names,
remove a coined style from the catalog (without losing the underlying
acceptance history), and view the full markdown for any entry.

The underlying JSONL lives at `${CLAUDE_PLUGIN_DATA}/taste/coined-styles.jsonl`
(or `${projectRoot}/taste/coined-styles.jsonl` when no plugin-data env is
set). It is **personal to the user** — it is not project-shared, not
committed to your repo, and not part of the catalog you publish.

See `docs/coined-styles.md` for the full lifecycle and `docs/constraints.md`
for the related constraint-injection feature shipped in the same sprint.

## Subcommands

### `/visionary-coined list`

Lists every coined entry with these columns:

| Column | Meaning |
|---|---|
| `id` | Stable hash of the 8D vector — never changes after creation |
| `name` | Auto-generated 2-word kebab name, or your custom rename |
| `count` | Number of accepted occurrences (vector-similar dedup) |
| `age` | Days since `first_seen` |
| `status` | `pending` (gate not met) / `ready` (eligible for promotion) / `promoted` |

Promoted entries appear with their on-disk filename so you can correlate
them with the markdown under `styles/extended/`.

### `/visionary-coined view <id>`

Prints the full record:

- 8D vector (per-axis breakdown)
- anchor recipe (`{id, weight}` per anchor)
- timestamps (`first_seen`, `last_seen`, `promoted_at`)
- the rendered markdown if promoted

IDs come from `/visionary-coined list`. Partial-prefix match works as long
as it resolves to a single entry — `/visionary-coined view coined-abc` is
fine if only one id starts with `coined-abc`.

### `/visionary-coined rename <id> <new-name>`

Renames a promoted coined style. Updates:

1. The filename under `styles/extended/coined-<old>.md` → `coined-<new>.md`
2. The `## Coined Styles` section in `styles/_index.md`
3. The `name` field in the JSONL record

The entry id (a vector hash) **stays stable** — only the user-facing name
changes. The new name is normalized to lower-case kebab; whitespace and
punctuation are mapped to hyphens.

```
/visionary-coined rename coined-abc123def456 "My Editorial"
# → file becomes coined-my-editorial.md
```

If you try to rename to a target that already exists, the operation
fails — pick a different name or eject the conflicting entry first.

### `/visionary-coined eject <id>`

Removes a coined style from the **catalog**, but keeps it in your taste
history. Specifically:

- The `styles/extended/coined-<name>.md` file is deleted.
- The `_index.md` line is stripped.
- The JSONL entry's `promoted_at` and `promoted_filename` are cleared.
- The `accepted_count`, `first_seen`, `last_seen`, `vector` and recipe
  remain untouched.

Result: the style stops being loaded by the catalog, but if you accept the
same blend again later it can re-promote (the gate-counter starts from
where it left off, not from zero).

```
/visionary-coined eject coined-abc123def456
```

This is the safe inverse of promotion — no data loss.

## How promotion gets triggered

The promotion check runs as part of the post-generation taste-flywheel
hook (Sprint 17 + Sprint 21). In short:

1. You generate a UI with a blend (Sprint 17 `--blend` flag or implicit
   blend from the variants picker).
2. The generation is recorded as an acceptance via the same flywheel that
   logs your taste facts.
3. If a vector-similar entry already exists in the JSONL,
   `updateAcceptanceCount` bumps its count + `last_seen`.
4. If `accepted_count ≥ 3` AND the entry is at least 7 days old AND it
   has not yet been promoted, `promoteToCatalog` writes the markdown +
   updates `_index.md` + marks `promoted_at`.

You do not need to call `/visionary-coined` for promotion to happen — it
fires automatically. This command is purely for **inspection +
override**.

## Storage policy

- Coined styles live in `${CLAUDE_PLUGIN_DATA}/taste/coined-styles.jsonl`
  per the Sprint 15 storage convention.
- The markdown files live under `skills/visionary/styles/extended/` —
  they are indistinguishable from catalog styles from the loader's
  perspective.
- LRU eviction at 100 coined entries (oldest by `last_seen` falls off)
  prevents the JSONL from growing unbounded.

The JSONL is **per-user, never shared** — your colleagues do not see
your coined styles unless you explicitly export and share them
(future Sprint 22 feature; not yet supported).

## Implementation

Subcommands are backed by `hooks/scripts/lib/coined-styles.mjs`:

| Subcommand | Function |
|---|---|
| `list` | `listCoinedEntries(projectRoot, now)` |
| `view` | `readCoinedStyles(projectRoot)` filtered by id |
| `rename` | `renameCoinedEntry({entryId, newName, projectRoot, stylesDir})` |
| `eject` | `ejectFromCatalog({entryId, projectRoot, stylesDir})` |

## Bash invocation

Parse the user's argument string into `[subcommand, ...rest]` and route:

- `list` → `node hooks/scripts/lib/coined-cli.mjs list`
- `view <id>` → `node hooks/scripts/lib/coined-cli.mjs view <id>`
- `rename <id> <name>` → `node hooks/scripts/lib/coined-cli.mjs rename <id> <name>`
- `eject <id>` → `node hooks/scripts/lib/coined-cli.mjs eject <id>`

Unknown subcommands print usage; missing arguments fail with a clear
diagnostic.
