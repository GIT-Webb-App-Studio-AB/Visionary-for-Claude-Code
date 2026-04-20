---
name: visionary-designer
description: >
  Apply a named-designer taste profile to the style selection algorithm.
  Biases the candidate pool toward the designer's known vocabulary without
  hard-coding output. Invoked as /designer <name> or /visionary-designer.
---

# /designer — Named-Designer Calibration

Apply a specific designer's taste profile to the weighted-random style
selection. This is a layer on top of the 8-step algorithm — the designer
pack doesn't REPLACE the algorithm, it BIASES the scoring step (4.5) so
the candidate pool skews toward styles the designer would recognize.

## When to invoke

- User says "make it look like Dieter Rams" / "in Paula Scher's style" /
  "like Kowalski's motion"
- Brand brief specifies a designer influence
- User wants modernist restraint (Vignelli, Rams) or typographic play
  (Scher, Greiman) as a project-wide constraint

## Available packs

| Pack | Short description |
|---|---|
| `dieter-rams` | 1960s-80s Braun. Functional restraint. Invisible UI. |
| `emil-kowalski` | 2022+ motion-UI. Linear-era springs, CSS-first. |
| `massimo-vignelli` | 1960s+ modernist. Six typefaces, two colors, grid absolute. |
| `paula-scher` | 70s+ typographic maximalism. Big type, broken grids. |
| `april-greiman` | 80s+ computer-native. Layered imagery, New Wave Swiss. |

See `designers/README.md` for schema and the full catalogue.

## Usage

```
/designer <name>
```

### Examples

```
/designer dieter-rams
/designer emil-kowalski --persist
/designer "70% rams, 30% vignelli"
/designer --list
/designer --unset
```

## Behavior

### Step 1 — Resolve the pack

- `/designer dieter-rams` → read `designers/dieter-rams.json`
- `/designer "70% rams, 30% vignelli"` → weighted merge of two packs
  (weight-multiplied by the percentages)
- `/designer --list` → print the catalogue with short descriptions, exit
- `/designer --unset` → remove `design-system/designer.json` if present, exit

### Step 2 — Apply biases to the algorithm

Inside Stage 1 (Context Inference), after the initial style-weight scoring,
walk the pack's `biases`:

1. **`style_weight_multipliers`**: multiply each style's weight by the
   factor. `dieter-rams: 5.0` means Dieter Rams style is 5× more likely
   to be picked than a neutral scoring would give.
2. **`style_blocklist`**: set weight to 0 for every style listed. This
   is HARD exclusion — the designer explicitly rejected these aesthetic
   directions.
3. **`palette_tags_preferred` / `palette_tags_forbidden`**: multiply or
   zero weights based on style frontmatter `palette_tags`.
4. **`motion_tier_cap`**: zero out any style whose `motion_tier` exceeds
   the cap (Rams caps at Subtle; Kowalski caps at Kinetic).
5. **`typography_allowed` / `typography_forbidden`**: filter the typography
   matrix for the generation stage.
6. **`rules`**: inject into the Stage 2 Design Reasoning Brief as
   constraints the generation must respect.

### Step 3 — Persist (optional)

If `--persist` was passed, write `design-system/designer.json` in the
project root. Subsequent Visionary invocations in this project read that
file automatically and apply the pack without the user re-typing.

```json
// design-system/designer.json
{
  "pack": "dieter-rams",
  "persisted_at": "2026-04-20",
  "source": "designers/dieter-rams.json"
}
```

### Step 4 — Show the user what changed

After applying the pack, emit a short summary:

```
Applied designer pack: Dieter Rams
  Candidate pool: 201 styles → 37 styles after bias+blocklist
  Top-ranked: dieter-rams (5.0×), swiss-rationalism (3.0×), white-futurism (2.5×)
  Blocked: neon-dystopia, cyberpunk-neon, synthwave, +8 more
  Motion tier capped at: Subtle
  Rules injected into brief: 9
```

## Integration with other commands

- `/variants` — runs with the designer pack applied; all 3 variants respect
  the bias/blocklist (they differ within the pack's candidate pool).
- `/apply` — locks the designer pack AND the chosen style across the app.
  The tokens exported to `design-system/tokens.json` include the designer
  attribution so future generations can re-derive the pack.

## Blending packs

`/designer "60% kowalski, 40% greiman"` blends two packs:

1. Load both packs
2. For each `style_weight_multipliers` entry, compute the weighted mean:
   `final = 0.6 × kowalski[style] + 0.4 × greiman[style]` (default 1.0 if absent)
3. For blocklist: a style is blocked only if BOTH packs block it (AND, not OR)
4. For `motion_tier_cap`: take the less restrictive of the two
5. Merge `rules` — prefix each with `(Kowalski): …` or `(Greiman): …` so
   Claude knows which constraint comes from which pack

Blending is experimental. Warn the user if the two packs contradict each
other (e.g. Rams + Scher would produce nonsense — one blocks what the other
promotes).

## Rules

- Designer packs are OPT-IN and DISCOVERABLE — never applied automatically.
- Persistence is LOCAL to the project (via `design-system/designer.json`),
  never globally to a user's Claude install.
- The pack biases the pool; it does not dictate the output. The algorithm
  still runs weighted-random selection within the biased pool.
- Living designers' packs require demonstrable published taste profile +
  the designer's consent. Historic / well-documented designers are the
  default contributions.
- Packs are data, not code. Contributing a new pack requires no
  implementation changes — drop a JSON in `designers/` and add a row to
  the table in `designers/README.md`.
