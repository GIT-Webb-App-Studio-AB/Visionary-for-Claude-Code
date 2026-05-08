---
id: text-as-shape
category: form
css_rules:
  - "At least 1 typography element with computed font-size >= 12vw OR >= 192px"
  - "AND/OR with transform: rotate/skew applied (>= 5deg)"
  - "AND/OR text-stroke instead of fill (text-decoration: outline / -webkit-text-stroke)"
invariants:
  - "DOM contains at least one heading-like element (h1-h3, [role=heading]) where computed font-size >= 192px OR transform contains rotate/skew >= 5deg"
  - "Element must be visible (not aria-hidden)"
conflict_set: ["caps-only", "huge-or-tiny"]
rationale: "Type-as-image is the post-Bauhaus, post-Karel-Martens move that turns letters into compositional matter. The huge-display headline is one of the highest-bandwidth signals a page can carry — it tells the visitor the design has been art-directed, not template-assembled. The constraint forces the generator to commit visually rather than retreating to safe 64px serif h1."
examples: ["Aaron Lowell Denton 2024 portfolio — 280px display caps as decorative wallpaper", "Bauhaus Dessau exhibitions 2025 — rotated lowercase as graphic element"]
---

# text-as-shape

Treat at least one typographic element as a graphic shape, not as readable
copy. Huge display sizes, rotation, skew, or stroked outlines convert text
from communication into composition.

## Compliant patterns

```css
.hero-headline {
  font-size: clamp(192px, 18vw, 480px);
  letter-spacing: -0.04em;
  line-height: 0.85;
}

.tilted-stamp {
  font-size: 220px;
  transform: rotate(-7deg);
}

.outline-display {
  font-size: 240px;
  -webkit-text-stroke: 2px currentColor;
  color: transparent;
}
```

## Non-compliant

```css
h1 { font-size: 64px; }   /* below the floor */
.headline { transform: rotate(2deg); }  /* too subtle, < 5deg */
```

## Validation

Find heading elements. Check if any has computed font-size ≥ 192px OR a
transform with rotate/skew ≥ 5deg.
