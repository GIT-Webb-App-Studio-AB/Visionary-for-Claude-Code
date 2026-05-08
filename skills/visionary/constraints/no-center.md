---
id: no-center
category: layout
css_rules:
  - "ZERO use of text-align: center anywhere in the component"
  - "ZERO use of margin: 0 auto OR margin-inline: auto on text-bearing or major-content elements"
  - "Permitted: align-items: center on flex children for vertical alignment of small icons; this constraint targets HORIZONTAL center alignment only"
invariants:
  - "Among all visible text elements, ZERO have computed text-align = 'center'"
  - "Among all visible block-level elements with text content, ZERO have computed margin-inline-start = 'auto' AND margin-inline-end = 'auto'"
conflict_set: ["pixel-perfect-grid", "swiss-rationalism-strict", "asymmetry-only"]
rationale: "Centeritis (slop pattern #5 in SKILL.md) is the most-common amateur design tell: every text block centered on the page. Banning center-alignment forces the designer to commit to left- or right-aligned text and to use grid placement for composition rather than reflective symmetry. The constraint is unambiguous and post-validateable."
examples: ["Are.na editorial pages — never centered", "Linear marketing 2025 — left-aligned throughout", "Bottega Veneta web 2024"]
---

# no-center

No center-aligned text. No auto margins on text containers. Forces
the page to use directional alignment (start/end) and grid placement.

## Compliant patterns

```css
.headline { text-align: start; }   /* left in LTR, right in RTL */
.metadata { text-align: end; }
.footnote { text-align: justify; }
```

## Non-compliant

```css
.hero { text-align: center; max-width: 720px; margin: 0 auto; }  /* both bans hit */
```

## Validation

Walk all visible text elements. Pass if NONE have computed text-align =
'center'. Walk visible block-level elements with text content. Pass if
NONE have margin-inline-start = 'auto' AND margin-inline-end = 'auto'.
