---
name: visionary-flow
description: >
  Generate a coherent set of 5 UI states (list, detail, empty, error, loading)
  from a single feature description. All five share the same style-anchor and
  token-set; only the content-shape varies. A cross-screen critique loop
  measures drift (palette, motion, density, tone) per state-pair and corrects
  via regen until drift falls below threshold. Invoked as /visionary-flow or
  /flow.
---

# /visionary-flow — Cross-Screen Coherent Flow Generation

A component is not finished until *all its states are coherent*. If "loading"
feels harder than "list", the entire feature reads as broken. `/visionary-flow`
takes a single feature description and generates **5 coherent UI states** —
list, detail, empty, error, loading — sharing one style-anchor, one token-set,
five different content-shapes.

This is a Visionary signature feature. Neither v0, Lovable, Bolt nor Stitch
ships full-flow generation as a primitive. Most tools treat each state as a
separate prompt and the user is left stitching coherence by hand.

## Usage

```
/visionary-flow <feature-description>
/visionary-flow <feature-description> --single-state <state>
```

Examples:

```
/visionary-flow "todo-app for designers"
/visionary-flow "user-management table for an admin panel"
/visionary-flow "messaging inbox for a support team" --single-state empty
```

The `--single-state X` flag is a debug-mode escape hatch — generate only one
of `list|detail|empty|error|loading` without running the cross-screen loop.

## What it does

Pipeline (orchestrated by
[`hooks/scripts/lib/flow/multi-screen-orchestrator.mjs`](../hooks/scripts/lib/flow/multi-screen-orchestrator.mjs)):

1. **Parse feature** — identify the underlying resource ("todos", "users",
   "messages") so each state can render realistic mock-data of the right
   shape.
2. **Resolve shared design-context** — palette, typography, motion-tier,
   density, illustration-vocabulary. This is the *style-anchor* that all 5
   states share. It comes from the user's taste profile, an explicit `--vs`
   flag, or Stage 1 inference (same path as plain `/visionary`).
3. **Build 5 state-prompts** via `buildStatePrompts()` — each prompt embeds
   the shared design-context verbatim and varies only the content-shape:
   - `list` — multiple items rendered, varied content
   - `detail` — one item, full hierarchy
   - `empty` — empathetic + actionable copy, illustration vocabulary
   - `error` — graceful error with retry-affordance, tone matches design
   - `loading` — skeleton mirroring list-layout, subtle motion
4. **Parallel render** in 5 Playwright viewports (mocked routes / states).
5. **Cross-screen critique** via
   [`hooks/scripts/lib/flow/cross-screen-critique.mjs`](../hooks/scripts/lib/flow/cross-screen-critique.mjs)
   — measures drift on 4 dimensions (palette, motion, density, tone) across
   all 10 state-pairs, sorts top-3 worst drifts, emits a corrective prompt.
6. **Regen** the offending state(s) until the consistency-score clears the
   threshold or the iteration cap is hit.
7. **Output** — `flow/<feature>/{list,detail,empty,error,loading}.tsx` plus
   `flow/<feature>/flow.md` with a screenshot-grid linking all five.

## Drift dimensions and tolerances

`scoreCrossScreenConsistency()` aggregates 10 pairs (C(5,2) = 10) and applies
**state-typ-aware tolerances** because legitimate variation between states is
NOT drift:

| Pair             | palette | motion | density | tone |
|------------------|---------|--------|---------|------|
| list-detail      | 0.05    | 0.10   | 0.20    | 0.10 |
| list-empty       | 0.10    | 0.15   | 0.30    | 0.05 |
| list-error       | 0.15    | 0.10   | 0.25    | 0.10 |
| list-loading     | 0.20    | 0.30   | 0.15    | 0.20 |
| detail-empty     | 0.10    | 0.15   | 0.30    | 0.05 |
| detail-error     | 0.15    | 0.10   | 0.25    | 0.10 |
| detail-loading   | 0.20    | 0.30   | 0.15    | 0.20 |
| empty-error      | 0.10    | 0.10   | 0.20    | 0.05 |
| empty-loading    | 0.15    | 0.20   | 0.20    | 0.15 |
| error-loading    | 0.15    | 0.20   | 0.20    | 0.15 |

Rationale:

- **loading** legitimately reads as more muted (skeleton intentional) — the
  `*-loading` rows have larger palette + motion tolerances.
- **error** may carry a red-accent without violating palette coherence — the
  `*-error` rows have larger palette tolerances.
- **empty** is intentionally low-density (illustration + headline + CTA) —
  the `*-empty` rows have larger density tolerances.

A pair-violation (drift > tolerance on any dimension) costs 1.5 points off
a starting score of 10. Top-3 violations feed back into the corrective
prompt verbatim.

## Output format

```
flow/<feature>/
├── list.tsx
├── detail.tsx
├── empty.tsx
├── error.tsx
├── loading.tsx
└── flow.md            # screenshot-grid + cross-screen score + drift-table
```

`flow.md` is the canonical entry-point: it shows all 5 screenshots in a
2×3 grid, lists the cross-screen consistency score, and surfaces any
remaining violations so the human reviewer can see *exactly* where coherence
is loose.

## Composition with other commands

| Command                       | Flow behaviour                                |
|-------------------------------|-----------------------------------------------|
| `/visionary --vs <style>`     | `--vs` style-anchor wins — flows inherit it.  |
| `/visionary-from-photo`       | Photo palette + motion-tier seeds the anchor. |
| `/visionary-mood`             | Mood phrase contributes to the shared anchor. |
| `/visionary-taste`            | Permanent-avoid facts override flow picks.    |
| `/apply`                      | Lock the flow's anchor across the project.    |

## Reference implementation

- Orchestrator: [`hooks/scripts/lib/flow/multi-screen-orchestrator.mjs`](../hooks/scripts/lib/flow/multi-screen-orchestrator.mjs)
- Cross-screen critique: [`hooks/scripts/lib/flow/cross-screen-critique.mjs`](../hooks/scripts/lib/flow/cross-screen-critique.mjs)
- Tests: `hooks/scripts/lib/flow/__tests__/`
- Sprint reference: `docs/sprints/sprint-22-cross-screen-voice.md` Tasks 40.1 + 40.2

## Acceptance criteria (Sprint 22 Tasks 40.1 + 40.2)

- 5 files produced per flow, all sharing palette + motion-tokens (verifiable
  via DTCG-extraction).
- `flow.md` links all 5 + renders the screenshot-grid.
- Cross-screen drift-score < 0.3 on every pair after one corrective iteration.
- State-typ-aware rules: loading skeleton-density does NOT flag as drift.
- `cross_screen_drift` trace event emitted per pair with `{state_pair,
  drift_dims, scores}`.

## Related

- `/visionary` — main generation. `/visionary-flow` extends it across states.
- `/visionary-voice` — voice-tempo refinement. Sprint 22 Task 40.3.
- `/apply` — lock the flow's anchor across the entire product.
