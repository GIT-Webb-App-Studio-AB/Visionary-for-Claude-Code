---
id: single-shape
category: form
css_rules:
  - "Pick exactly ONE of: circle, square, hexagon, triangle. ALL visible decorative shapes use that shape."
  - "Implementation via border-radius (50% for circle), aspect-ratio + clip-path for hexagon/triangle"
  - "Text containers and form fields are exempt — they use the chosen shape's bounding rule (e.g. circle → pill containers)"
invariants:
  - "All visible elements with role-decorative or aria-hidden=true match the chosen shape's clip-path / radius signature"
  - "Across the rendered DOM, the count of distinct decorative-shape signatures must equal 1"
conflict_set: ["fractured-edges", "organic-blob", "no-rectangles"]
rationale: "Constraining the entire shape vocabulary to one primitive is the formal opposite of the eclectic-muddled-brand-system slop. It forces a designer to find rhythm and hierarchy through size, color, and position alone — not through shape variety. References the early Stripe brand book (square-only with rounded corners) and Aesop's circle-only iconography. Most modern UIs default to a mix of rectangles + circles + chips, which reads as visually noisy without intent."
examples: ["Aesop apothecary brand — circle-only iconography", "Telegraph beta 2024 — hexagon-only metric chips"]
---

# single-shape

One shape, repeated. Forces formal coherence through obsessive-disciplined
repetition rather than through the typical "blocky cards + circle avatars +
pill chips" mash.

## Compliant patterns

```css
:root { --shape: 50%; } /* picked: circle */
.avatar  { border-radius: var(--shape); }
.metric  { border-radius: var(--shape); aspect-ratio: 1; }
.cta     { border-radius: 999px; }   /* pill — circle's bounding rule */
.card    { border-radius: 999px; }   /* still pill, never rounded-rect */
```

## Non-compliant

Any UI that uses a circle (avatar) AND a rounded-rect (card) AND a pill (chip)
in the same view violates — three shape signatures, not one.

## Validation

Cluster all visible elements by their `border-radius` shape-signature
(rect, rounded-rect, pill, circle, polygon-N). Count distinct signatures
in the visible viewport. Constraint passes when signature-count === 1.
