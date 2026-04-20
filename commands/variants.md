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
2. Instead of weighted-random-picking ONE winner from the top 3 post-scoring
   list, pick THREE with these distinctness rules:
   - Variant A: the top-scored style (the "safe" take)
   - Variant B: the highest-scoring style from a DIFFERENT top-level category
     than A (forces cross-domain contrast)
   - Variant C: the highest-scoring style whose `motion_tier` differs from
     both A and B — if no such style exists in the top 10, fall back to the
     first top-10 style whose `palette_tags` share ≤ 1 tag with A
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

## Rules

- Never generate more than 3 variants. The SELF-REFINE literature shows 3 is
  the sweet spot; 5+ leads to decision fatigue without improving outcomes.
- Each variant file must be independently runnable — no shared imports that
  don't exist yet, no incomplete JSX, no `// TODO` inside.
- Taste profile (`system.md`) still applies — any permanently-flagged style is
  excluded from all three variants, not just the winner.
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
