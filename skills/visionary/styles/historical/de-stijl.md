---
id: de-stijl
category: historical
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [stijl, historical]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# De Stijl

**Category:** historical
**Motion tier:** Subtle

## Typography
- **Display font:** Futura — geometric purity aligns with neoplastic philosophy
- **Body font:** Futura Book
- **Tracking:** 0.02em | **Leading:** 1.3 | **Weight range:** 400/700

## Colors
- **Background:** #FFFFFF
- **Primary action:** #FF0000
- **Accent:** #0000FF
- **Elevation model:** none — color planes are structure

## Motion
- **Tier:** Subtle
- **Spring tokens:** `stiffness: 350, damping: 35`
- **Enter animation:** fade 100ms linear
- **Forbidden:** diagonal elements, curves, organic shapes, gradients

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px — absolute; circles and curves are categorically forbidden

## Code Pattern
```css
.destijl-composition {
  display: grid;
  grid-template-columns: 3fr 1fr;
  grid-template-rows: auto 8px auto;
  gap: 0;
}
.destijl-divider {
  background: #000000;
  height: 8px;
  grid-column: 1 / -1;
}
.destijl-block-red   { background: #FF0000; }
.destijl-block-blue  { background: #0000FF; }
.destijl-block-yellow { background: #FFFF00; }
```

## Accessibility

### Contrast
Body text must clear 4.5:1 (WCAG 2.2 AA) AND APCA Lc ≥ 75. Large text / UI labels: 3:1 and Lc ≥ 60. Run axe-core + apca-w3 during the critique loop.

### Focus
Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.

### Motion
Under `prefers-reduced-motion: reduce`, keep opacity transitions but drop transform/scale/translate — transform is a vestibular trigger. No autoplay exceeds 5 s without a pause control.

### Touch target
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
Strict horizontals and verticals only. The moment a diagonal appears, it is no longer De Stijl. No gradients between color blocks — they must be pure, flat, and separated by black lines.
