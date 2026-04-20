---
id: active-living-grid
category: modern
motion_tier: Expressive
density: dense
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [active, living, grid, modern]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Active / Living Grid

**Category:** modern
**Motion tier:** Expressive

## Typography
- **Display font:** Geist — engineered for data-dense environments
- **Body font:** Geist Regular
- **Tracking:** -0.01em | **Leading:** 1.4 | **Weight range:** 400/500/700

## Colors
- **Background:** #0A0A0A
- **Primary action:** #FFFFFF
- **Accent:** #3B82F6
- **Elevation model:** glow on active cells (0 0 0 1px rgba(59,130,246,0.4), 0 4px 16px rgba(59,130,246,0.15))

## Motion
- **Tier:** Expressive
- **Spring tokens:** `stiffness: 200, damping: 22` — responsive, data-reactive
- **Enter animation:** cell-pulse on data update (background flash → settle, 300ms)
- **Forbidden:** static states — cells should pulse, update, or indicate life

## Spacing
- **Base grid:** 8px; cell gap: 8px (tighter than bento — data density)
- **Border-radius vocabulary:** 8px standard; 4px for micro-data cells

## Code Pattern
```css
.living-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  background: #0A0A0A;
}
.living-cell {
  background: #111111;
  border: 1px solid #1F1F1F;
  border-radius: 8px;
  padding: 16px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.living-cell[data-active="true"] {
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 0 0 0 1px rgba(59,130,246,0.4), 0 4px 16px rgba(59,130,246,0.15);
}
@keyframes cell-update {
  0%   { background: #1E293B; }
  100% { background: #111111; }
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
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
Real-time implies actual updates — do not design a living grid with static placeholder data. The motion must be tied to genuine state changes. A grid that animates on a timer without data connection is theatrical, not functional.
