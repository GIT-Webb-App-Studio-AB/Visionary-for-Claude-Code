# Style Embeddings — maintenance guide

`skills/visionary/styles/_embeddings.json` is the 8-dimensional aesthetic
embedding table consumed by the orthogonal-variants selection in
`commands/variants.md`. This file documents how the table is produced,
when to regenerate it, and how to override values the heuristic gets wrong.

## The 8 axes

| # | axis                | low pole (0)           | high pole (1)               |
|---|---------------------|------------------------|-----------------------------|
| 1 | `density`           | spacious, airy         | data-dense, packed          |
| 2 | `chroma`            | muted, monochromatic   | saturated, neon             |
| 3 | `formality`         | playful, whimsical     | corporate, enterprise       |
| 4 | `motion_intensity`  | static, still          | kinetic, continuously moving|
| 5 | `historicism`       | ahistorical, current   | period-specific, vintage    |
| 6 | `texture`           | clean, flat            | material, tactile           |
| 7 | `contrast_energy`   | low-contrast, calm     | high-contrast, loud         |
| 8 | `type_drama`        | neutral typography     | expressive, display-face    |

Axis order is load-bearing — downstream consumers index the vector by
position, not by name. If you reorder the axes you break every call site
that reads `embeddings[id][0]`, so bump `meta.schema_version` in the output
and update `AXES` in `scripts/build-style-embeddings.mjs` + tests atomically.

## Interpreting a vector

Each vector is an array of 8 floats in `[0, 1]` with 3 decimals:

```json
"bauhaus": [0.500, 0.800, 0.500, 0.333, 0.900, 0.300, 0.650, 0.400]
```

Reading this: Bauhaus has moderate density, saturated-ish chroma, neutral
formality, subtle motion, strong historicism (obvious — it's a named
20th-century movement), low-medium texture, medium-high contrast energy,
neutral typography. Cross-reference against the body of the style file
to sanity-check.

## When to regenerate

Run `node scripts/build-style-embeddings.mjs` whenever any of these change:

- A new style is added under `skills/visionary/styles/**/*.md`
- A style's frontmatter changes (`motion_tier`, `density`, `palette_tags`,
  `keywords`, `accessibility.contrast_floor`, or `category`)
- A style's body gains or loses recognisable signal tokens (display-font
  name changes, elevation model changes, textural language added)
- `scripts/build-style-embeddings.mjs` itself changes (new scorer, new
  keyword list, new signal extraction)

The CI drift-guard runs `node scripts/build-style-embeddings.mjs --check`
and fails the build if the on-disk file diverges from a fresh rebuild.
Commit the regenerated file alongside any upstream change it reflects —
don't commit one without the other.

## Overrides — locking a known-good vector

The heuristic is deliberately simple (keyword matching plus frontmatter),
and simple loses information. When a style is obviously mis-placed, add an
entry to `scripts/style-embedding-overrides.json`:

```json
{
  "neobrutalism-softened": [0.55, 0.60, 0.15, 0.45, 0.40, 0.55, 0.85, 0.65],
  "bauhaus-dessau":        [0.55, 0.75, 0.25, 0.35, 0.92, 0.35, 0.80, 0.60]
}
```

Rules for override values:

1. Same 8-axis order as `AXES` in the builder.
2. All values in `[0, 1]`; clamp yourself or let the builder clamp.
3. Document *why* in a commit message — a human reviewer should be able to
   reconstruct your reasoning from the Git history. The override file itself
   stays JSON-only to keep machine consumers simple.
4. Prefer small adjustments over full overrides — only override when the
   heuristic is broken on a fundamental axis (e.g. a brutalist style being
   scored as high formality). If 6 of 8 values match, write an override
   anyway but mention the mismatched axes in the commit.

The builder applies overrides AFTER heuristic computation, so your vector
wins unconditionally when a style is in the override file. Removing an
override lets the heuristic take over again — useful when you fix the
heuristic and want the override to expire.

## LLM mode (Sprint 5 scope)

`scripts/build-style-embeddings.mjs --llm haiku` is reserved for the
Haiku-batch mode that Sprint 5 will wire up. Today the flag logs a warning
and falls back to the heuristic — the signature exists so the switchover
is a single diff instead of an API rework. When LLM mode lands, it will:

- Read `ANTHROPIC_API_KEY` from env.
- Invoke Haiku once per style with a prompt that asks "rate this style on
  each of the 8 axes 0..1 with a one-sentence rationale" and a structured
  output schema enforcing the format.
- Cache per-style responses in `skills/visionary/styles/_embedding_cache/`
  so subsequent builds skip re-invocation when the style body is unchanged.

Until Sprint 5 lands, treat the heuristic file as good-enough starting data
and close the loop via overrides.

## Debugging the selection

If an orthogonal-variants invocation returns a disappointing three-way,
the reproduction is:

```bash
node scripts/build-style-embeddings.mjs --verbose    # see first 5 breakdowns
node -e '
  const fs=require("fs");
  const { cosineDistance } = await import("./scripts/build-style-embeddings.mjs");
  const d = JSON.parse(fs.readFileSync("skills/visionary/styles/_embeddings.json","utf8"));
  const a = "<winner-id>";
  const b = "<variant-b-candidate-id>";
  console.log("cosine distance a↔b =", cosineDistance(d.embeddings[a], d.embeddings[b]));
'
```

If the distance is lower than expected (e.g. two styles that feel
extremely different to a human score as near-neighbours), start debugging
at the scorer functions in `scripts/build-style-embeddings.mjs`. Most
mis-placements trace to a scorer that collapses too many styles into the
0.5 default because its keyword list is too narrow.

## Sprint 4 acceptance snapshot

At commit-time of Sprint 4 the table held:

- **202 styles** × 8 dimensions = 1616 values
- File size **11.2 KB minified** (well under the 500 B/entry ceiling)
- Average pairwise cosine distance across the full pool: **~0.11**
- Spread: min 0.00 (duplicate-scoring styles), max ~0.49 (most-distant pair)

The low average reflects that most styles cluster in mid-space and only a
handful (neon-dystopia, cyberpunk-neon, hyper-comfort-hygge, chaos-packaging,
japanese-minimalism, dopamine-design) anchor the extremes. The algorithm's
job is to pick one from each well-separated region for the three-way
preview — not to maximise spread across the whole catalogue.
