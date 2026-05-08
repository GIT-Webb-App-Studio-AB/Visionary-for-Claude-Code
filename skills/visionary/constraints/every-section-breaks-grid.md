---
id: every-section-breaks-grid
category: layout
css_rules:
  - "EVERY top-level section must use a different grid configuration (different column count, different alignment, different gap)"
  - "No common grid that all sections share — each section is bespoke"
  - "Implementation: each section has its own grid-template-columns, gap, and align-items, with no shared utility"
invariants:
  - "Among visible top-level sections, the count of distinct (grid-template-columns, gap, align-items) tuples MUST equal the number of sections"
conflict_set: ["pixel-perfect-grid", "swiss-rationalism-strict", "no-rectangles"]
rationale: "A shared grid system is the default Tailwind/Material approach: every section has 12 columns, 1.5rem gap, etc. Forcing every section to use a different grid means there's no shared rhythm — each section stands as its own composition. The pattern is dominant in art-direction-driven editorial sites and in brand microsites where each section is treated as a poster."
examples: ["Pentagram microsites — every section is a poster", "Are.na editorial channels 2024-25", "Federico Pian portfolio 2025"]
---

# every-section-breaks-grid

Every top-level section uses a unique grid configuration. No shared
rhythm — each section is composed individually.

## Compliant patterns

```css
.hero       { display: grid; grid-template-columns: 1fr 2fr; gap: 24px; }
.featured   { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.about      { display: grid; grid-template-columns: 7fr 5fr; gap: 96px; align-items: end; }
.testimonials { display: grid; grid-template-columns: 2fr 1fr 4fr; gap: 16px; }
.footer     { display: flex; justify-content: space-between; }
```

## Non-compliant

```css
.section { display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; }
/* All sections share — banned */
```

## Validation

Walk top-level sections. Read computed `grid-template-columns`, `gap`,
`align-items`. Pass if the set of distinct (cols, gap, align) tuples
equals the section count.
