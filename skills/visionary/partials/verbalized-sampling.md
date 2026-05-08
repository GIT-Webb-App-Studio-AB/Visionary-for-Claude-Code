# Verbalized Sampling — pre-generation concept lattice

Sprint 16 Task 31.1. RLHF-trained models (Claude included) suffer from
*typicality bias*: temperature-tuned sampling drags generation toward the
mode of the training distribution. The "obvious" interpretation of a
brief wins ~57–65 % of the probability mass (Zhang 2025, α ≈ 0.6) and
the four equally-valid alternatives starve. **Verbalized Sampling**
breaks the bias by forcing the model to enumerate its own candidate set
*before* writing code, with explicit subjective probability weights.
A weighted random pick (with anti-typicality boost α ≈ 0.65) then
selects which interpretation Stage 2 actually develops.

This partial is invoked by Stage 1.5 of the visionary pipeline. Output
is consumed by `hooks/scripts/lib/verbalized-sampling.mjs` for schema
validation, convergence-check, and weighted pick.

---

## Output contract — return ONLY this JSON object

Before any code generation, before any prose, before any "I'll start
by…" preamble, return EXACTLY this JSON object and nothing else:

```json
{
  "concepts": [
    {
      "concept": "concise creative direction (10–120 chars)",
      "probability": 0.34,
      "rationale": "why this interpretation fits the brief (≤ 50 tokens)",
      "suggested_style_id": "kebab-case-style-id-from-_index"
    },
    {
      "concept": "second distinct interpretation",
      "probability": 0.22,
      "rationale": "why this interpretation fits",
      "suggested_style_id": "different-kebab-case-id"
    },
    {
      "concept": "third — pull from a different design tradition",
      "probability": 0.18,
      "rationale": "why this interpretation fits",
      "suggested_style_id": "another-style-id"
    },
    {
      "concept": "fourth — explicitly underutilised tradition",
      "probability": 0.14,
      "rationale": "why this interpretation fits",
      "suggested_style_id": "rare-region-style-id"
    },
    {
      "concept": "fifth — wildcard, far from your default",
      "probability": 0.12,
      "rationale": "why this interpretation fits",
      "suggested_style_id": "wildcard-style-id"
    }
  ]
}
```

No markdown fences in the actual response. No prose before or after.
Just the bare JSON object. The runtime parses with `JSON.parse` directly
on the response body — extra text breaks the parse and triggers a retry.

---

## Hard constraints

1. **Exactly 5 concepts.** Not 3, not 7. Five is the Zhang 2025 sweet
   spot between diversity (too few = no real choice) and token-cost
   (too many = mediocre uniform distribution).

2. **Probabilities sum to ≈ 1.0.** Tolerance ±0.02. The runtime
   normalises after pick, so small drift is fine, but a sum of 0.6 or
   1.4 signals you misunderstood the format.

3. **Anti-flat distribution.** A flat `[0.20, 0.20, 0.20, 0.20, 0.20]`
   defeats the purpose. The intent is one strong interpretation
   (probability ≈ 0.30–0.45) plus four genuine alternatives — including
   at least two that feel *uncomfortably* far from the obvious answer.
   If your distribution is uniform, you have not done the work.

4. **At least 2 concepts from different design traditions.** If the
   brief obviously calls for "minimal SaaS landing", one concept must
   be the obvious minimal SaaS landing. The other four should span
   underutilised regions of the catalogue: editorial print, brutalist
   web, anti-design poster, expressive motion-first, regional
   vernacular, vintage-revival, etc. Look at
   `skills/visionary/styles/_index.json` and pick from categories you
   would not normally pick from for this brief.

5. **`suggested_style_id` must match the kebab-case pattern**
   `^[a-z0-9-]+$` and **should** correspond to an existing entry in
   `skills/visionary/styles/_index.json`. The runtime validates the
   shape; whether the ID actually exists is a soft check (mismatched
   IDs trigger a fallback to nearest-neighbour style).

6. **`rationale` is ≤ 50 tokens.** One sentence. State the linkage
   between the brief signal (calm tone, dense data, expressive motion,
   etc.) and the concept choice. No "this would be a great fit"
   filler.

7. **`concept` is 10–120 chars.** A descriptive phrase, not a full
   sentence. "minimal editorial card with single accent line" not
   "I would create a minimal editorial card that has a single accent
   line for visual interest."

---

## Probability semantics

`probability` is your subjective best-of-1 pick weight: *if I were
forced to pick exactly one interpretation, which would I pick, and
how much do I prefer it over the runner-up?*

This is **not** a confidence score, **not** a quality score, **not**
a calibration over the population of users. It is your own gut weight
for "this is the most natural reading of this brief". The runtime
applies an anti-typicality boost `weight = probability ^ (1 − α)`
with α = 0.65, so concepts with `probability < 0.15` get a 1.3–1.6×
boost in the actual pick — that is the whole point. Your job is just
to give honest weights; the runtime handles the diversity injection.

---

## Anti-convergence instruction

If your 5 concepts feel similar — same archetype, same era, same
density, same motion vocabulary, same colour temperature — STOP and
regenerate. Five variations on "minimal card with subtle motion" is
not five concepts; it is one concept rephrased five times.

A passing distribution looks like:

- 1 concept from the obvious tradition for the brief
- 1 concept from an adjacent but genuinely different tradition
- 1 concept from a temporally distant era (1960s Swiss / 1980s memphis
  / 2000s flash / 2020s anti-design)
- 1 concept from a different cultural region (japanese editorial /
  brazilian modernist / scandinavian functional / german brutalist)
- 1 concept that is the *intentionally weird* take — the one a
  sensible designer would talk you out of, that might also be the one
  you remember for years

A failing distribution looks like five neighbours in the same node of
the design tree. If you catch yourself writing "minimal X, clean Y,
restrained Z, understated W, calm V" — those are not five concepts.

---

## Token budget

Cap the entire response at ≈ 400 tokens. With 5 rationales × ~50
tokens + concept strings + JSON structure overhead, this leaves
comfortable headroom. The runtime hard-caps at 800 tokens for the VS
stage (input prompt + your response combined); going over breaks the
budget contract for Stage 1.5.

---

## What happens after you respond

1. The runtime parses your JSON and validates against
   `skills/visionary/schemas/verbalized-sampling.schema.json`.
2. If invalid: one retry with a system message reminding you of the
   schema. Two failures → Stage 1.5 is skipped and the pipeline runs
   the legacy single-shot path.
3. If valid: convergence-check runs. If 3+ concepts have token-set
   Jaccard similarity > 0.7, you get a re-prompt: *"your 5 suggestions
   are too similar; produce 5 from genuinely different design
   traditions"*.
4. If diverse: anti-typicality weighted random pick (α = 0.65, boost
   capped at 1.6×) selects one concept. That concept's `concept` text
   and `suggested_style_id` enrich the Stage 2 Design Reasoning Brief.
5. The full 5-concept array, the picked index, and α are recorded in
   the receipt's `vs_concepts` field for trace + replay.
