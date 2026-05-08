---
id: risograph-bleed
category: color
css_rules:
  - "At least 1 pair of colored shapes MUST visually overlap with mix-blend-mode: multiply OR mix-blend-mode: difference, producing a third color in the overlap region"
  - "Implementation: two shapes with semi-transparent or pure-color backgrounds, positioned to overlap, with mix-blend-mode set"
  - "The 'bleed' is the printer's misregistration aesthetic where two plates don't perfectly align"
invariants:
  - "DOM contains at least 2 elements with computed mix-blend-mode in {multiply, screen, difference, overlay}"
  - "The 2 elements must visually overlap (intersection-area > 0)"
conflict_set: ["no-gradients", "single-color", "monochrome-only"]
rationale: "Risograph printing produces a characteristic mis-registration where two color plates don't perfectly align, creating overprint zones where the colors visibly mix. Reproducing this digitally requires mix-blend-mode: multiply on overlapping shapes. The aesthetic dominates contemporary zine and indie-publishing design, and is associated with hand-craft authenticity as opposed to vector-perfect Adobe defaults."
examples: ["Riso Press output 2024-25", "Are.na's risograph-tagged channels", "Aaron Lowell Denton portfolio — overprint bleeds throughout"]
---

# risograph-bleed

Visible color-overprint where two shapes overlap with mix-blend-mode.
Reproduces the printer-misregistration aesthetic of risograph zines.

## Compliant patterns

```css
.shape-a {
  position: absolute;
  inline-size: 320px;
  block-size: 320px;
  background: oklch(0.78 0.15 196);  /* cyan */
  mix-blend-mode: multiply;
}

.shape-b {
  position: absolute;
  inset-inline-start: 200px;
  inline-size: 320px;
  block-size: 320px;
  background: oklch(0.66 0.27 0);    /* magenta */
  mix-blend-mode: multiply;
}
/* Overlap zone visually becomes dark blue/navy — the bleed */
```

## Non-compliant

A page with two non-overlapping color blocks side-by-side: no
overprint, no bleed, fails.

## Validation

Find all elements with `mix-blend-mode` in {multiply, screen, difference,
overlay}. Pair them up. Pass if at least one pair has bbox-intersection
area > 0.
