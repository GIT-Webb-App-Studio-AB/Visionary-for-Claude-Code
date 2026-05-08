# Constraints — Sprint 21 catalogue

The constraint catalogue is a set of atomic design rules. Each constraint is
a *hard negation* or *hard tvång* — a post-generation-validatable invariant
that re-shapes the generation rymden. Constraints are NOT styles or
preferences. A constraint is testable on the rendered DOM/CSS and a single
fail flips the whole generation.

The catalogue currently holds 40 constraints across 5 categories (form,
color, typography, layout, motion — 8 each). New constraints are added by
PR (see "How to add a new constraint" below).

---

## Schema (per constraint file)

Each `skills/visionary/constraints/<id>.md` file MUST start with YAML
frontmatter conforming to:

```yaml
---
id: kebab-case-slug                  # required — must match filename stem
category: form|color|typography|layout|motion   # required
css_rules:                           # required — at least 1
  - "human-readable rule statement"
  - "alternative implementation"
invariants:                          # required — at least 1
  - "what is true on the rendered DOM if this constraint is satisfied"
conflict_set: ["other-id-1", "other-id-2"]   # optional, default []
rationale: "50+ word justification"   # required
examples: ["site or designer", "another reference"]   # required, 1-3 items
---

[Free-text manifest with examples and code snippets]
```

### Field semantics

| Field | Required | Notes |
|---|---|---|
| `id` | yes | kebab-case, matches filename stem |
| `category` | yes | must be one of the 5 |
| `css_rules` | yes | human-readable statements describing **how** to implement |
| `invariants` | yes | machine-checkable conditions describing **what** must be true post-render |
| `conflict_set` | no | array of constraint IDs that mutually exclude this one |
| `rationale` | yes | 50+ words, explains WHY this constraint produces interesting output |
| `examples` | yes | 1-3 references (designers, sites, eras) — anchor the constraint in real work |

The frontmatter is parsed by `hooks/scripts/lib/constraints/inject.mjs::loadCatalog`.
Validators live in `hooks/scripts/lib/constraints/validate.mjs`.

---

## Index — all 40 constraints

### form (8)

| id | one-liner |
|---|---|
| `no-rectangles` | All visible elements have border-radius ≥ 12px or clip-path |
| `single-shape` | Only one shape (circle OR square OR hexagon) |
| `fractured-edges` | Asymmetric border-radius — distinct corner values |
| `viewport-bleeds` | At least 2 sections extend beyond viewport |
| `text-as-shape` | Headline used as decorative shape (huge or rotated) |
| `negative-margin-mandatory` | At least 1 element with negative margin ≤ -16px |
| `clipping-overflow` | At least 1 image visibly escapes its parent |
| `organic-blob` | Hero element with 8-distinct-radius organic silhouette |

### color (8)

| id | one-liner |
|---|---|
| `single-color` | One hue + neutrals only |
| `monochrome-only` | Pure grayscale, zero chroma |
| `no-gradients` | Zero linear/radial/conic gradients |
| `max-3-colors` | At most 3 distinct hues |
| `complementary-only` | 2 hues, 180° apart on the wheel |
| `cmyk-only` | Cyan + magenta + yellow + key (printer plates) |
| `risograph-bleed` | mix-blend-mode overprint between 2 shapes |
| `signal-on-noise` | Desaturated chrome + 1 saturated accent |

### typography (8)

| id | one-liner |
|---|---|
| `single-typeface` | Exactly one font-family |
| `monospace-headlines` | All h1-h3 monospaced |
| `all-italic` | Every text element italic |
| `vertical-only` | At least 1 textblock writing-mode: vertical |
| `broken-baselines` | Multiple texts on different baselines |
| `huge-or-tiny` | Two font-sizes only — one ≥96px, one ≤12px |
| `display-as-sentence` | Body text in a display face |
| `caps-only` | All headings UPPERCASE with letter-spacing ≥ 0.04em |

### layout (8)

| id | one-liner |
|---|---|
| `asymmetry-only` | Zero centered content, off-center sections |
| `broken-grid` | At least 1 element rotated ≥30° or offset ≥40% |
| `every-section-breaks-grid` | No shared grid — each section bespoke |
| `no-center` | Zero text-align: center, zero margin: 0 auto |
| `full-bleed-mandatory` | ≥50% of sections are 100vw |
| `single-column-strict` | Strict 1-column, no flex-row |
| `nested-extreme` | DOM depth ≥ 6 levels |
| `whitespace-explosion` | At least 1 section ≥40vh empty space |

### motion (8)

| id | one-liner |
|---|---|
| `no-transitions` | Zero CSS transitions/animations |
| `infinite-loop-mandatory` | At least 1 element animation-iteration-count: infinite |
| `scroll-driven-only` | All animations via scroll-timeline |
| `paused-by-default` | Animations start paused, play on hover |
| `gesture-only` | Motion only on user gesture |
| `staggered-cascade` | ≥3 elements with ≥100ms stagger |
| `reverse-mount` | Element invisible on mount, appears after delay |
| `no-easing` | All transitions linear, no cubic-bezier |

---

## Conflict graph

Conflicts are declared per-constraint via the `conflict_set` field. The
sampler (`inject.mjs::sampleConstraints`) treats conflict relations as a
symmetric exclusion: if A lists B, B is also forbidden when A is selected,
even if B does not explicitly list A. Backtracking sampling keeps trying
combinations until k non-conflicting constraints are found, or returns
fewer than requested if the catalogue is exhausted.

### Constraints with the densest conflicts

These are the constraints that exclude many others — they tend to define
strong style positions:

- `no-transitions` — conflicts with all motion-positive (infinite-loop, scroll-driven, paused-by-default, gesture-only, staggered-cascade, reverse-mount, no-easing)
- `monochrome-only` — conflicts with all color-positive (single-color, max-3-colors, complementary-only, cmyk-only, neon-on-black, signal-on-noise)
- `single-color` — conflicts with multi-color (max-3-colors, complementary-only, cmyk-only, no-gradients)
- `pixel-perfect-grid` *(name reserved for an existing-style anchor)* — conflicts with no-rectangles, fractured-edges, viewport-bleeds, broken-grid, every-section-breaks-grid, single-column-strict, broken-baselines, organic-blob, whitespace-explosion, asymmetry-only

### Conflict matrix sampling

For k=3 sampling, the sampler:
1. Picks a random constraint A.
2. Removes A's conflict set from the candidate pool.
3. Picks B from the remaining pool.
4. Removes B's conflict set.
5. Picks C.

If at step 3 or 5 the pool is empty, the sampler returns whatever was
already picked (k can be < requested).

---

## How to add a new constraint (community-PR flow)

1. **Pick a category.** New constraints must fit in form / color /
   typography / layout / motion. If a constraint cuts across categories,
   pick the dominant one.
2. **Write the YAML frontmatter** following the schema above. The `id`
   becomes the filename stem.
3. **Define the `invariants` rigorously** — they are the contract. A weak
   invariant ("looks balanced") fails post-validation. A strong invariant
   ("max-rotation-magnitude ≥ 30deg on at least one transformed element")
   is testable.
4. **Declare the `conflict_set`.** Walk the existing catalogue; any
   constraint that contradicts your new one (e.g. yours says "must use
   gradient", another says "no gradients") MUST be in your conflict_set.
   At minimum, declare 1-3 conflicts.
5. **Write a 50+ word `rationale`.** Cite designers, brands, eras. Explain
   why this is interesting, not just allowable.
6. **Add a validator function** in
   `hooks/scripts/lib/constraints/validate.mjs` — sprint 21 v1 ships
   stub validators for unimplemented constraints (returns `{passed: true,
   evidence: 'validator not implemented in v1'}`); v2 implements all 40.
7. **Submit a PR.** The CI runs `node --test` against
   `hooks/scripts/lib/constraints/__tests__/` to ensure the YAML parses
   and the constraint fits the catalogue invariants.

---

## Storage path

The catalogue lives in `skills/visionary/constraints/`. Constraint files
are project-shared (committed to repo), unlike coined-styles which are
user-private under `${CLAUDE_PLUGIN_DATA}`.

The catalogue is loaded once per generation by
`inject.mjs::loadCatalog`. Re-loading is forced when the catalogue
directory mtime changes (cache invalidation per file mtime).
