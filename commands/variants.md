---
name: visionary-variants
description: >
  Generate 3 distinct aesthetic takes on the same brief BEFORE entering the
  critique loop. User picks one to iterate on. Counteracts the "single output
  + critique" loop's tendency to converge on the first draft's assumptions.
  Invoked as /visionary-variants or /variants.
---

# /visionary-variants — Multi-variant Generation

Competitors like 21st.dev Magic and Subframe win on "pick your favorite" — Claude
users often want to see the aesthetic range before committing. This command
forces the algorithm to emit three MUTUALLY-DISTINCT candidates in parallel
rather than starting the critique loop on one.

## When to invoke

- User says "show me some options", "give me a few takes", "I want to see
  variations", "3 versions", "alternatives"
- User rejects a first generation and asks for "something different" — use
  this to widen the search rather than a single new attempt
- Before committing to a style for a multi-page product (see also: `/apply`)

## Behavior

1. Run Stage 1 (Context Inference) as normal to produce a `StyleBrief`.
2. Run the **orthogonal-selection algorithm** (Sprint 4 Item 11) instead of
   category-based heuristics. Steps:

   a. Execute Stages 1–4 of the normal 8-step algorithm to produce a ranked
      candidate list.
   b. Pick **variant A** = rank 1 (the winner).
   c. Load 8-d style embeddings from
      `skills/visionary/styles/_embeddings.json#embeddings` — one vector
      per style, axes: `density, chroma, formality, motion_intensity,
      historicism, texture, contrast_energy, type_drama`.
   d. Pick **variant B** = highest-ranked candidate whose cosine distance
      from A is ≥ **0.6**. If the pool is empty at 0.6, relax to 0.5, then
      0.4. If still empty after relaxation, pick rank 2 and surface a note
      `v2_fallback_exhausted` so the user knows distinctiveness collapsed.
   e. Pick **variant C** = highest-ranked candidate whose cosine distance
      from BOTH A and B is ≥ the same threshold (with the same relaxation
      ladder). On exhaustion, fall back to the next top-ranked candidate and
      surface `v3_threshold_disabled`.

   Reference implementation: `hooks/scripts/lib/orthogonal-variants.mjs`
   `pickOrthogonalVariants({ ranked, embeddings })`. The algorithm is
   deterministic given the same ranked list — stochasticity enters only
   through the weighted-random winner choice upstream.

3. Run Stage 2 (Design Reasoning Brief) for all three in parallel subagents
   so the briefs come back simultaneously.
4. Run Stage 3 (Code Generation) for all three, writing to:
   - `{target}.variant-a.{ext}`
   - `{target}.variant-b.{ext}`
   - `{target}.variant-c.{ext}`
5. Render all three in a 3-up preview via Playwright's
   `browser_navigate` → `browser_take_screenshot` at 1200×800 each.
6. Return the three thumbnails + one-sentence rationale per variant. Do NOT
   enter the critique loop yet — that runs after the user picks.
7. When the user picks (e.g. "go with B" or "merge A's typography into B"),
   copy the chosen variant file to `{target}.{ext}` (overwriting the previous
   working file) and enter the critique loop from Stage 4.

## Output shape

```
Variant A — swiss-rationalism (safe)
  files: src/dashboard.variant-a.tsx
  rationale: "Top scorer for SaaS + balanced density. Helvetica, red accent."

Variant B — cassette-futurism (cross-domain)
  files: src/dashboard.variant-b.tsx
  rationale: "Highest-scoring from a different category — beige CRT panels
              against the Swiss grid's white. Contrarian pick."

Variant C — ambient-copilot (motion-distinct)
  files: src/dashboard.variant-c.tsx
  rationale: "Only Expressive-tier option in top 10; trades grid for
              anchor-pinned surfaces and streaming indicators."

Screenshots saved — say `pick A`, `pick B`, `pick C`, or
`merge [parts of X into Y]` to continue.
```

## Writing `last-variants-brief.json` (Sprint 05, Task 15.2)

Immediately after step 4 (code generation, before the 3-up render), write a
snapshot of the three candidates + brief context to
`.visionary-cache/last-variants-brief.json` (or `$CLAUDE_PLUGIN_DATA/visionary-cache/last-variants-brief.json`
if that env is set). The UserPromptSubmit hook `update-taste.mjs` reads this
file when the user's next turn contains a pick phrase (`pick A`, `go with B`,
`take #2`, etc.) and emits a taste-pair to `taste/pairs.jsonl`.

Snapshot shape:

```json
{
  "brief_summary": "dashboard for a fintech SME, Swedish, balanced density",
  "product_archetype": "fintech",
  "component_type": "dashboard",
  "audience_density": "balanced",
  "motion_tier": "Subtle",
  "brand_archetype": "Ruler",
  "variants": [
    { "style_id": "swiss-rationalism" },
    { "style_id": "cassette-futurism" },
    { "style_id": "ambient-copilot" }
  ]
}
```

Write the file with `JSON.stringify(brief, null, 2)` + trailing newline.
Overwrite on every `/variants` invocation — there is only ever one "last
variants brief" per project.

Do NOT gate on `VISIONARY_DISABLE_TASTE`: that env var silences the hook
side, not the snapshot side. The snapshot is harmless ambient state; if
taste is disabled, `update-taste.mjs` ignores the snapshot anyway.

## Rules

- Never generate more than 3 variants. The SELF-REFINE literature shows 3 is
  the sweet spot; 5+ leads to decision fatigue without improving outcomes.
- Each variant file must be independently runnable — no shared imports that
  don't exist yet, no incomplete JSX, no `// TODO` inside.
- Taste profile applies — permanent + avoid facts from `taste/facts.jsonl`
  (or legacy `system.md` flags, read via `inject-taste-context.mjs`) exclude
  that style from all three variants, not just the winner. Filter BEFORE
  the orthogonal algorithm runs — a banned style cannot be resurrected by
  being the "most distant from the winner".
- Orthogonal-selection acceptance bar (Sprint 4 DoD): across 10 `/variants`
  invocations the mean pairwise cosine distance between variants must
  clear **0.5**. When the chosen brief concentrates candidates in a narrow
  slice of embedding space (e.g. "fintech dashboard" → all candidates land
  in `historicism<0.3 & formality>0.7`), the algorithm will relax the
  threshold or collapse to fewer variants — and surface the note. Users
  can re-invoke `/variants` with a wider brief to get a richer three-way.
- If the user has set `VISIONARY_DISABLE_CRITIQUE=1`, skip step 5 (rendering);
  return the file paths and let the user preview manually.
- This command does NOT enter the critique loop. It ends at the three-way
  preview. Critique fires only after the user's pick.

## Cost accounting

Three code generations + three screenshots ≈ 3× the tokens of a single-path
generation. Worth it when the user is undecided; skip when the brief is
unambiguous. Default to single-path unless the user explicitly asks for
variants.

## Integration with `/apply`

If the user invokes `/apply` after `/variants`, the picked variant becomes
the locked style for the whole product — all subsequent routes inherit its
tokens. See `commands/apply.md`.
