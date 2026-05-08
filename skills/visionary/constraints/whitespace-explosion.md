---
id: whitespace-explosion
category: layout
css_rules:
  - "At least 1 section MUST have >= 40vh of contiguous empty/whitespace area"
  - "Implementation via padding-block: 40vh on a section, OR via min-height: 100vh on a section with a single small element"
  - "The empty area must be DELIBERATE — not just a section with low content density"
invariants:
  - "DOM contains at least 1 section where (section.bbox.height - sum(visible-children.bbox.height)) >= 0.4 * viewport.height"
  - "i.e. the section has at least 40% of viewport height as empty space"
conflict_set: ["pixel-perfect-grid"]
rationale: "Massive whitespace is luxury's typographic move. Apple, Aesop, The Row leave huge empty zones around hero content because the absence is the message: this brand is confident enough to use the most expensive resource (space) without filling it. Tailwind's default density anti-pattern is to fill every screen with content; this constraint inverts."
examples: ["Apple iPhone reveal pages 2024-25", "Aesop product pages — whitespace dominates", "Bottega Veneta hero zones 2025"]
---

# whitespace-explosion

At least one section dedicates 40vh+ to deliberate emptiness. The
absence is the design statement — confident restraint over
content-density.

## Compliant patterns

```css
.hero {
  min-block-size: 100vh;
  display: grid;
  place-items: end start;          /* tiny content, anchored to corner */
  padding: 64px;
}

.hero h1 {
  font-size: 56px;                 /* small content → big void */
  max-inline-size: 360px;
}
```

## Non-compliant

A section densely packed with cards, paragraphs, and CTAs leaving
< 40vh of empty space.

## Validation

Walk top-level sections. For each, sum the bboxes of visible children.
Subtract from the section's own bbox.height. Pass if at least one
section has empty-area ≥ 0.4 × viewport.height.
