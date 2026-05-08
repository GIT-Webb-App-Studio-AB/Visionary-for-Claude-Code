# Director Pack Schema (Sprint 20)

Extends `_schema.md` (Sprint 15) with cinematic-specific fields. All existing
designer-pack fields remain valid. New fields are additive; packs without them
continue to function as prompt-bias-only via the existing `/designer` flow.

---

## Frontmatter template

```yaml
---
id: <kebab-case>                       # machine handle — used by /designer + /visionary-cinematic
name: <Director Display Name>
category: filmmaker                    # NEW — distinguishes from print/ui packs
era: "1990s-2020s"                     # NEW — active period as filmmaker
films:                                 # NEW — canonical reference works (3-5)
  - "Film Title (year)"
cinema_palette:                        # NEW — color-grading anchors mapped to oklch
  primary:
    name: <semantic label>
    oklch: "oklch(<L> <C> <H>)"
    usage: <brief note>
  secondary:
    name: <semantic label>
    oklch: "oklch(<L> <C> <H>)"
    usage: <brief note>
  accent:
    name: <semantic label>
    oklch: "oklch(<L> <C> <H>)"
    usage: <brief note>
motion_signature: <css-keyframe-anchor-id>  # NEW — identifier for motion vocabulary
composition: <layout-bias descriptor>       # NEW — spatial grammar
philosophy: "One–two sentence distillation."
prompt_bias:
  - directive one
  - directive two
  - directive three
  - directive four
  - directive five
critic_persona:
  role: "design auditor in the spirit of <Name>"
  scoring_priorities:
    - { dim: <dimension>, weight: <float>, direction: "<qualifier>" }
  veto_conditions:
    - "<string>"
  argument_style: "<meta-instruction>"
arbitration:
  weight_in_table: 0.25
  can_veto: false
---
```

---

## New field reference

### `category`
String. `filmmaker` for cinematic packs. Existing packs without this field are
treated as `category: print` (backward-compatible default). Visionary uses this
to filter `/visionary-cinematic --list` vs `/designer --list`.

### `era`
String. Decade range describing the director's active filmography used as
source material. Helps context-weight prompt generation.

### `films`
List of 3–5 strings. Canonical taste-anchor works. Listed as
`"Title (year)"`. These are the specific films whose visual language was
researched to produce this pack — not a complete filmography.

### `cinema_palette`
Object with exactly three sub-keys: `primary`, `secondary`, `accent`.
Each sub-key has:

| Sub-field | Type | Description |
|-----------|------|-------------|
| `name` | string | Semantic label (e.g. `"warm-amber"`, `"neon-teal"`) |
| `oklch` | string | Web-ready oklch value, e.g. `"oklch(0.78 0.14 65)"` |
| `usage` | string | Where/how this color appears in the director's visual grammar |

oklch triplet encoding: `oklch(<Lightness 0–1> <Chroma 0–0.4> <Hue 0–360>)`.
Derived from canonical color-script references, not arbitrary stills.

### `motion_signature`
String. CSS keyframe anchor identifier. The identifier is a slug that maps to
a concrete keyframes block documented in each pack's Motion section. Examples:

| id | Description |
|----|-------------|
| `smudge-blur-trail-30deg` | Trailing blur dissolve with directional offset |
| `still-hold-slow-pan` | Minimal pan on an extended static composition |
| `symmetric-rigid-cut` | Hard cut with zero easing, frame-perfect |
| `freeze-flash-reversal` | Brief freeze then reverse-playback stutter |
| `dolly-zoom-tracking` | Simultaneous dolly + zoom in opposite directions |
| `slow-fade-drift` | Opacity fade with sub-pixel positional drift |
| `glitch-flash-uncanny` | Brief digital artifact flash + uncanny pause |
| `glacial-drip-pan` | Extremely slow horizontal pan, 8s+ duration |
| `montage-energy-cut` | Rapid-cut sequence with variable rhythm |
| `texture-touch-dissolve` | Close-up dissolve emphasising surface detail |
| `dread-still-hold` | Held static shot with slow vignette creep |
| `hand-held-drift` | Loose hand-held sway, organic and unhurried |

### `composition`
String. Spatial grammar descriptor. Drives UI layout bias:

| value | UI mapping |
|-------|-----------|
| `off-center, dutch-angle, claustrophobic` | Asymmetric hero, strong diagonals, tight gutters |
| `symmetric, vast-negative-space` | Center-locked hero, generous white-space margins |
| `dead-center, symmetric, ornate` | Perfect grid center, decorative border elements |
| `rotated, inverted-frame` | Occasional 90° or 180° layout moment |
| `one-point-perspective, symmetric` | Vanishing-point centered compositions |
| `off-balance, theatrical` | Intentionally uneven column weights |
| `deep-focus, landscape-orientation` | Wide-aspect ratio priority, layered depth |
| `tactile-close-up, body-centered` | Extreme crop hero, texture-first surface |
| `tight-architecture, interior` | Dense grid, bounded whitespace |
| `high-saturation-period-detail` | Rich texture overlays, period-referential ornament |
| `glass-walled-isolation` | Clean borders, strong containment, clinical margins |
| `spacious-aerial, room-sized` | Overhead spatial layouts, breathing room |

---

## Critique dimension reference (inherited from `_schema.md`)

The 11 critique dims this schema lists for `scoring_priorities`:

`hierarchy` · `density` · `motion_coherence` · `brand_fit` ·
`accessibility` · `typography` · `color_harmony` · `distinctiveness` ·
`whitespace` · `structural_integrity` · `emotional_resonance`

> **⚠ Schema-mismatch note (needs human review).** This 11-dim set does not
> match the runtime canonical 10-dim set in
> `skills/visionary/schemas/critique-output.schema.json` (`hierarchy`,
> `layout`, `typography`, `contrast`, `distinctiveness`, `brief_conformance`,
> `accessibility`, `motion_readiness`, `craft_measurable`,
> `content_resilience`). Only `hierarchy`, `typography`, `accessibility`, and
> `distinctiveness` overlap. The Sprint-15 print packs author against the
> runtime dim list; the Sprint-20 cinematic packs were authored against this
> doc's parallel list. Until reconciliation:
>
> - `hooks/scripts/lib/critics/designer-critic.mjs` silently skips any
>   `priority.dim` not in its `KNOWN_DIMS` array. Cinematic packs therefore
>   produce mostly empty score-rows in the deterministic baseline (the LLM
>   critic in `agents/designer-critic.md` is expected to do dim-mapping per
>   Hard Rule 5).
> - Resolution options: (a) add the cinematic dims to `KNOWN_DIMS` + the
>   critique output schema, (b) rename cinematic-pack dim references to the
>   runtime dims (e.g. `motion_coherence` → `motion_readiness`), or (c)
>   formalise a translation table in the critic loader. (a) and (b) are
>   breaking; (c) is additive.

---

## Backward compatibility

Existing packs (`dieter-rams`, `kowalski`, `vignelli`, `scher`, `greiman`) need
no changes. The new fields (`category`, `era`, `films`, `cinema_palette`,
`motion_signature`, `composition`) are optional extensions. Absence of
`category` defaults to `category: print`.

YAML validation: run `node scripts/validate-designer-packs.mjs --schema director`
to validate all cinematic packs against this extended schema.

---

## Example (abbreviated)

```yaml
---
id: wong-kar-wai
name: Wong Kar-wai
category: filmmaker
era: "1994-2046"
films:
  - "Chungking Express (1994)"
  - "In the Mood for Love (2000)"
  - "2046 (2004)"
cinema_palette:
  primary:
    name: warm-amber
    oklch: "oklch(0.78 0.14 65)"
    usage: dominant warm fill in memory sequences
  secondary:
    name: neon-teal
    oklch: "oklch(0.62 0.18 188)"
    usage: cool counter-accent in nocturnal scenes
  accent:
    name: blood-deep
    oklch: "oklch(0.35 0.18 22)"
    usage: passion / danger flash
motion_signature: smudge-blur-trail-30deg
composition: "off-center, dutch-angle, claustrophobic"
philosophy: "Memory as smear. Time as fold."
prompt_bias:
  - prefer warm-saturated fills against cool shadow backgrounds
  - allow off-center composition with one side breathing
  - motion as memory-trail, not functional transition
  - typography small and recessive inside the frame
  - neon as punctuation, not as theme
critic_persona:
  role: "design auditor in the spirit of Wong Kar-wai"
  scoring_priorities:
    - { dim: motion_coherence, weight: 1.5, direction: "prefer trailing smudge over snap" }
    - { dim: density, weight: 0.6, direction: "prefer claustrophobic intimacy" }
    - { dim: emotional_resonance, weight: 1.4, direction: "longing over clarity" }
  veto_conditions:
    - "snap-only motion without trail or after-image"
  argument_style: "evocative, reference-anchored, defends mood over function"
arbitration:
  weight_in_table: 0.25
  can_veto: false
---
```
