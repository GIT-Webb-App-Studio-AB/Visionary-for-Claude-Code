---
id: negative-margin-mandatory
category: form
css_rules:
  - "At least 1 visible element MUST use negative margin (margin-top, margin-inline-start/end, etc) for layout-purpose, not visual-effect"
  - "The negative margin should be -16px or stronger to be considered intentional"
  - "Excluded: micro-tuning (e.g. -1px alignment fixes), shadows simulated via negative margin"
invariants:
  - "DOM contains at least one element with computed margin-top, margin-bottom, margin-inline-start, OR margin-inline-end <= -16px"
  - "And the element is positioned via the negative margin (visually overlaps preceding element)"
conflict_set: ["swiss-rationalism-strict", "pixel-perfect-grid", "single-column-strict"]
rationale: "Negative margin is the hand of the designer — it deliberately breaks the box-model's assumption that elements stack with non-overlapping flow. The pattern signals art-direction over framework defaults. Most modern frameworks (Tailwind, Material) treat negative margin as a code smell, which is exactly why using it here is the unconventional move."
examples: ["Wim Crouwel posters — overlapping forms", "early Apple.com 2003 product pages — negative-margin overlap of phone over backdrop"]
---

# negative-margin-mandatory

Force at least one element into deliberate overlap with its neighbors via
negative margin. Signals a designer pulled an element out of normal flow
on purpose.

## Compliant patterns

```css
.product-shot {
  margin-block-start: -120px;     /* overlaps the section above */
  position: relative;
  z-index: 2;
}

.testimonial-card {
  margin-block-end: -32px;        /* leaks down into the next section */
}

.hero-stamp {
  margin-inline-start: -64px;     /* pokes off the left edge */
}
```

## Non-compliant

A page where every element has positive or zero margin — the tell-tale
sign of "no designer involved, just a Tailwind utility chain".

## Validation

Walk visible elements; check computed margin-top/bottom/inline-start/end.
Pass if at least one has a value ≤ -16px AND the element visually overlaps
its preceding sibling.
