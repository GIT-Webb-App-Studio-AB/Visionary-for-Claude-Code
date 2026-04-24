# Benchmark Results

Published runs of the Visionary Aesthetic Benchmark
(`benchmark/prompts/prompts.json` × `benchmark/rubric/rubric.md`).

Each file is a reproducible JSON dump emitted by `benchmark/runner.mjs`.
Consumers can diff runs, chart regressions, or compare skills side by
side with `node benchmark/runner.mjs --compare A.json B.json`.

## Published runs

| File | Skill | Version | Mean total | Prompts | Notes |
|---|---|---|---|---|---|
| [`visionary-1.3.0.json`](./visionary-1.3.0.json) | visionary | 1.3.0 | **18.35 / 20** | 10/100 | Partial — one prompt per category. Motion Readiness weakest at 3.55 (fixed in 1.3.1). |
| [`baseline-slop.json`](./baseline-slop.json) | baseline-slop | n/a | 12.60 / 20 | 10/100 | Adversarial control. Deterministic adapter landed in 1.3.1. |

### Planned runs (1.3.1+)

| File (planned) | Target | Prompts | Owner |
|---|---|---|---|
| `visionary-1.3.1-full.json` | visionary 1.3.1 | 100/100 × 1 sample | maintainer |
| `frontend-design-full.json` | frontend-design (Anthropic) | 100/100 × 1 sample | maintainer |
| `ui-ux-pro-max-full.json` | ui-ux-pro-max | 100/100 × 1 sample | contributor PR welcome |
| `visionary-1.3.1-n3.json` | visionary 1.3.1, `--samples 3` | 100/100 × 3 samples | maintainer, budget-permitting |

## Headline comparison (v1.3.0)

```
Dimension            Visionary  Baseline-slop  Delta
  distinctiveness         5.00           3.50  +1.50
  coherence               4.90           5.00  -0.10
  accessibility           4.90           3.10  +1.80
  motion_readiness        3.55           1.00  +2.55
  ─────────────────────────────────────────────────
  Total                  18.35          12.60  +5.75
```

**Read:** Visionary beats a default-Tailwind + Inter + blue-gradient
baseline by +5.75 points on 10 representative prompts. The biggest
wins are **motion_readiness** (+2.55 — baseline has no motion tokens,
no reduced-motion gates, no pause controls) and **accessibility**
(+1.80 — baseline skips focus-visible, has 24 px touch targets, ignores
CSS logical properties).

### Why coherence is ~equal

The baseline-slop outputs are *ironically coherent*: they use the same
Tailwind classes everywhere, same gradient tones, same `shadow-md`, same
Inter. The coherence scorer rewards internal consistency — and
over-indexed generic output is consistent by accident. The
**distinctiveness** score (which penalizes the 21 deterministic slop
patterns) is where the delta actually shows up.

This is a known limitation; v1.4 will split coherence into
`token_discipline` (reuse of a declared token set) vs
`internal_consistency` (no drift across a single file), which will pull
the slop score down because it uses NO declared tokens.

## Reproducing

```bash
# Visionary run — uses the samples under benchmark/.staged/
node benchmark/runner.mjs --skill visionary --out results/visionary-1.3.0.json

# Baseline slop run — uses benchmark/.staged-baseline/
node benchmark/runner.mjs --skill baseline-slop \
  --staged-dir .staged-baseline \
  --out results/baseline-slop.json

# Compare any two runs
node benchmark/runner.mjs --compare \
  results/visionary-1.3.0.json \
  results/baseline-slop.json
```

## Important caveats

- **N=10, not 100**: these runs only score 10 of the 100 prompts in
  `benchmark/prompts/prompts.json`. The remaining 90 were scaffolded
  prompts with no staged sample — v1.3.0 shipped before the headless
  adapter existed. v1.3.1 ships the headless adapter
  (`benchmark/adapters/claude-headless.mjs`) that removes this gap; a
  full 100/100 run is the next results-file target.
- **Motion Readiness weakness was a scorer bug**: v1.3.0's scorer
  penalised *absence* of motion even on long-form reading surfaces, where
  stillness is the correct design. The v1.3.1 scorer is category-aware:
  appetite 0 categories (`editorial`) score 5/5 for no motion, and
  appetite ≥ 1 categories now require explicit spring tokens or CSS-first
  escapes to reach ≥ 4. Expect the v1.3.1 headline number to move on
  Motion Readiness *and* the overall mean.
- **Source-only scoring**: these runs use the offline scorers
  (regex + source heuristics). They do NOT run Playwright, do NOT run
  `axe-core` against a rendered screenshot. The full pipeline (planned
  for v1.4 CI) will add axe-core and APCA on rendered HTML, which will
  tighten the accessibility scores.
- **Category coverage**: 10 prompts covers all 10 categories (1 per).
  Cross-category variance is not measured yet — a v1.4 run with
  `--samples 3` per prompt would give per-prompt confidence intervals.
- **Baseline is adversarial, not representative**: the `baseline-slop`
  samples deliberately trigger the 21 slop patterns. Real output from
  default-shadcn would likely score 14-16, not 12. A more generous
  comparison against `frontend-design` (Anthropic) awaits that skill's
  adapter (contribution welcome).

## Contributing a skill adapter

To run this benchmark against your own Claude Code skill, write
`benchmark/adapters/{skill}.mjs` exporting:

```js
export async function run({ prompt, constraints }) {
  // invoke the skill, get the generated file(s)
  return { files: [{ path: "...", content: "..." }] };
}
```

Then:

```bash
node benchmark/runner.mjs --skill {your-skill} \
  --adapter benchmark/adapters/{your-skill}.mjs \
  --out results/{your-skill}.json
```

The scorers are skill-agnostic. Publishing a results JSON in this
directory via PR makes your skill's benchmark public and comparable.
