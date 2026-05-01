# Motion Scoring 2.0

Sprint 9 introduces a 6-sub-dimension motion scorer that replaces the legacy single-shot heuristic. Goal: lift the weakest critique dimension (Motion Readiness, 3.55/5 in the partial benchmark) by giving the critic mechanically-cited sub-scores instead of a vague aggregate.

## Sub-dimensions and weights

| Sub-dim | Weight | What it measures |
|---|---|---|
| `easing_provenance` | 0.20 | Default `ease`/`ease-in-out` → 0.2. Spring tokens or `linear()` ≥5 stops → 1.0. |
| `aars_pattern` | 0.20 | Anticipation → Action → Reaction → Settle (4-phase keyframes). |
| `timing_consistency` | 0.15 | σ over durations: <80ms = 1.0; ≥400ms = 0.2. |
| `narrative_arc` | 0.15 | Stagger / `transition-delay` layering of elements. |
| `reduced_motion` | 0.15 | Presence of `@media (prefers-reduced-motion: reduce)` guards. |
| `cinema_easing` | 0.15 | `linear()` stops, overshoot, ease-out-heavy on long animations. |

Each sub-detector lives at `hooks/scripts/lib/motion/<name>.mjs` with paired tests in `__tests__/`. All zero-dep, ESM, Node 18+.

## Motion Maturity Model

| Tier | Name | Criteria |
|---|---|---|
| 0 | None | No motion patterns detected in source. |
| 1 | Subtle | Total score < 0.4. |
| 2 | Expressive | 0.4 ≤ total < 0.65. |
| 3 | Kinetic | 0.65 ≤ total < 0.85, requires `aars_pattern ≥ 0.6` AND `cinema_easing ≥ 0.5`. |
| 4 | Cinematic | total ≥ 0.85, requires every sub-score ≥ 0.6. |

## Usage

```js
import { scoreMotion2 } from './hooks/scripts/lib/motion/scorer-2.mjs';

const result = scoreMotion2(sourceCode);
// {
//   total_score: 0.715,
//   motion_readiness_10: 7.15,
//   tier: 3,
//   tier_name: 'Kinetic',
//   subscores: { easing_provenance: 1.0, aars_pattern: 0.8, ... },
//   evidence: [ { dim: 'easing_provenance', selector: '...', value: '...' }, ... ],
//   detector_meta: { aars_phases_detected: 4, timing_sigma_ms: 16, ... }
// }
```

## Integration

- **Critique loop:** `hooks/scripts/lib/motion/inject.mjs` adds a context block to `capture-and-critique.mjs`'s `additionalContext`, so the critic can cite the exact sub-dim when scoring `motion_readiness < 7`.
- **Benchmark runner:** `benchmark/scorers/motion-scorer-v2.mjs` wraps `scoreMotion2` in the legacy 0..5 contract used by `benchmark/runner.mjs`.

## Calibration

Run when a motion gold-set is available:

```bash
node scripts/calibrate-motion-2.mjs           # fit + save
node scripts/calibrate-motion-2.mjs --report  # R² per sub-dim
node scripts/calibrate-motion-2.mjs --dry-run # fit without saving
```

Gold-set entries are `*.motion.json` files at `benchmark/gold-set/` shaped as:

```json
[
  { "source": "...", "human_subscores": { "easing_provenance": 0.8, "aars_pattern": 0.6, ... } }
]
```

The fit is saved to `skills/visionary/calibration/motion-2.json`. With <2 entries the script writes an identity-fallback so `applyCalibration` is a no-op.

## Toggles

| Env | Default | Effect |
|---|---|---|
| `VISIONARY_MOTION_SCORER_V2` | on | Set to `0` for v1-only (fallback). |
| `VISIONARY_MOTION_VERBOSE` | off | `1` prints per-dim subscores to stderr during benchmark runs. |
