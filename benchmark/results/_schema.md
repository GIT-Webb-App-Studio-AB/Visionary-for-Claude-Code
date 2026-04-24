# `benchmark/results/` schema reference

Canonical layout for per-run metrics emitted by `benchmark/runner.mjs`.
Fields are filled opportunistically — a runner on a CLI-only adapter can only
populate a subset. Downstream diff tools treat missing fields as `null`, not 0.

---

## `summary.json`

Top-level aggregate written at the end of a runner invocation.

```json
{
  "skill":             "visionary",
  "version":           "1.3.0",
  "timestamp":         "2026-04-22T10:00:00.000Z",
  "prompts_run":       10,
  "prompts_skipped":   0,
  "samples_per_prompt":1,
  "mean_total":        18.45,
  "mean_by_dimension": {
    "distinctiveness":   4.6,
    "coherence":         4.8,
    "accessibility":     4.5,
    "motion_readiness":  4.5
  },
  "mean_by_category":  { "dashboard": 18.6, "landing": 18.3 },
  "per_prompt":        [ /* see below */ ]
}
```

### Token / cost block (Sprint 01, deferred pending SDK adapter)

When the adapter exposes `usage.*` from the Anthropic SDK, each prompt also
gets a `tokens` + `cost_usd` block:

```json
{
  "tokens": {
    "input_total":    12843,
    "output_total":   2156,
    "cache_creation": 5120,
    "cache_read":     7723,
    "cache_hit_rate": 0.60
  },
  "cost_usd": {
    "input":       0.019,
    "cache_write": 0.006,
    "cache_read":  0.00077,
    "output":      0.032,
    "total":       0.058
  },
  "model_breakdown": { "sonnet_calls": 3, "haiku_calls": 2 }
}
```

Today's CLI-based adapter does not surface `usage.*`, so these blocks stay
unpopulated until Sprint 01's SDK adapter work resumes.

---

## Diff-refine stats (Sprint 02)

Per prompt, per critique round that used diff-regen:

```json
{
  "diff_stats": {
    "rounds_using_diff":      2,
    "avg_hunks_per_round":    3.4,
    "avg_lines_changed_ratio":0.18,
    "fallback_events":        0,
    "fallback_reasons":       []
  }
}
```

Definitions and health targets live in `skills/visionary/diff-refine.md`.
Runner-side population hooks into `applyUnifiedDiff` return values: the
adapter that calls the applier is responsible for appending to
`diff_stats.fallback_reasons` when `ok: false`.

---

## Loop control stats (Sprint 02)

Per prompt, emitted regardless of regen mode:

```json
{
  "loop_stats": {
    "rounds_executed":   2,
    "early_exit_reason": "high_confidence",
    "escalated_reroll":  false,
    "convergence_stopped": false,
    "schema_violations": 0
  }
}
```

- `early_exit_reason`: `"high_confidence"`, `"calibration_floor"`, `"blockers"`,
  or `null` when the loop ran to the round cap.
- `schema_violations`: count of retry triggers because the subagent's critique
  JSON failed `schemas/critique-output.schema.json`. Target: 0 on clean runs.

---

## `per_prompt[]`

Each entry:

```json
{
  "id":         "p001",
  "category":   "dashboard",
  "scores":     { "distinctiveness": 5, "coherence": 5, "accessibility": 4, "motion_readiness": 5 },
  "total":      19,
  "slop_flags": [ "Inter font as sole typeface" ],
  "diff_stats": { /* as above, omitted when diff mode was unused */ },
  "loop_stats": { /* as above */ }
}
```

The legacy `score` fields stay 1-5 integers for the benchmark rubric (see
`benchmark/rubric/rubric.md`). The 0-10 scale only applies to the critique
subagent output inside the refine loop — the benchmark scorer's rubric is
not migrated by Sprint 02.

---

## Compatibility

Runners older than Sprint 02 wrote only the top block (summary + per_prompt
with scores/total/slop_flags). `diff_stats` and `loop_stats` are additive;
comparators that do not know about them must treat missing keys as "feature
not exercised" rather than "zero usage".
