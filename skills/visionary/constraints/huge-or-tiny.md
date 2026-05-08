---
id: huge-or-tiny
category: typography
css_rules:
  - "Use exactly TWO font-sizes across the entire component: one very large (>= 96px) and one very small (<= 12px)"
  - "Tolerance: distinct sizes within 4px of each pole are merged (96px and 100px count as the same 'huge')"
  - "No mid-range sizes (16px, 18px, 24px, 32px) permitted"
invariants:
  - "All visible text elements have computed font-size either >= 96px (huge) OR <= 12px (tiny), with no intermediate sizes"
  - "Distinct font-size cluster count (with 4px tolerance) MUST = 2"
conflict_set: ["caps-only", "text-as-shape", "display-as-sentence", "single-typeface"]
rationale: "The huge-or-tiny pose rejects modular type-scales (the 1.25x or 1.333x ratio Tailwind/Material default) in favor of brutal binary contrast. Visitor sees the headline 10× the body, which forces the body copy into footnote-like microtype. Common in fashion editorial (Pop Magazine, Aperture covers) and in deliberately confrontational web design."
examples: ["Pop Magazine 2024 covers (huge titles, microscopic body)", "Aperture book series 2025", "Eat Sleep Magazine 2025 web edition"]
---

# huge-or-tiny

Two type sizes only: one huge, one tiny. No middle ground. Forces
hierarchy to operate at the maximum ratio.

## Compliant patterns

```css
:root {
  --font-huge: 144px;
  --font-tiny: 11px;
}
h1, h2, h3 { font-size: var(--font-huge); line-height: 0.9; }
.metadata, .body, .caption { font-size: var(--font-tiny); }
```

## Non-compliant

```css
h1   { font-size: 64px; }   /* mid-range — banned */
body { font-size: 16px; }   /* mid-range — banned */
```

## Validation

Sample computed `font-size` of every visible text element. Cluster
sizes within 4px tolerance. Pass if cluster count = 2 AND one cluster
mean ≥ 96px AND the other ≤ 12px.
