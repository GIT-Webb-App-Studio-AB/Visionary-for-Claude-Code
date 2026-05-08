---
id: no-rectangles
category: form
css_rules:
  - "border-radius >= 12px on all visible elements (any axis variation acceptable)"
  - "OR clip-path: polygon(...) / path(...) for non-rectangular silhouettes"
  - "OR border-radius shorthand with 4 distinct values for organic blob silhouettes"
invariants:
  - "ZERO elements with computed border-radius < 12px AND aspect ratio close to rectangular (within 10% of 1:1, 16:9, 4:3, 3:2, 21:9)"
  - "Visible block-level elements with bbox.width >= 64 AND bbox.height >= 64 must satisfy the rule (decorative dots and 1px dividers are exempt)"
conflict_set: ["pixel-perfect-grid", "swiss-rationalism-strict", "every-section-breaks-grid"]
rationale: "Right angles are the default cognitive lazy-form. Removing them forces the designer to pick a non-default shape language — circles, hexagons, organic blobs, sliced polygons. The constraint is post-validateable through computed border-radius traversal so it cannot be smuggled in as 'inspired-by-rounded' vibe. References include Bruno Simon 2026, the Things 3 OS-app silhouette set, and the early-2020s neumorphism revival's pill aesthetic."
examples: ["Bruno Simon portfolio 2026", "Things 3 macOS app — every surface is rounded-rect or pill"]
---

# no-rectangles

A hard ban on default rectangular silhouettes. Forces every visible surface
into an organic, rounded, or polygon-clipped form. The cheapest way to comply
is `border-radius: 12px` on everything, but that produces the "rounded
everything" slop pattern (see SKILL.md slop detection rule 3) — so the
critic should also reward variation in radius across surfaces.

## Compliant patterns

```css
/* Pill button */
.cta { border-radius: 999px; }

/* Organic blob hero */
.hero { border-radius: 50% 30% 70% 40% / 60% 30% 70% 40%; }

/* Sliced polygon */
.card { clip-path: polygon(0 12px, 100% 0, 100% calc(100% - 12px), 0 100%); }
```

## Non-compliant

```css
.card { border-radius: 8px; }   /* Below the 12px floor */
.card { /* no radius */ }       /* Sharp corners — banned */
```

## Validation

The validator reads computed `border-radius` per element. Any element with
`border-radius < 12px` AND no `clip-path` AND `aspect_ratio ∈ {1:1, 16:9, 4:3, 3:2, 21:9}` (±10%)
is a violation.
