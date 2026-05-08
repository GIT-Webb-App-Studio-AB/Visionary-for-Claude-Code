---
id: viewport-bleeds
category: form
css_rules:
  - "At least 2 sections must extend beyond the viewport using negative margin (margin-inline: calc(50% - 50vw)) OR width: 100vw with overflow-x: clip"
  - "Or use translate transforms that pull element bbox outside the document flow box"
  - "Bleeds must be intentional — flag negative margins applied to all elements as not-this-pattern (that's just full-bleed-mandatory)"
invariants:
  - "Count of sections where computed bbox.right > viewport.width OR bbox.left < 0 OR bbox.bottom > viewport.height MUST be >= 2"
  - "Bleed must be VISIBLE, not just ::before/::after pseudo-element"
conflict_set: ["swiss-rationalism-strict", "pixel-perfect-grid"]
rationale: "Containing every section inside a max-width is the safe-Swiss default. Letting sections leak across the viewport edge is how editorial print and brutalist web design break the screen-as-page metaphor. Bleeds force the eye to follow direction, suggest that the page continues beyond what's visible, and reject the mobile-first column-of-cards default. The pattern is dominant in NYT's interactive features and in any portfolio with art-direction ambitions."
examples: ["NYT Snowfall 2012 (proto)", "Federico Pian 2024 portfolio", "Are.na editorial pages 2025"]
---

# viewport-bleeds

Pull elements past the visible viewport edge — negative margins, calc-based
left/right offsets, or 100vw + overflow-x:clip. The page should feel larger
than the screen.

## Compliant patterns

```css
.full-bleed-image {
  margin-inline: calc(50% - 50vw);
  width: 100vw;
  max-width: none;
}

.tilted-quote {
  transform: translateX(8vw); /* leaks off the right edge */
}

.hero {
  width: calc(100% + 240px);
  margin-inline-start: -120px;
}
```

## Non-compliant

```css
.section { max-width: 1200px; margin-inline: auto; }
/* All sections respect the same max-width — no bleed */
```

## Validation

For each top-level section, compute bounding rect. Count sections where
`bbox.right > viewport.width` OR `bbox.left < 0`. Pass when count ≥ 2.
