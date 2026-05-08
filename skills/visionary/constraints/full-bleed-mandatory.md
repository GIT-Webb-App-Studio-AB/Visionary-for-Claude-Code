---
id: full-bleed-mandatory
category: layout
css_rules:
  - "At least 50% of top-level sections MUST be full-bleed (inline-size = 100vw OR width = 100%, with no max-width clamp)"
  - "Implementation via width: 100vw + margin-inline: calc(50% - 50vw), OR via flex-basis: 100% on the section root"
  - "Inner content can have max-width, but the section's background and outer-edges extend to viewport"
invariants:
  - "Among top-level sections, count where computed width >= 0.95 * viewport.width MUST be >= 50% of total"
conflict_set: ["pixel-perfect-grid", "swiss-rationalism-strict"]
rationale: "Full-bleed sections feel cinematic — they treat the page as a canvas, not a column-of-content document. The pattern is dominant in product marketing (Apple, Stripe), in editorial long-form (NYT features), and in fashion brand sites. Forcing 50%+ full-bleed sections rejects the default 'max-w-4xl mx-auto' Tailwind container pattern."
examples: ["Apple product pages 2024-25", "Stripe Sigma marketing 2024", "NYT interactive features 2023-25"]
---

# full-bleed-mandatory

At least half of the page's top-level sections extend edge-to-edge of
the viewport. Inner content can be constrained, but section backgrounds
and outer-frames bleed.

## Compliant patterns

```css
.section--bleed {
  inline-size: 100vw;
  margin-inline: calc(50% - 50vw);
  background: oklch(0.18 0 0);
  overflow-x: clip;
}

.section--bleed > .inner {
  max-inline-size: 1200px;
  margin-inline: auto;
  padding-inline: 24px;
}
```

## Non-compliant

A page where every section sits inside `<div class="container max-w-7xl mx-auto">`
— no bleed anywhere.

## Validation

Walk top-level sections. Compare `bbox.width` to `viewport.width`. Count
sections where `bbox.width >= 0.95 * viewport.width`. Pass if count ≥
half of the total section count.
