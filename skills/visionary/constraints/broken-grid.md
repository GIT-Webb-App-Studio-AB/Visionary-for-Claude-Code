---
id: broken-grid
category: layout
css_rules:
  - "At least 1 visible element MUST break the visual grid via rotation >= 30deg OR via offset >= 40% from its normal grid cell position"
  - "Implementation via transform: rotate(...) OR transform: translate(...) on a grid-positioned element"
  - "The element should appear visually 'wrong' — pulled out of alignment intentionally"
invariants:
  - "DOM contains at least 1 element with computed transform containing rotate >= 30deg OR translate distance >= 40% of element's parent dimension"
conflict_set: ["pixel-perfect-grid", "swiss-rationalism-strict", "single-column-strict"]
rationale: "A single broken element in an otherwise-aligned grid is the contemporary editorial design move that tells the viewer 'a person made decisions here'. Pioneered by experimental magazine layouts (Émigré, Ray Gun), now common in art-direction-led portfolios and brand microsites. The constraint specifies a numeric threshold (≥30°, ≥40% offset) to prevent compliance via 0.5° micro-tilts."
examples: ["Émigré 1990s", "Pentagram MoMA exhibition microsite 2024", "Federico Pian portfolio 2025"]
---

# broken-grid

One element pulled out of alignment with the rest of the grid via
significant rotation or offset. The deliberate misalignment carries
the design's hand-feel.

## Compliant patterns

```css
.testimonial-card {
  transform: rotate(-4deg);        /* below threshold — non-compliant */
}

/* Compliant — meets the >= 30deg or >= 40% rule */
.angled-stamp {
  transform: rotate(-12deg) translate(40%, 0);
}

.broken-card {
  grid-column: 2;
  transform: translateY(50%);
}
```

## Non-compliant

A perfectly-aligned grid where every card sits in its cell with 0°
rotation. Compliant per CSS but fails the constraint.

## Validation

Walk visible elements. Read computed transform. Decompose into rotate
and translate components. Pass if at least one element has either:
- rotation magnitude ≥ 30°, OR
- translate magnitude ≥ 40% of parent's bbox dimension on the same axis.
