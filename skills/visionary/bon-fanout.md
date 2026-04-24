# Best-of-N Fan-Out Protocol

Runtime reference loaded by `hooks/scripts/capture-and-critique.mjs` when
Best-of-N mode activates on round 2+. The hook emits the short activation
line; this file carries the full playbook so we don't eat 3 KB of every
`additionalContext` payload.

Activation condition: `round >= 2` AND `VISIONARY_DISABLE_BON` is unset AND
the previous round returned a non-empty `top_3_fixes` AND did not fire
`convergence_signal`. See `hooks/scripts/lib/fork-candidate.mjs#isBonEnabled`
for the executable source of truth.

---

## Fan-out step-by-step

The hook passes three artefact path sets (one per candidate) through
`additionalContext`. For each candidate `A`, `B`, `C`:

1. **Copy** the source file to `<paths>[id].source_copy` before patching.
   The real file must stay intact until the verifier picks a winner.
2. **Apply** the previous round's `top_3_fixes` under the candidate's
   temperature + instruction profile (see table below). Emit a unified diff
   to `<paths>[id].diff` using `hooks/scripts/lib/apply-diff.mjs`.
3. **Screenshot** the modified copy through Playwright at 1200×800 with
   the same font + animation gates the main flow uses (do not use
   `networkidle`). Write to `<paths>[id].screenshot`.
4. **DOM snapshot** → `<paths>[id].dom`, **axe.run()** → `<paths>[id].axe`.
5. **Numeric scorer**:
   `node benchmark/scorers/numeric-aesthetic-scorer.mjs --screenshot <png> --dom <json> --axe <json> --out <paths>[id].numeric`
6. **Critic subagent** (the existing `agents/visual-critic.md`) produces
   `<paths>[id].critique`.
7. **Apply calibration**:
   `node hooks/scripts/lib/apply-calibration.mjs --critique <paths>[id].critique --calibration skills/visionary/calibration.json --out <paths>[id].calibrated`

Run 1–7 **in parallel** across A/B/C, respecting the concurrency ceiling
the hook announces (2 on Windows, 3 elsewhere). Per-candidate wall-clock
budget is 90 s — on timeout, mark that candidate missing and continue.

---

## Candidate profiles

| id | temperature | instruction                                                                                                                                 | expected wins            |
|----|-------------|---------------------------------------------------------------------------------------------------------------------------------------------|--------------------------|
| A  | 0.2         | Apply `top_3_fixes` **literally**. Minimal deviation from the cited selectors / values.                                                     | brief_conformance, safety |
| B  | 0.5         | Apply `top_3_fixes` **in spirit**. Holistic adjustments allowed when they serve the same dimension. Preserve original style intent.         | hierarchy, layout         |
| C  | 0.8         | Apply `top_3_fixes` but **explore a distinct visual solution**. Free to re-derive at the style level; stay within the style's frontmatter.  | distinctiveness, craft    |

---

## Verifier step

Invoke `agents/visual-verifier.md` with the assembled candidate artefacts
(use `hooks/scripts/lib/fork-candidate.mjs#prepareVerifierInput`). The
verifier returns:

```json
{
  "winner_index": 0 | 1 | 2,
  "margin": "decisive" | "narrow" | "indistinguishable",
  "escalate_to_user": boolean,
  "pairwise_rationale": [ ... ],
  "regression_notes": [ ... ],
  "prompt_hash": "sha256:..."
}
```

### Applying the verifier output

- **`escalate_to_user: false`** → apply the winner's diff
  (`<paths>[winner].diff`) to the real source file. If the diff fails to
  apply, fall back to the winner's full regenerated component.
- **`escalate_to_user: true`** → DO NOT auto-apply. Surface all three
  candidates (screenshots + diffs) to the user and let them pick. This
  includes any case where `margin === "indistinguishable"`.
- **`margin === "decisive"` AND round === 2 AND winner's calibrated
  `craft_measurable >= 7.5`** → skip round 3 entirely and deliver the
  winning output. This is the sprint 4 Task 10.3 early-exit.

---

## Failure modes

| Condition                             | Policy                                                                                          |
|---------------------------------------|--------------------------------------------------------------------------------------------------|
| 2+ of 3 candidates crash              | Degrade to single-best-effort (fall back to pre-BoN sequential-refine behaviour).              |
| All 3 `applied_diff` byte-identical   | The fan-out collapsed (very-low-temperature convergence). Pick any; verifier will flag margin. |
| Verifier JSON invalid / unparseable   | Fall back to the candidate whose `raw_scores.craft_measurable` is highest.                     |
| Playwright MCP unreachable            | Hook disables BoN for this generation; no fan-out block appended to `additionalContext`.       |

---

## Metrics

After the fan-out completes, the hook persists `bon_stats` to its metrics
block via `collectBonStats`:

```json
{
  "rounds_using_bon": 1,
  "avg_verifier_margin": "narrow",
  "escalations_to_user": 0,
  "candidate_failures": 0,
  "winner_score_lift_vs_seq": 0.4,
  "margin_histogram": { "decisive": 0, "narrow": 1, "indistinguishable": 0 }
}
```

Downstream consumers (`benchmark/runner.mjs`, results rollups) compare
`winner_score_lift_vs_seq` against the Sprint 3 baseline to answer the
sprint-4 DoD: "BoN-kvalitetslyft ≥ +0.3 calibrated composite".
