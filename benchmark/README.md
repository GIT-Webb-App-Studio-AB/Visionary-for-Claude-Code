# Visionary Aesthetic Benchmark

An open, reproducible evaluation suite for Claude Code design skills.
**100 prompts × 4 output dimensions = 400 scored data points per run.**

The goal is to become the reference measurement for "how good is an
AI-generated UI" — independent of which skill produced it. Visionary runs
itself against the benchmark, but `frontend-design`, `UI/UX Pro Max`,
`21st.dev Magic MCP`, `v0`, `Lovable`, and any future skill can run too.
Results are publishable, comparable, and reproducible.

## Why this exists

The AI-UI category lacks a shared measurement. Every skill's README claims
to produce "distinctive" or "accessible" output. Nobody agrees on what
those words mean, and nobody publishes numbers. This benchmark is the
fix: concrete prompts, concrete dimensions, concrete rubric, reproducible
harness.

## Structure

```
benchmark/
├── README.md                    — this file
├── prompts/
│   └── prompts.json             — 100 prompts across 10 categories
├── rubric/
│   └── rubric.md                — 4-dimension scoring rubric
└── runner.mjs                   — harness that runs a skill against the prompts
```

## The 4 Dimensions

| Dimension | What's measured | How it's measured |
|---|---|---|
| **Distinctiveness** | Does the output avoid generic AI-UI aesthetics? | LLM judge scores 1–5 against 26 slop patterns + stylistic coherence. Deterministic patterns score automatically; vision patterns via Claude Opus or GPT-5 vision |
| **Coherence** | Is the output consistent across sections / routes / states? | `/visionary-apply` style-lock audit across 3 routes — percentage of components using the locked token set |
| **Accessibility** | Does the output meet WCAG 2.2 AA + APCA Lc floors? | `axe-core` + `apca-validator.mjs` run against rendered screenshots; deterministic violation count |
| **Motion Readiness** | Is motion tokenized, reduced-motion-safe, and pause-controlled? | Regex scan for spring/easing tokens, `prefers-reduced-motion` gates, and WCAG 2.2.2 pause controls |

Each dimension scores 1–5. Per-prompt total = sum of 4 = 4–20. Per-run
mean = average across 100 prompts = 4.0–20.0.

## The 10 Prompt Categories

Each category has 10 prompts designed to stress different parts of the
algorithm:

1. **SaaS product dashboard** — data-dense, information architecture
2. **Consumer mobile app** — dopamine, delight, engagement
3. **Editorial publication** — long-form reading, typography
4. **Fintech trust surface** — regulatory, serious, restrained
5. **Creative portfolio** — distinctive, POV-driven
6. **Accessibility-first** — WCAG AAA, low-vision, cognitive a11y
7. **Multi-locale (non-ASCII)** — Swedish, Arabic, Japanese, Hindi
8. **Motion-forward marketing site** — kinetic, scroll-driven
9. **Healthcare / clinical** — calm, trust, informational
10. **Cross-domain transplantation** — "newspaper grid on a dashboard"

## Running the benchmark

```bash
# Against Visionary
node benchmark/runner.mjs --skill visionary --out results/visionary.json

# Against another skill (requires adapter)
node benchmark/runner.mjs --skill frontend-design \
  --adapter benchmark/adapters/frontend-design.mjs \
  --out results/frontend-design.json

# Compare two result files
node benchmark/runner.mjs --compare results/visionary.json results/frontend-design.json
```

Each run emits a JSON file with per-prompt scores, per-dimension totals,
and a final mean. The runner does NOT generate code — it calls the skill's
generation interface and scores the output. Code generation is the skill's
responsibility.

## Publishing results

Commit a `results/{skill}.json` to the `benchmark-results` branch. A
dashboard (planned) tracks versions over time and lets users compare
skills side-by-side. Community contributions of new prompts welcome via
PR — prompts must include a category, a one-sentence description, and the
expected output constraints.

## Known limitations

- LLM-judge variance on the Distinctiveness dimension. Run 3× and take the
  median to reduce noise (runner supports `--samples 3`).
- The benchmark does not measure *code quality* (readability, patterns).
  That's a different evaluation — see `code-quality/` when published.
- The rubric penalizes generic output harshly. A v0-style Next+shadcn+Inter
  scaffold will score poorly, which is intentional — the benchmark
  measures design craft, not feature completeness.
