# MLLM Judge

Sprint 12 introduces an opt-in MLLM judge that breaks ties in the critique loop.

## When it fires

`tie-detect.mjs` returns a list of dim-level ties when:

- two best-of-N candidates have composite-score diff ≤ 0.3, OR
- a critic dim has self-reported confidence < 0.6, OR
- heuristic stack and DINOv2 stack disagree by ≥ 1.5 score points.

Budget caps per round (default 1) and per session (default 5) prevent cost runaway.

## When it cannot reject

Judge output is policy-applied:

- `winner: "tie"` or `confidence < 0.5` → heuristic preferred winner stands
- judge contradicts heuristic with margin ≥ 1.5 → heuristic still wins, judge becomes dissent metadata
- judge agrees with heuristic OR heuristic is weak → judge winner counted

## Toggles

| Env | Default | Effect |
|---|---|---|
| `VISIONARY_MLLM_JUDGE` | off | `tie-only` recommended once stable |
| `VISIONARY_JUDGE_MODEL` | `claude-sonnet-4-6` | model id |
| `VISIONARY_JUDGE_MAX_PER_ROUND` | 1 | hard cap |
| `VISIONARY_JUDGE_MAX_PER_SESSION` | 5 | hard cap |
| `VISIONARY_JUDGE_VERBOSE` | off | `1` prints API errors to stderr |

## Cost

Sonnet 4.6 vision call ~$0.30–$0.60 per pairwise comparison at 1200×800 PNG. Default budget caps total session cost at ~$3.
