---
id: data-visualization
category: modern
motion_tier: Subtle
density: dense
locale_fit: [all]
palette_tags: [dark, earth]
keywords: [data, visualization, modern]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 24
---

# Data Visualization

**Category:** modern
**Motion tier:** Subtle

## Typography
- **Display font:** DM Sans — neutral, legible, numeric-capable
- **Body font:** DM Sans Regular
- **Tracking:** 0em | **Leading:** 1.4 | **Weight range:** 400/500/700; tabular-nums mandatory

## Colors
- **Background:** #0D1117
- **Primary action:** #58A6FF
- **Accent:** #3FB950
- **Elevation model:** none — chart surfaces at #161B22; axis lines at rgba(255,255,255,0.1)

## Motion
- **Tier:** Subtle
- **Spring tokens:** `stiffness: 300, damping: 30` — precise, no overshoot on data transitions
- **Enter animation:** draw-in for lines (stroke-dashoffset), grow-up for bars (scaleY from bottom)
- **Forbidden:** decorative motion, 3D chart effects, shadows on chart elements

## Spacing
- **Base grid:** 8px; chart padding: minimum 40px top, 24px sides for label clearance
- **Border-radius vocabulary:** 2px for bar chart bars; 0px for everything else

## Code Pattern
```css
.dataviz-number {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
  font-size: 2rem;
  font-weight: 700;
  color: #58A6FF;
}
.dataviz-surface {
  background: #161B22;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 24px;
}
.dataviz-axis-label {
  font-size: 0.75rem;
  fill: rgba(255, 255, 255, 0.5);
  font-family: 'DM Sans', sans-serif;
}
```

## Accessibility

### Contrast
Body text must clear 4.5:1 (WCAG 2.2 AA) AND APCA Lc ≥ 75. Large text / UI labels: 3:1 and Lc ≥ 60. Run axe-core + apca-w3 during the critique loop.

### Focus
Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.

### Motion
Under `prefers-reduced-motion: reduce`, keep opacity transitions but drop transform/scale/translate — transform is a vestibular trigger. No autoplay exceeds 5 s without a pause control.

### Touch target
Touch targets may drop to 24×24 px (WCAG 2.5.8 floor) because this style is information-dense by design. Document the density in the brief so the critic doesn't flag it.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
Tabular-nums is non-negotiable — numbers in data tables that shift width as values change destroy scanability. Apply `font-variant-numeric: tabular-nums` universally to all metric displays. Never use proportional figures in a data context.
