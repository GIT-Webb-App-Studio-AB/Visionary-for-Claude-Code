---
id: bento-grid
category: modern
motion_tier: Expressive
density: dense
locale_fit: [all]
palette_tags: [light, neon]
keywords: [bento, grid, modern]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 24
---

# Bento Grid

**Category:** modern
**Motion tier:** Expressive

## Typography
- **Display font:** Bricolage Grotesque — contemporary variable, engineered personality
- **Body font:** Bricolage Grotesque Regular
- **Tracking:** -0.01em | **Leading:** 1.4 | **Weight range:** 400/600/800

## Colors
- **Background:** #F4F4F5
- **Primary action:** #18181B
- **Accent:** #FFFFFF (card surfaces)
- **Elevation model:** subtle shadows (0 1px 3px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06))

## Motion
- **Tier:** Expressive
- **Spring tokens:** `stiffness: 180, damping: 20` — layout-aware spring
- **Enter animation:** stagger (each cell fades + translateY(16px) → 0, 60ms apart, starting cell 0)
- **Forbidden:** all-identical cell sizes, uniform animation timing (stagger required)

## Spacing
- **Base grid:** 8px; cell gap: 16px
- **Border-radius vocabulary:** 16px standard cells; 24px for hero/featured cells

## Code Pattern
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 160px;
  gap: 16px;
}
.bento-cell { background: #FFFFFF; border-radius: 16px; padding: 24px; }
.bento-cell--2x1 { grid-column: span 2; }
.bento-cell--1x2 { grid-row: span 2; }
.bento-cell--2x2 { grid-column: span 2; grid-row: span 2; border-radius: 24px; }
/* Stagger entry */
.bento-cell:nth-child(1) { animation-delay: 0ms; }
.bento-cell:nth-child(2) { animation-delay: 60ms; }
.bento-cell:nth-child(3) { animation-delay: 120ms; }
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
Do not make all cells identical size — the bento aesthetic requires irregular cell sizes (1×1, 2×1, 1×2, 2×2). A grid of equal rectangles is just a grid, not bento. Vary cell spans to create visual rhythm and hierarchy.
