# Diff-based refinement (rounds 2 & 3)

Sprint 02 splits the visual-critique loop into two regeneration modes:

| Round | Mode | Why |
|---|---|---|
| 1 | **Full regen** | Holistic redesigns are sometimes required after the first critique. Forcing a diff here would limit artistic freedom. |
| 2 | **Unified diff** | The component exists; only the issues flagged by `top_3_fixes` should change. Preserving scaffolding (imports, routing, unchanged JSX blocks) saves 40–60 % of the output tokens a full regen would burn. |
| 3 | **Unified diff** | Same rationale. Round 3 is a polish pass — treating it as a full regen tends to introduce regressions. |

`capture-and-critique.mjs` picks the mode via `shouldUseDiffRegen(round)` in
`hooks/scripts/lib/loop-control.mjs`. Round 1 always returns `false`; rounds ≥ 2
return `true` unless the previous round emitted `convergence_signal: true`, in
which case the loop is already terminating and the switch does not matter.

---

## Prompt contract (rounds 2 and 3)

When Claude is asked to refine, the subagent prompt includes:

```
Previous output: <file-path-to-previous-round-tsx>
Previous critique JSON: <validated-critique-output>

Emit ONLY a unified diff (GNU patch format) that addresses the top_3_fixes
above. The diff MUST:

  * Start with --- a/<path> and +++ b/<path> (a/b/-prefixed paths are fine).
  * Use @@ -oldStart,oldCount +newStart,newCount @@ hunk headers.
  * Include 2-3 lines of surrounding context around each change so the
    patch applies even if line numbers drifted.
  * Use ` ` (space) for unchanged context, `-` for removed, `+` for added.
  * Preserve trailing newlines (use `\ No newline at end of file` if the
    file does not end with a newline).

The diff MUST NOT:

  * Rewrite unchanged lines.
  * Emit the full file as additions.
  * Include prose, explanations, or markdown fences around the diff body.
  * Switch to JSON-diff, git-diff-tree output, or binary patches.
```

The subagent returns the diff as a single fenced `diff` code block. The hook
extracts it and feeds it to `applyUnifiedDiff(sourceContent, diffText)` from
`hooks/scripts/lib/apply-diff.mjs`.

---

## Apply pipeline

```
1. Parse       → parseUnifiedDiff(diffText)
                 Rejects malformed input early with a specific reason.
2. Dry-run     → applyPatch(source, patch, { dryRun: true })
                 Confirms all hunks match within fuzz tolerance before any
                 write. Equivalent of `patch --dry-run`.
3. Apply       → applyPatch(source, patch)
                 Writes the new content to the target file.
4. Re-critique → capture-and-critique hook re-fires on the Write.
```

The applier tolerates **± 3 lines of drift** by default (overridable via the
`fuzz` option). If two consecutive diff rounds shift the same region, the
second round's hunk headers refer to pre-shift line numbers but the context
still matches — the fuzz window handles that without a failure.

---

## Failure and fallback

If `applyUnifiedDiff` returns `{ ok: false }`:

1. The hook logs `diff_fallback: true` and `diff_fallback_reason: "<reason>"`
   into the run's `metrics.diff_stats.fallback_events`.
2. The caller **retries once** with a full regeneration prompt (same critique,
   but Claude emits the complete new file instead of a diff).
3. If the full regen also fails (parse error, empty output), the loop returns
   the previous round's file unchanged and records the round as a no-op.

The Sprint 02 AC sets `diff_fallback_events / rounds_using_diff ≤ 10 %` as the
health target on the 10-prompt suite. Crossing that threshold on any post-
merge benchmark run is treated as a regression and triggers a retro.

---

## Edge cases the applier handles

| Case | Behaviour |
|---|---|
| Line-number drift after a prior hunk shifted the source | Fuzz window of ± 3 lines, plus a linear scan if the window is exhausted. |
| Unicode content (diacritics, CJK, emoji) | Operates on JS strings; code-point boundaries are preserved because we never slice by byte offset. |
| CRLF vs LF line endings | Detects the source's line ending and re-emits the same terminator. |
| Trailing newline present | Preserved unless the diff declares `\ No newline at end of file` on the final `+` or ` ` row. |
| Trailing newline absent | Preserved unless the diff's final `+` / ` ` row is followed by a terminator hint. |
| Hunk whose context cannot be located | Returns `{ ok: false, reason: "hunk #N did not match within fuzz=3", hunkIndex: N-1 }`. Caller triggers fallback. |

---

## Metrics emitted per refine round

Recorded by the benchmark runner into `summary.json` / `metrics.json`:

```json
{
  "diff_stats": {
    "rounds_using_diff": 2,
    "avg_hunks_per_round": 3.4,
    "avg_lines_changed_ratio": 0.18,
    "fallback_events": 0,
    "fallback_reasons": []
  }
}
```

- `rounds_using_diff`: how many rounds (across all prompts) used diff-regen.
- `avg_hunks_per_round`: mean count of hunks in the parsed patches.
- `avg_lines_changed_ratio`: `(total +/- lines) / (total source lines)`. Lower
  ratios mean more scaffolding was preserved — that is the Sprint 02 win.
- `fallback_events`: number of failed `applyUnifiedDiff` calls that fell back
  to full regen.
- `fallback_reasons`: parallel array of the `reason` strings from failed
  parses/applies — used to drive regression investigations.

Post-Sprint-02 AC: output tokens per round 2+3 ≥ 40 % lower than the Sprint-01
baseline when diff mode is used.
