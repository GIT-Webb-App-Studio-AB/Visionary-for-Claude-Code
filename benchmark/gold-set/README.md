# Gold Set — Human-calibrated critique ground truth

**Purpose.** Twenty hand-scored screenshots + metadata used to calibrate the
visual-critic subagent against human judgement. `scripts/calibrate.mjs`
reads this directory, compares model output to consensus human scores, and
fits a per-dimension linear correction (`slope × raw + intercept`) that the
runtime applies before threshold gating.

Without this calibration, the critic scores on pure self-confidence — which
is exactly the LLM-vibes drift that Sprint 3 is designed to eliminate. The
gold set is the anchor.

---

## Rater methodology (Sprint 3 Task 8.1)

**Three raters per screenshot.** Ideally:
  1. The product owner (the user running `/visionary`) — knows what they wanted.
  2. An outside designer — generalist visual taste, no repo familiarity.
  3. A second outside designer — different discipline preferred
     (e.g. one web, one editorial; or one brand, one product).

**Scoring.** Each rater scores independently on all nine dimensions on the
**0–10 scale** defined in `skills/visionary/schemas/critique-output.schema.json`.
No discussion before scoring. No seeing other raters' scores.

**Consensus.** For each dimension, consensus is the **median of the three
scores**. If the spread (max − min) exceeds 2 points on any dimension, the
entry is flagged `consensus_confidence: "divergent"`. Divergent entries are
kept in the set (they expose critic disagreement), but `calibrate.mjs`
excludes them from Spearman-ρ computation to avoid noise-driven slopes.

**Balance.** The 20 entries should span the 13 style categories — not
heavy-weighted to any single one. Aim for:
  - 2 × historical (e.g. bauhaus, swiss-rationalism)
  - 2 × graphic (e.g. neon-dystopia, scandinavian-nordic)
  - 2 × emotional (e.g. trust-safety, playful-joyful)
  - 2 × industry (e.g. saas-dashboard, editorial)
  - 2 × hybrid (e.g. architecture-inspired, map-cartographic)
  - 2 × extended (e.g. hyper-comfort-hygge, terrazzo-digital)
  - 1 × each: accessibility-first, motion-marketing, brutalist-honesty,
    high-contrast-a11y, consumer-mobile, creative-portfolio, fintech-trust,
    healthcare.

---

## Directory layout

```
benchmark/gold-set/
├── README.md                  ← this file
├── _template.meta.json        ← copy-and-fill skeleton for new entries
├── gs-001.png                 ← screenshot (1200×800 or 375×812)
├── gs-001.meta.json           ← brief, style, rater scores, consensus
├── gs-001.critique.json       ← one cached critique output for calibration
├── gs-002.png
├── gs-002.meta.json
├── gs-002.critique.json
└── … through gs-020.*
```

`.critique.json` is the model's response captured during a dedicated
calibration run. It is NOT the round-by-round output from a normal
`/visionary` session — those are cache-polluted. Capture it with:

```bash
VISIONARY_CRITIQUE_CAPTURE=benchmark/gold-set/gs-007.critique.json \
  node hooks/scripts/capture-and-critique.mjs < stdin-event.json
```

Then manually copy the subagent's emitted JSON into the file. (A dedicated
capture script will land when a direct Anthropic SDK adapter exists — see
Sprint 01 amendment.)

---

## `meta.json` schema

```json
{
  "id": "gs-007",
  "brief": "Dashboard for a freight-logistics SaaS — live routes, on-time metric, driver roster.",
  "style_id": "bloomberg-terminal",
  "viewport": "1200x800",
  "human_scores": {
    "rater_alpha": {
      "hierarchy": 7, "layout": 8, "typography": 6, "contrast": 9,
      "distinctiveness": 7, "brief_conformance": 8, "accessibility": 6, "motion_readiness": 5,
      "craft_measurable": 7
    },
    "rater_beta":  { /* same shape */ },
    "rater_gamma": { /* same shape */ }
  },
  "consensus": {
    "hierarchy": 7, "layout": 8, "typography": 6, "contrast": 9,
    "distinctiveness": 7, "brief_conformance": 8, "accessibility": 6, "motion_readiness": 5,
    "craft_measurable": 7
  },
  "consensus_confidence": "tight",
  "dimension_spread": {
    "hierarchy": 1, "layout": 0, "typography": 1, "contrast": 1,
    "distinctiveness": 2, "brief_conformance": 2, "accessibility": 1, "motion_readiness": 2,
    "craft_measurable": 1
  },
  "captured_at": "2026-04-22",
  "captured_by": "davidrydgren@gmail.com"
}
```

- `consensus_confidence` is `"tight"` when no dimension spreads more than 2,
  otherwise `"divergent"`.
- `dimension_spread[d] = max_rater_score - min_rater_score`.
- `captured_at` is an ISO date (no time); `captured_by` is git email for
  audit.

---

## Current status

This is a **scaffold**. The 20 human-scored entries do not yet exist — they
require three raters per entry (see methodology above). Until they are
populated, `scripts/calibrate.mjs` runs in **identity mode**: it emits a
`calibration.json` with `slope=1, intercept=0, spearman_rho=null` on every
dimension, plus a top-level warning `"status": "identity_fallback"` so
runtime callers know no real calibration is in effect.

Adding entries is tracked in a standalone issue template —
`.github/ISSUE_TEMPLATE/gold-set-entry.md` — each entry gets one issue so
the rater scores can be captured as comments and merged via PR.

---

## Adding an entry

1. `cp _template.meta.json benchmark/gold-set/gs-NNN.meta.json`
2. Fill the `brief`, `style_id`, `viewport`, `captured_at`, `captured_by`.
3. Commit the PNG + meta with `human_scores` empty.
4. Request three raters via the issue template; each responds with their
   scores. Raters MUST NOT read each other's comments before scoring.
5. Once all three have scored, compute the consensus (median) + spread and
   commit the completed meta.
6. Capture a `.critique.json` via the calibration-run workflow (see above).
7. Re-run `node scripts/calibrate.mjs` — once 10+ entries exist with
   `.critique.json`, it switches from identity mode to fitted mode.
