# Visionary Aesthetic Benchmark — Scoring Rubric

Every prompt produces one generated component / page. Score it against
four dimensions, each 1–5. Sum = 4–20 per prompt, mean across 100 prompts
= 4.0–20.0 per run.

---

## Dimension 1 — Distinctiveness (1–5)

Does the output look like a deliberate design choice, or does it look like
generic AI-generated UI?

| Score | Signal |
|---|---|
| 5 | Clear point of view; style would be recognizable in a design portfolio. No slop patterns detected. |
| 4 | Distinctive in most areas; 1–2 slop patterns (e.g. one uniform radius, one default accent color). |
| 3 | Middle-of-the-road. Mix of deliberate and template choices. 3–5 slop patterns. |
| 2 | Predominantly generic. 6+ slop patterns — purple gradient, Inter, uniform border-radius, shadow-md on everything. |
| 1 | Indistinguishable from a default shadcn+Inter scaffold. 10+ slop patterns. |

**Measurement**: deterministic slop scanner (`capture-and-critique.mjs`
patterns 1–20) scores the code, LLM-vision judge scores patterns 21–26
against the screenshot.

Score = `5 - min(4, floor(slopPatternCount / 2.5))`.

---

## Dimension 2 — Coherence (1–5)

Is the output consistent across multiple related surfaces?

**Measurement protocol**: Each prompt that calls for a non-trivial app
(dashboard, flow, multi-route) is re-run with 2 additional related prompts
("add a settings page to the same app", "add a list page"). Token-usage
similarity is measured:

| Score | Signal |
|---|---|
| 5 | 95%+ of colors, fonts, spacing, and motion tokens match across all 3 routes. Design system is tangibly locked. |
| 4 | 85–95% match. Minor drift in one surface. |
| 3 | 70–85% match. Visible drift in 2 surfaces (different fonts, different accent colors). |
| 2 | 50–70% match. Routes look like they belong to different apps. |
| 1 | < 50% match. Each route is independently styled. |

**For single-surface prompts**: Coherence scored by internal consistency
instead (repeated uniform decisions across the surface — same radius
vocabulary, same spacing rhythm, same motion curve).

Tooling: `scripts/measure-coherence.mjs` (TODO) extracts hex codes, font
families, border-radius values, spacing scale from both the style-lock
spec AND the generated code, and computes Jaccard similarity.

---

## Dimension 3 — Accessibility (1–5)

Does the output meet WCAG 2.2 AA AND APCA Lc floors?

**Measurement**: `axe-core` runs against the rendered screenshot and
reports `violations[]` with `impact: critical|serious|moderate|minor`.
`apca-validator.mjs` runs against the source's declared color pairs.

| Score | Signal |
|---|---|
| 5 | Zero axe violations. All APCA Lc floors passed. `:focus-visible` present. Touch targets ≥ 44. `prefers-reduced-motion` gated. Logical properties. Pause control for any animation > 5s. |
| 4 | Zero critical/serious violations; 1–2 minor. APCA passes. A11y primitives present. |
| 3 | 1 serious OR 3 moderate axe violations. APCA marginal (within 5 Lc of floor). |
| 2 | Any critical axe violation OR APCA failure on body text OR missing focus indicators OR touch targets < floor. |
| 1 | Multiple critical violations. Keyboard navigation would fail. |

**Deterministic**: no human/LLM judge needed for this dimension. axe +
APCA fully measure it.

---

## Dimension 4 — Motion Readiness (1–5)

Is motion a first-class concern, tokenized, and safely implemented?

**Measurement**: AST scan of the output for spring / easing tokens, guarded
animations, and WCAG 2.2.2 pause controls.

| Score | Signal |
|---|---|
| 5 | Entry variants defined using `spring.*` tokens from `motion-tokens.ts` OR CSS-first `@starting-style` / `animation-timeline`. `prefers-reduced-motion: reduce` degrades motion. Pause control present if any animation > 5s. |
| 4 | Motion tokenized; reduced-motion present; minor inconsistency in token use. |
| 3 | Some animation present but not token-driven (hardcoded durations). Reduced-motion gate present. |
| 2 | Static component with placeholder comments OR motion without reduced-motion safety. |
| 1 | No animation primitives. OR animation without any safety; would fail vestibular tests. |

**Deterministic**: regex scan of the source for `spring.*`, `transition:`
with hardcoded durations, `@media (prefers-reduced-motion`, and
`animation-play-state` bound to a pause control.

---

## Interpreting a run

- **Total 18–20**: exceptional output. Top 10% of AI-UI generation.
- **Total 14–17**: strong. Shipped products look like this.
- **Total 10–13**: serviceable but generic. Most v0 / Lovable output.
- **Total 6–9**: AI-slop. Recognizable as "AI-generated" at a glance.
- **Total 4–5**: unusable without rework.

## Comparing across skills

Publish `results/{skill}/{version}.json` and run:

```bash
node benchmark/runner.mjs --compare \
  results/visionary/1.3.0.json \
  results/frontend-design/2024-09.json
```

Output is a per-dimension delta table + per-category breakdown + a summary
line: "Visionary 1.3.0 outscored frontend-design 2024-09 by +3.8 points
on average (N=100, p < 0.01)". Statistical significance uses a paired
Wilcoxon signed-rank test.

## Contributing prompts

Pull requests against `benchmark/prompts/prompts.json`. Each prompt needs:

- An `id` (`{category-prefix}-{nn}`)
- A `prompt` (the instruction, one sentence)
- Optional `constraints` (locale, density, motion_appetite)

New categories require RFC + 10 prompts + rubric notes.
