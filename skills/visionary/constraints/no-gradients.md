---
id: no-gradients
category: color
css_rules:
  - "ZERO use of linear-gradient(), radial-gradient(), conic-gradient(), or background-image: gradient(...)"
  - "Surfaces are either solid color OR an image, nothing in between"
  - "Text effects via gradient (background-clip: text + linear-gradient) are also banned"
invariants:
  - "Walking computed background-image of every visible element, NONE contains 'linear-gradient', 'radial-gradient', 'conic-gradient'"
  - "Walking computed color, NONE is set via background-clip: text trick (heuristic: color = transparent AND background-image contains gradient)"
conflict_set: ["risograph-bleed"]
rationale: "Gradient is the lazy continuous shading move — designers reach for it when they want depth without committing to either flat-color simplicity or photographic realism. A no-gradient constraint forces decisions: flat blocks of solid color, hard-edge color blocking, or photographic content. References the Swiss-International school where flat color was a discipline, and the brutalist web revival of the 2020s."
examples: ["Are.na 2025 — strict flat color blocking", "Brutalist web archive sites", "Mariko Mori 2024 portfolio"]
---

# no-gradients

Solid colors only. No linear, radial, or conic gradients anywhere — not
in backgrounds, not in text effects, not in border-image.

## Compliant patterns

```css
.cta { background: oklch(0.65 0.20 250); color: white; }
.hero-bg { background-color: oklch(0.97 0 0); }
.divider { background: oklch(0.55 0 0); inline-size: 100%; block-size: 1px; }
```

## Non-compliant

```css
.hero { background: linear-gradient(180deg, blue, purple); } /* banned */
.headline {
  background: linear-gradient(90deg, red, orange);
  background-clip: text;
  color: transparent;
} /* gradient text — banned */
```

## Validation

For each visible element, read computed `background-image`. Pass if
NONE contains 'gradient'. Also check the gradient-text trick by
flagging elements with `color: transparent` AND `background-image`
containing a gradient.
