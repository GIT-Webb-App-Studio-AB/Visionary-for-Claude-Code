# Sprint 08 — distinctiveness-gate benchmark

**Sprint:** `docs/sprints/sprint-08-distinctiveness-gate.md`
**Branch:** `feat/sprint-08-distinctiveness-gate`
**Status:** SKELETON — awaiting real-run data (numbers fill in after benchmark suite runs against the post-merge codebase)

This document is the measurement ledger for Sprint 08's two interventions:

1. **Hard slop-reject gate** (Item 22) — preventive: blocks generations with ≥ 2 slop-patterns before critic runs
2. **Negative visual anchors** (Item 23) — anticipatory: tells the generator which patterns to avoid BEFORE it generates

Both interventions aim at one metric: **distinctiveness (calibrated, 0–10)**. Secondary: reject-gate trigger rate (expected to drop over time as anti-anchors reduce upstream slop).

---

## Methodology

Run the 10-prompt benchmark suite (`benchmark/tests/`) twice:

- **Baseline**: checkout commit `main` before Sprint 08 merge (or `HEAD~N` with N = Sprint 08 commits). Env: all Sprint 08 flags at default-OFF equivalent (gate threshold 99, no anti-anchors — easy: temporarily move `docs/slop-anchors/` aside).
- **Post-sprint**: Sprint 08 active. Default thresholds.

Same prompt suite, same gold-set, same calibration. Three passes per condition to estimate variance; report median.

## Metrics to collect

| Metric | Baseline | Post-sprint | Delta | Pass/fail |
|---|---:|---:|---:|:---:|
| Distinctiveness median (calibrated, 0–10) | — | — | — | — |
| Distinctiveness mean (calibrated, 0–10)   | — | — | — | — |
| Distinctiveness std-dev                   | — | — | — | — |
| Reject-gate trigger rate (% of generations) | N/A | — | — | — |
| Whitelist-hit rate (% of generations)     | N/A | — | — | — |
| Time-per-generation (median ms)           | — | — | — | — |
| Token cost per generation (input + output)| — | — | — | — |
| Overall benchmark score (20-skala)        | — | — | — | — |

**DoD targets:**
- Distinctiveness median lift ≥ **0.8** (as defined in the sprint doc)
- Reject-gate trigger rate **< 10 %** post-sprint (anti-anchors working)
- No regression on any other calibrated dimension ≥ 0.3
- Token cost increase ≤ **15 %** (anti-anchor payload budget)
- Time-per-generation increase ≤ **20 %** (regen cycles + anti-anchor injection)

---

## Per-prompt breakdown (to fill in)

Same 10 prompts as Sprint 06/07 benchmarks — keep the suite stable so cross-sprint comparisons stay honest.

| # | Prompt | Baseline distinctiveness | Post-sprint distinctiveness | Δ | Gate triggers |
|---|---|---:|---:|---:|---:|
|  1 | pricing page for B2B SaaS with three tiers | — | — | — | — |
|  2 | admin dashboard for server monitoring      | — | — | — | — |
|  3 | hero section for a consumer mobile app     | — | — | — | — |
|  4 | editorial article layout, long-form        | — | — | — | — |
|  5 | settings panel with nested sections        | — | — | — | — |
|  6 | 404 error page with retro pixel art        | — | — | — | — |
|  7 | pricing comparison table, enterprise       | — | — | — | — |
|  8 | onboarding wizard, 4 steps                 | — | — | — | — |
|  9 | blog archive with filtering sidebar        | — | — | — | — |
| 10 | portfolio landing for design agency        | — | — | — | — |

---

## Qualitative notes (to fill in)

- Did the gate fire on legitimate stylistic choices? (False positives worth addressing via whitelist or threshold tuning)
- Did anti-anchors visibly shift composition? (Eye-test vs quantified scores)
- Any style that scored worse post-sprint? (Could indicate over-blocking — needs investigation)
- Cold-start experience — what did the first 3 generations look like?

---

## Expected failure modes + mitigations

| Mode | Detected by | Mitigation |
|---|---|---|
| Gate triggers too often → infinite regen loop | Reject-rate > 50 %, or same gen_id re-blocked 3× | Bump `VISIONARY_SLOP_REJECT_THRESHOLD` temporarily; file issue for pattern refinement |
| Anti-anchor images bloat prompt budget | Token cost delta > 20 % | Use `includeImagePaths: false` in the block builder; references become text-only |
| Post-Sprint distinctiveness lift < 0.6 | Benchmark median | Add more anti-anchor categories, review style rubric for missed pattern cues |
| Whitelist misconfigured → wrong style over-rejected | Spike in reject-rate on one style id | Add style to `allows_slop` with narrower pattern list |

---

## How to re-run this benchmark

```bash
# Baseline
git checkout <sprint-07-head>
node benchmark/runner.mjs --suite 10-prompt --out results/baseline-pre-sprint-08.json

# Post-sprint
git checkout feat/sprint-08-distinctiveness-gate
node benchmark/runner.mjs --suite 10-prompt --out results/post-sprint-08.json

# Diff
node scripts/compare-results.mjs results/baseline-pre-sprint-08.json results/post-sprint-08.json
```

(The `compare-results.mjs` script doesn't exist yet — write it if the diff becomes manual enough to be painful.)

---

## Amendments

_This file is the living record. Update with every re-run; keep the skeleton sections even after numbers fill in so future sprints can fork the template._
