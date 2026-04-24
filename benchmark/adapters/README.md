# Benchmark Adapters

Each adapter teaches the benchmark runner how to invoke a specific skill and
collect its generated output for scoring. Adapters are the bridge between
`runner.mjs` (skill-agnostic) and the skill under test.

## Contract

An adapter is an ES module exporting `run({ prompt, constraints })` which
returns `{ files: [{ path, content }], error? }`:

```js
export async function run({ prompt, constraints }) {
  // prompt: { id, prompt, category, constraints }
  // Return ≥1 file containing the generated source code.
  return { files: [{ path: "generated.tsx", content: "..." }] };
}
```

When an adapter cannot produce output (skill unavailable, generation failed,
rate-limit), return `{ files: [], error: "reason" }` and the runner will
record the prompt as skipped rather than zero-scored.

## Shipped adapters

| File | Target skill | Transport | Requires |
|---|---|---|---|
| [`claude-headless.mjs`](./claude-headless.mjs) | Any Claude Code skill | `claude -p` CLI | `claude` CLI + skill installed |
| [`frontend-design.mjs`](./frontend-design.mjs) | Anthropic `frontend-design` | `claude -p` CLI | `frontend-design` plugin installed |
| [`ui-ux-pro-max.mjs`](./ui-ux-pro-max.mjs) | `nextlevelbuilder/ui-ux-pro-max-skill` | `claude -p` CLI | skill installed from their marketplace |
| [`baseline-slop.mjs`](./baseline-slop.mjs) | Default-tailwind + Inter + gradient | Static template | none |

## Running a full-coverage comparison

```bash
# Generate + score Visionary on all 100 prompts (one run ≈ 20–40 min)
VISIONARY_VERSION=1.3.1 \
  node benchmark/runner.mjs \
    --skill visionary \
    --adapter benchmark/adapters/claude-headless.mjs \
    --out results/visionary-1.3.1-full.json

# Generate + score frontend-design on all 100 prompts
node benchmark/runner.mjs \
  --skill frontend-design \
  --adapter benchmark/adapters/frontend-design.mjs \
  --out results/frontend-design-full.json

# Compare
node benchmark/runner.mjs --compare \
  results/visionary-1.3.1-full.json \
  results/frontend-design-full.json
```

## Cost / time envelope per full run

Assuming Claude Opus 4.7 through the CLI:

- 100 prompts × ~4k input + ~2k output tokens ≈ 600k tokens per run
- Wall time: 20–40 min depending on critique-loop rounds
- API cost: ~$10–$20 per full run (list price)

Running with `--samples 3` triples the cost but gives per-prompt medians and
confidence intervals. Recommended before publishing a headline number.

## Writing your own adapter

Follow the shape in `claude-headless.mjs`. The only hard requirement is that
you return generated source code as text — the benchmark does not care which
framework or library it targets, as long as the scorers' regex heuristics
apply. For framework-specific scorers, see `benchmark/scorers/`.

If your skill cannot be driven headlessly, use the default staged-file
adapter in `runner.mjs` (stage generated files under `benchmark/.staged/`
with names `{prompt.id}.tsx`).
