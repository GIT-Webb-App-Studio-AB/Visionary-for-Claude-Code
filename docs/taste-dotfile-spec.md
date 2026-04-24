# `.taste` dotfile specification

**Version:** `1.0.0`
**Status:** Stable (from Sprint 7)
**MIME hint:** `application/vnd.visionary.taste+toml`
**Extension:** `.taste` (single file) or `.taste.toml` (when tooling needs an
explicit extension)

A `.taste` file is a portable, human-readable snapshot of a Visionary taste
profile. It exists so designers and teams can **share their aesthetic
preferences** the same way they share `.eslintrc`, `.prettierrc` or
`package.json`: commit it, diff it, fork it, inherit from it.

`.taste` files are the interchange format between:

- An individual designer's `taste/facts.jsonl` (the flywheel)
- Designer packs distributed with Visionary (`designers/*.taste`)
- Community-curated profiles in the shareable index (`visionary taste browse`)

They are **not** the flywheel's storage format. JSONL stays the append-only
source-of-truth on disk; `.taste` is the export/import surface.

---

## Format: TOML 1.0

TOML was chosen over JSON / YAML because:

- Diffs readably in git (line-per-key, no brace-nesting noise)
- Hand-editable without blowing up on trailing commas
- Supports comments, which `.taste` files lean on heavily for explaining
  *why* a designer avoids `glassmorphism`
- Has unambiguous string escape rules (matters for non-Latin `target_value`s
  like Swedish `förlåt`, German `Überschrift`)

The file MUST parse as valid TOML 1.0. Files that fail `toml.parse()` are
rejected by `visionary taste import`.

---

## Schema overview

```toml
schema_version = "1.0.0"      # REQUIRED. See § Schema versioning.
author        = "Pawel K."     # OPTIONAL. Human-readable.
handle        = "pawelk-2026-04" # REQUIRED. Lower-case, hyphen-separated.
inherits_from = []              # OPTIONAL. See § Inheritance.
description   = "…"             # OPTIONAL. One-sentence editorial summary.

[metadata]        # informational — never used for scoring
[preferences]     # what to lean toward / away from (styles, palettes, motion)
[typography]      # type preferences
[pairs]           # FSPO demonstrations of taste
[constitution]    # free-text principles injected into critic system prompts
[privacy]         # what export MUST scrub
```

Every top-level table is optional **except** the file-level keys
(`schema_version`, `handle`). An otherwise-empty `.taste` file with only
those two keys is legal — it just carries no signal.

---

## File-level keys

### `schema_version` (REQUIRED)

SemVer string. The importer rejects the file if the major version is higher
than what it understands. Minor/patch bumps are backwards compatible; the
importer drops unknown keys with a warning, keeps the rest.

```toml
schema_version = "1.0.0"
```

### `handle` (REQUIRED)

Globally-intended identifier. Must match `[a-z0-9][a-z0-9-]{2,63}`. Used as
the short form in `visionary taste import <handle>` (which looks the handle
up in the community-repo index).

```toml
handle = "pawelk-2026-04"
```

Convention: **author-lastname + ISO year-month**. Rotate monthly if you want
to publish your evolving taste; keep stable if you want a fixed reference.

### `author` (OPTIONAL)

Free-text name of the human owner.

### `inherits_from` (OPTIONAL)

Array of handle strings (or URLs — see § URL inheritance below). The
importer resolves these *first*, with cycle detection, then layers the
current file's signals on top. Later entries override earlier ones for the
same `(direction, target_type, target_value)` key.

```toml
inherits_from = ["dieter-rams", "swiss-muller-brockmann"]
```

Cycles throw. The importer keeps a stack of handles it is currently
resolving and refuses to descend into one that is already on the stack.

### `description` (OPTIONAL)

One-sentence editorial summary. No formatting. Capped at 240 chars by the
importer (longer strings are truncated with an ellipsis and a warning).

---

## `[metadata]` — informational

Never used for scoring. Useful for humans and for the `visionary taste
browse` listing.

```toml
[metadata]
created_at              = "2026-04-22T10:00:00Z"  # ISO-8601
generations_represented = 47        # how many /visionary turns shaped this
components_kept_in_git  = 38        # passive-approve signal count
rejection_signals       = 12        # explicit /variants rejections
```

Keys not listed here are tolerated (forward-compat).

---

## `[preferences]` — the core signal

This table is what the flywheel primarily consumes. Every entry in the
arrays maps 1:1 onto a `facts.jsonl` record with `confidence` set to the
value given (scaled by the import multiplier, § Import semantics).

### `prefer_styles` / `avoid_styles`

Arrays of inline tables. Each entry is:

```toml
{ id = "…", confidence = 0.85, reason = "…" }
```

- `id` (REQUIRED) — a style id from `skills/visionary/styles/_index.json`.
  The importer warns on unknown ids but keeps them (new styles might appear
  after this `.taste` was authored).
- `confidence` (REQUIRED) — `0.0` ≤ `x` ≤ `1.0`. See § Import semantics for
  how it combines with local flywheel data.
- `reason` (OPTIONAL) — free text. Makes the `.taste` file self-documenting
  and survives round-trips.

```toml
[preferences]
prefer_styles = [
  { id = "swiss-muller-brockmann", confidence = 0.85 },
  { id = "bauhaus-dessau",         confidence = 0.78 },
  { id = "editorial-serif-revival", confidence = 0.72, reason = "Looks editorial without being pretentious." },
]

avoid_styles = [
  { id = "fintech-trust",  confidence = 0.95, reason = "too generic" },
  { id = "glassmorphism",  confidence = 0.88 },
  { id = "claymorphism",   confidence = 0.82 },
]
```

### `prefer_palette_tags` / `avoid_palette_tags`

Arrays of short strings matching `palette.tags[*]` in the style index. No
confidence — tag preferences are all-or-nothing.

```toml
prefer_palette_tags = ["neutral", "accent-saturated", "warm-paper"]
avoid_palette_tags  = ["dark-gradient", "neon"]
```

### `prefer_motion_tiers` / `avoid_motion_tiers`

Arrays of motion tier names. Valid values: `Static`, `Subtle`, `Expressive`,
`Kinetic`.

```toml
prefer_motion_tiers = ["Subtle", "Expressive"]
avoid_motion_tiers  = ["Kinetic"]
```

---

## `[typography]` — type preferences

```toml
[typography]
preferred_families     = ["editorial-serif", "grotesk-modern"]
avoided_families       = ["Poppins", "Comic Sans"]
preferred_scale_ratio  = 1.25   # modular scale factor
max_font_weight_count  = 2      # how many weights to load
```

All keys optional. The importer maps `preferred_families` into
`direction = prefer`, `target_type = typography`, one fact per family.

---

## `[pairs]` — FSPO demonstrations

Few-shot pairwise examples. These demonstrate *choices*, not just
preferences — picking style A **over** styles B, C under context X is a
stronger signal than preferring A in the abstract.

```toml
[pairs]
examples = [
  { chosen = "bauhaus-dessau",          rejected = ["fintech-trust", "saas-b2b-dashboard"], context = "fintech landing" },
  { chosen = "editorial-serif-revival", rejected = ["glassmorphism", "claymorphism"],       context = "blog" },
]
```

- `chosen` (REQUIRED) — one style id.
- `rejected` (REQUIRED) — array of one or more style ids.
- `context` (OPTIONAL but recommended) — short free-text brief summary.

Each entry maps onto a `pairs.jsonl` record at import time. FSPO sampler
(`hooks/scripts/lib/pair-sampler.mjs`) uses these as few-shot anchors when
injecting context into turns.

---

## `[constitution]` — free-text principles

A single multi-line string that is injected into the critic system prompt
when the `.taste` is active. This is where designers encode *rules of the
house* that don't fit the structured signal model.

```toml
[constitution]
principles = """
Negative space is typography's punctuation. Never fill a margin because
it's empty.

A 2-column grid is more sophisticated than a 3-column grid unless you
have 300+ data points.

If you can't tell the difference between a button and a link, neither
can a user with a screen reader.
"""
```

The importer trims each line and concatenates. Hard limit: **2048 chars**
after trim. Longer constitutions are rejected.

Constitutions are layered in inheritance order — a child `.taste` file's
constitution is appended to the parent's, separated by a blank line and a
comment header identifying the source.

---

## `[privacy]` — scrub-list

Declares what the *exporter* must remove before writing this file. It
cannot re-introduce data that was already removed — it is a statement of
intent for re-exports.

```toml
[privacy]
scrub_fields        = ["brief_summary", "project_names", "screenshots"]
redact_evidence     = true   # drop fact.evidence[*].quote_or_diff content
strip_urls          = true   # redact URLs in any remaining free-text
```

### Default scrub-list (applied even if `[privacy]` is absent)

| Field | Default | Rationale |
|-------|---------|-----------|
| `fact.evidence[*].quote_or_diff` | truncate to first 80 chars | Prevents leaking NDA-covered prompts |
| `fact.scope.key` when `level=project` | replaced with `"<project>"` | Don't publish internal project names |
| `pair.context.brief_summary` | truncated to first 60 chars | Same reason |
| `screenshots` (if any) | never exported | Binary bloat + likely confidential |
| URL-like substrings in free text | replaced with `<url>` | Prevent leaking internal hostnames |

Exporters MUST apply the default list. `[privacy]` may *add* to it but
cannot *remove* items from it.

---

## Import semantics

Given a `.taste` file, the importer:

1. Parses + validates against schema (reject on major-version mismatch or
   schema violation).
2. Resolves `inherits_from` recursively, with a stack-based cycle detector.
3. Builds a *merged* view: later files override earlier ones on dedup key
   `(direction, target_type, target_value)`; the child constitution is
   appended.
4. Maps each preference-entry onto a `fact` record with:
   - `scope = { level: "global", key: "*" }` unless the file declares
     otherwise (Sprint 7 v1.0 does not; reserved for future use).
   - `confidence = imported_confidence * IMPORT_MULTIPLIER` (default 0.6).
     Imported signals are **starting points**, not absolutes — local user
     signals always outrank them.
   - `flag = "active"` (imports are never imported-as-permanent).
   - `evidence = [{ kind: "imported_from", quote_or_diff: handle, at: now }]`
5. Merges into the target project's `facts.jsonl`. On conflict with an
   existing local fact sharing the same dedup key: **local wins**. The
   imported fact is discarded and a line is written to
   `taste/import.log` noting the conflict.
6. Appends all `[pairs].examples` entries to `pairs.jsonl` with
   `context.source = "import:<handle>"`.
7. Emits a summary: counts of imported prefs, avoids, pairs; counts of
   conflicts resolved-in-favor-of-local; inherited handles.

### `IMPORT_MULTIPLIER`

Hardcoded at `0.6` in v1.0. Rationale: an imported preference is evidence
that *someone thinks* this style is good, but without local validation it
can't be trusted to outrank what the user has actually used. Raising it
above 0.8 would let designer-packs override personal drift; lowering it
below 0.4 would make imports mostly ceremonial.

---

## Inheritance

### `inherits_from` resolution

Entries are resolved **left-to-right**. For each entry:

- If it's a bare handle (`dieter-rams`), look up in:
  1. The active project's `designers/` directory
  2. Visionary's bundled `designers/` directory
  3. The community index fetched by `visionary taste browse` (only if
     `--network` was passed to `import`, default off)
- If it's a URL (`https://…/foo.taste`), fetch with the same URL policy as
  top-level URL imports (size-limit 50 KB, domain allowlist).
- If it's a relative path (`./team-base.taste`), resolve against the
  importing file's directory.

### Cycle detection

The importer maintains a stack of handles it is currently resolving. On
encountering a handle already on the stack it throws with the full cycle
path (e.g. `a → b → c → a`).

### Override rules

After all parents are resolved, the child's signals are applied on top:

- `prefer_styles[*]` and `avoid_styles[*]` override by `id`. The last
  occurrence wins.
- Tag arrays are **unioned**, not replaced. A child can only *add* to
  `prefer_palette_tags`, not subtract. (Use `avoid_palette_tags` to
  negate.)
- `typography.preferred_families` is replaced if present in the child.
- `[constitution]` is appended with a header line.
- `[metadata]` and `[privacy]` are taken from the outermost child only.

---

## URL import policy

`visionary taste import <url>` follows this policy:

| Control | Value |
|---------|-------|
| Max response size | 50 KB (hard cap; request aborts past this) |
| Max response time | 10 seconds |
| Allowed schemes | `https` only |
| Default allowlist | `github.com`, `raw.githubusercontent.com`, `gist.github.com`, `gist.githubusercontent.com` |
| Override allowlist | `--allow <domain>` flag (single-use per invocation) |
| Redirects followed | ≤ 3, same-domain-only |
| User-Agent | `visionary-taste-import/1.0` |

Files fetched by URL are cached in `taste/.imports-cache/` keyed by SHA-256
of the URL. Subsequent imports in the same session are served from cache.

---

## Schema versioning

`schema_version` follows SemVer 2.0:

- **Major bumps** (`1.x → 2.x`) mean breaking changes — the on-disk layout
  of `.taste` or the semantics of an existing field changed. The importer
  refuses to load files with a higher major version.
- **Minor bumps** (`1.0 → 1.1`) add optional keys. Older importers drop
  unknown keys with a warning.
- **Patch bumps** (`1.0.0 → 1.0.1`) are documentation-only — no behavioral
  change.

Current version: `1.0.0`. See `docs/sprints/sprint-07-platform-play.md`
Task 20.1 for the authoring history.

---

## Example: minimal valid `.taste`

```toml
schema_version = "1.0.0"
handle         = "example-minimal"

[preferences]
prefer_styles = [{ id = "swiss-muller-brockmann", confidence = 0.7 }]
```

## Example: full-featured `.taste`

See `docs/sprints/artifacts/example-pawelk-2026-04.taste` for a realistic
end-to-end example.

---

## Non-goals

The following are explicitly out of scope for v1.0:

- **Scoped inheritance** — `inherits_from = [{ handle: "x", scope: "component_type:dashboard" }]`
  is not supported. All inheritance is global.
- **Embedding export** — `_embeddings.json` is never embedded. Importers
  regenerate as needed from the local model.
- **Time-windowed facts** — a `.taste` carries a snapshot, not a timeline.
- **Multi-user merge** — a `.taste` is one author's view. Team-level merges
  are intended to be expressed via `inherits_from` and manual reconciliation.

These may revisit in Sprint 8+ but v1.0 favors a simple, stable interchange
format.
