---
id: asymmetry-only
category: layout
css_rules:
  - "ZERO sections may have horizontally symmetric layout (i.e. content centered on the inline axis with equal margins)"
  - "Every section's content must be off-center: justify-content: flex-start | flex-end, OR grid placement that pushes content to one side"
  - "Permitted: heroes anchored left or right, asymmetric grid columns (e.g. grid-template-columns: 2fr 1fr)"
invariants:
  - "For every top-level section, computed bbox of dominant content has horizontal-center offset >= 10% from viewport-center"
  - "I.e. content_center_x is NOT in [0.45 * viewport.width, 0.55 * viewport.width]"
conflict_set: ["pixel-perfect-grid", "swiss-rationalism-strict", "no-center"]
rationale: "Symmetry is the safe-default — center-aligned hero, balanced columns, hero text on a centered axis. Asymmetric composition forces the designer to use weight, color, and direction to balance the page rather than mirror-reflection. Reference to Wim Crouwel and Hans Werner Marcks, where asymmetric posters carried a deliberate kinetic energy."
examples: ["Wim Crouwel posters 1970s", "Pentagram for Mozilla 2024", "Are.na editorial spreads 2025"]
---

# asymmetry-only

Every section's content sits off-center horizontally. No mirror-symmetric
compositions. Forces balance through weight and direction, not reflection.

## Compliant patterns

```css
.hero {
  display: grid;
  grid-template-columns: 1fr 2fr;   /* asymmetric grid */
  align-items: end;
}

.testimonial-section {
  display: flex;
  justify-content: flex-end;        /* content right-anchored */
  padding-inline: 0;
}
```

## Non-compliant

```css
.hero { text-align: center; max-width: 720px; margin: 0 auto; }  /* symmetric — banned */
```

## Validation

For each top-level section, find the dominant content (largest text or
image bbox). Compute center-x. Pass if for every section,
`abs(center_x - viewport.width/2) > 0.10 * viewport.width`.
