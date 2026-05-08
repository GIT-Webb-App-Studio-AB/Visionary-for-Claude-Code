---
id: fractured-edges
category: form
css_rules:
  - "Each visible block-level element MUST declare border-radius with at least 2 distinct corner values"
  - "Acceptable shorthand: 'border-radius: 24px 0 24px 0' (top-left + bottom-right rounded, top-right + bottom-left sharp)"
  - "Or full 4-value: 'border-radius: 4px 32px 8px 24px'"
invariants:
  - "Each element with bbox.width >= 64 AND bbox.height >= 64 has computed border-top-left-radius != border-top-right-radius OR border-bottom-left-radius != border-bottom-right-radius"
  - "Detected by reading the four corner-radius computed-style values per element"
conflict_set: ["pixel-perfect-grid", "swiss-rationalism-strict", "single-shape"]
rationale: "Asymmetric corner-radius creates visible direction and motion in static composition without any animation. The pattern is dominant in early-2020s editorial design (Pentagram's Mozilla rebrand, Decathlon's product cards) and signals a deliberate hand. The constraint is the inverse of the 'rounded everything' slop pattern — same radius on every corner is the lazy form, fractured radius is the considered form."
examples: ["Pentagram for Mozilla 2024", "Decathlon product cards 2025", "Substack post-cards experimental layout 2026"]
---

# fractured-edges

Each block has a visible asymmetric corner profile. Top-left and bottom-right
might be heavily rounded; top-right and bottom-left sharp. Or all four corners
have different radii. Forces composition to acknowledge directional flow.

## Compliant patterns

```css
.card-a { border-radius: 32px 0 32px 0; }       /* TL+BR rounded */
.card-b { border-radius: 0 32px 0 32px; }       /* TR+BL rounded */
.card-c { border-radius: 4px 32px 8px 24px; }   /* all four distinct */
.hero   { border-radius: 64px 8px 64px 8px; }
```

## Non-compliant

```css
.card { border-radius: 12px; }    /* uniform — banned */
.card { border-radius: 12px 12px 12px 12px; }  /* same problem */
```

## Validation

For each visible block (bbox.width × bbox.height >= 4096px²), read all four
corner-radius computed-style values. Constraint passes when at least one
adjacent corner pair has different values.
