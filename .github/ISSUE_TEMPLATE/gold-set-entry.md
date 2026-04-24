---
name: Gold-set rating (critic calibration)
about: Request three raters to score a new gold-set entry so calibrate.mjs can refit
title: "gold-set: score gs-NNN (<brief summary>)"
labels: calibration, gold-set
---

## Entry

- **id**: gs-NNN
- **screenshot**: benchmark/gold-set/gs-NNN.png
- **brief**: <copy from meta.json>
- **style_id**: <copy from meta.json>
- **viewport**: <copy from meta.json>

## Rating instructions

Score the screenshot on every dimension on a **0–10 scale**. 0 = critical
failure, 10 = exemplary. Decimals allowed.

**Do not read other raters' scores before posting yours.** We're measuring
independent judgement, not group consensus — divergence between raters is
useful signal.

### Dimension reference (full rubric in `agents/visual-critic.md`)

| Dimension          | What to judge                                                               |
|--------------------|-----------------------------------------------------------------------------|
| hierarchy          | Primary element dominates; clear weight gradient                            |
| layout             | Grid holds, alignment clean, no overflow                                    |
| typography         | Typeface pairing distinctive; scale creates clear steps                     |
| contrast           | WCAG 2.2 AA + APCA; no illegible text                                       |
| distinctiveness    | Avoids generic AI aesthetics; style has a point of view                     |
| brief_conformance  | Screenshot matches the brief                                                |
| accessibility      | Focus rings, touch targets, reduced-motion; axe violations considered       |
| motion_readiness   | Entry variants, tokens, purposeful motion, reduced-motion fallback          |
| craft_measurable   | Composite craft (typography rhythm, contrast entropy, gestalt grouping, colour harmony, negative space) — judge by look, not by metric |

## Score template — copy, fill, post as a comment

```yaml
hierarchy:         __
layout:            __
typography:        __
contrast:          __
distinctiveness:   __
brief_conformance: __
accessibility:     __
motion_readiness:  __
craft_measurable:  __
```

## After three raters have scored

The maintainer computes:
- `consensus` per dimension = median of the three scores
- `dimension_spread` per dimension = max - min
- `consensus_confidence` = "tight" if every spread ≤ 2, else "divergent"

…and commits the completed `gs-NNN.meta.json`. Then `scripts/calibrate.mjs`
re-runs and (if ≥ 10 entries are populated) switches from identity mode to
fitted mode.
