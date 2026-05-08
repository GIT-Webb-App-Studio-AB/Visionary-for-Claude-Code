---
id: organic-blob
category: form
css_rules:
  - "At least 1 hero-level element uses border-radius shorthand with 4 distinct percentage values for both axes — e.g. 'border-radius: 50% 30% 70% 40% / 60% 30% 70% 40%'"
  - "OR uses path()-based clip-path with at least 5 control points for a non-geometric silhouette"
invariants:
  - "DOM contains at least one element where all 8 corner-radius values (4 horizontal + 4 vertical) are distinct AND each value is a percentage in the 20%-80% range"
  - "Element bbox.area >= 65,536px² (256x256 minimum) to count as 'hero-level'"
conflict_set: ["pixel-perfect-grid", "swiss-rationalism-strict", "single-shape", "fractured-edges"]
rationale: "The organic blob — a non-geometric, hand-feel silhouette — is the canonical move of post-2020 illustration-driven web design. It's the antidote to the rounded-rectangle-and-pill duopoly. The constraint requires 4 distinct percentage values per axis to prevent the lazy 'all-50%' (= circle) shortcut, forcing the generator to commit to a real organic shape."
examples: ["Stripe Sigma marketing 2024 — blob silhouettes for analytics dashboard previews", "Headspace meditation app — blob containers for mood states"]
---

# organic-blob

A hero-level element with a non-geometric, organic silhouette. The shape
should look hand-drawn, not mathematical.

## Compliant patterns

```css
.hero-blob {
  border-radius: 50% 30% 70% 40% / 60% 30% 70% 40%;
  inline-size: min(560px, 50vw);
  aspect-ratio: 1.2;
}

/* Path-based version */
.hero-svg-mask {
  clip-path: path('M40,40 Q200,0 360,40 Q400,200 360,360 Q200,400 40,360 Z');
}
```

## Non-compliant

```css
.hero { border-radius: 50%; }    /* circle — too geometric */
.hero { border-radius: 24px; }   /* rounded-rect, not blob */
```

## Validation

Find hero-sized elements (area ≥ 65,536px²). For each, parse the
`border-radius` longhand into 8 values. Pass if at least one element has
8 distinct percentage values, each in [20%, 80%].
