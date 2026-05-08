---
name: visionary-cinematic
description: >
  Apply a film-director taste profile to the style selection algorithm. Wrapper
  for `/designer <director-id>` that surfaces the 12 cinematic packs and adds
  an opt-in LUT-grade post-pass. Lets users tap film-vocabulary ("design it
  like a Wong Kar-wai film", "Villeneuve-cool, monolithic, high-contrast")
  without lifting new styles into the base catalogue. Invoked as
  /visionary-cinematic or /cinematic.
---

# /visionary-cinematic — Film-Director Calibration

A specialisation of [`/designer`](./designer.md) for film-makers. Every
director-pack is a designer-pack with three extra fields — `cinema_palette`,
`motion_signature`, `composition` — plus an optional LUT (color-grading
anchor) that maps to a CSS `filter` string applied as a final cosmetic pass.

This is the only UI tool that speaks fluent cinema. Wong Kar-wai's
smudge-blur-trail. Villeneuve's cool monolithic contrast. Wes Anderson's
symmetric pastel storybook. The packs deliver the full vocabulary —
palette, motion, composition — without inventing new base-styles.

## When to invoke

- Brief references a filmmaker ("make it feel like Blade Runner 2049", "more
  Wes Anderson", "Memphis-Scorsese collision", "claustrophobic Wong Kar-wai
  intimacy")
- Designer wants film-grade color and motion vocabulary as a project-wide
  constraint
- Moodboard reads more "production still" than "screenshot"

## Available director-packs

12 packs ship with Visionary. Gender-balanced, era-spread, ethically
contextualised (see Sprint 20 docs):

| Pack | Era | Short signature |
|---|---|---|
| `wong-kar-wai` | 1990s–2020s | smudge-motion, warm-saturated, off-center intimacy |
| `villeneuve` | 2010s–2020s | cool desaturation, high contrast, monolithic geometry |
| `wes-anderson` | 1990s–2020s | pastel symmetry, central composition, storybook warmth |
| `nolan` | 2000s–2020s | desaturated steel-blue, time-folded composition, IMAX scale |
| `kubrick` | 1960s–1990s | one-point perspective, color-block primaries, formal rigour |
| `lynch` | 1980s–2010s | sodium-vapour orange, dread-inducing slowness, dream-logic layout |
| `tarkovsky` | 1960s–1980s | sepia-into-color long takes, water-and-light, contemplative pacing |
| `denis` | 1980s–2020s | tropical-noir saturation, sweat-and-skin tactile, fragmented framing |
| `bong` | 2000s–2020s | tonal whiplash, vertical class-stratified composition, rain-soaked palette |
| `parker` | 1970s–2000s | high-key musical theatre, theatrical staging, performative motion |
| `garland` | 2010s–2020s | clinical white + saturated alarm, machine-precision symmetry |
| `coppola` | 2000s–2020s | hazy pastel intimacy, soft-focus melancholia, languid pacing |

(See `designers/README.md` for the full catalogue including the print/UI
designers from Sprint 15.)

## Usage

```
/visionary-cinematic <director-id> [brief]
```

### Examples

```
/visionary-cinematic wong-kar-wai
/visionary-cinematic villeneuve "landing for an enterprise data platform"
/visionary-cinematic wes-anderson "pricing page for a stationery shop"
/visionary-cinematic --cinematic-grade nolan "hero for a security audit firm"
/visionary-cinematic --list
```

The optional brief is appended to whatever Stage 1 derives from the pack —
useful when the director carries the *aesthetic* but you still need to
specify the *product*.

## Behavior

`/visionary-cinematic <id>` is functionally equivalent to
`/designer <id>` for the 12 cinematic packs. Stage 1 (Context Inference)
applies the pack's biases the same way it does for print/UI designer-packs:

1. **Style-weight multipliers** scale the candidate pool toward film-aligned
   web-styles (e.g. `wong-kar-wai` lifts `noir-wong`, `neon-symbolic`,
   `intimate-saturated`).
2. **`cinema_palette` → `palette_override`** (HARD signal). The pack's
   anchor swatches are compiled to oklch and become the palette pool.
3. **`motion_signature` → motion-tier + keyframe-anchor**. `smudge-blur-trail`
   sets tier 2 (Expressive) with a custom CSS `transition` profile.
4. **`composition` → layout-bias** (SOFT). `off-center, dutch-angle,
   claustrophobic` boosts asymmetric grid templates in Stage 5.
5. **Critic-persona injection**. The pack's `critic_persona` joins the
   arbitration table with the weight defined in `arbitration.weight_in_table`
   (typically 0.20–0.30).

## The `--cinematic-grade` flag (default OFF)

Opt-in LUT-overlay. When set, the final rendered DOM receives a
`body { filter: ... }` rule mapped from the pack's LUT-anchor:

```
/visionary-cinematic --cinematic-grade wong-kar-wai
  → body { filter: hue-rotate(8deg) saturate(1.15) contrast(1.05) sepia(0.05) brightness(0.95); }
```

The LUT is **kosmetik, inte struktur** — palette, motion and composition
already carry the director's signature without it. Grade is the extra
finishing-pass for screens where "production still" is the goal.

### Why default OFF

- LUTs reduce APCA contrast on text. Sprint 20 Task 37.4 specifies an
  auto-disable when `Lc < 60` post-grade. Better to render correctly first
  and let the user opt in.
- Low-DPI screens render saturated hue-rotation as banding.
- Some packs (Wes Anderson, Tarkovsky) use very subtle grading — turning the
  LUT on can swamp the rest of the design's signal.

### When to opt in

- Hero sections / above-the-fold marketing surfaces (text contrast typically
  tested against a single bg)
- Splash screens, loading states, intro animations
- Screenshots / press-kit assets

### Env-var alternative

```
VISIONARY_CINEMATIC_GRADE=1 /visionary-cinematic villeneuve
```

…produces the same effect as `--cinematic-grade`, useful for shells that
mangle flag-parsing.

### APCA-guard

After applying the filter, Visionary recomputes the worst-case
foreground-vs-background APCA `Lc` for the rendered DOM. If `Lc < 60` on the
primary text-on-bg pair, the grade is auto-disabled and the receipt warns:

```
⚠ Cinematic grade auto-disabled: villeneuve LUT dropped primary text Lc to 52.
  Render shows pack-aware palette + motion + composition without color filter.
```

## Cross-links

- [`/designer`](./designer.md) — generic designer-pack command. `cinematic`
  is a subset; `/designer wong-kar-wai` works identically.
- [`/visionary-mood`](./visionary-mood.md) — mood-via-text. Composes with
  cinematic packs (mood-phrase becomes SOFT, pack stays HARD).
- [`/visionary-from-photo`](./visionary-from-photo.md) — photo-derived
  palette + mood. If a director-pack is also active, photo signals merge
  with pack signals; pack always wins on conflict (HARD vs HARD).
- [`/variants`](./variants.md) — three-way preview. Variants respect the
  active pack and surface three distinct interpretations within it.

## Reference implementation

- Director packs: [`designers/<director-id>.md`](../designers/) (Sprint 20
  Task 37.2)
- Director schema: [`designers/_director-schema.md`](../designers/_director-schema.md) (Sprint 20 Task 37.1)
- LUT presets: [`hooks/scripts/lib/cinematic/lut-presets.json`](../hooks/scripts/lib/cinematic/lut-presets.json) (Sprint 20 Task 37.4)
- LUT mapper: [`hooks/scripts/lib/cinematic/lut-to-filter.mjs`](../hooks/scripts/lib/cinematic/lut-to-filter.mjs)
- Tests: `hooks/scripts/lib/cinematic/__tests__/`

## Rules

- Cinematic packs are OPT-IN. They never auto-activate from "make this look
  cinematic" prompts — the user must name a director.
- The pack biases the pool; it does not dictate output. The algorithm still
  runs weighted-random selection within the biased pool.
- LUT-grade is OPT-IN within OPT-IN. Two intentional steps to a graded UI.
- Director-pack-as-stereotype is the failure mode we actively guard against.
  Each pack ships with an ethical-context block; contributors add packs
  with research-based palette/composition values, not "vibes from one
  YouTube essay".
