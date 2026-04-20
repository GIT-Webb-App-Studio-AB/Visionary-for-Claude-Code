---
id: marine-nautical-chart
category: extended
motion_tier: Subtle
density: dense
locale_fit: [all]
palette_tags: [dark, light, editorial]
keywords: [marine, nautical, chart, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Marine Nautical Chart

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Gill Sans (or Futura) — maritime authority, used in NOAA and Admiralty charts
- **Body font:** Gill Sans Regular
- **Tracking:** 0.04em | **Leading:** 1.5

## Colors
- **Background:** #F0F4F8 (chart paper blue-white)
- **Primary action:** #1A2B5A (deep navy)
- **Accent:** #4A7A9B (coastal water blue)
- **Elevation model:** depth soundings as typography; no elevation shadows

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 200, damping: 28 }`
- **Enter animation:** fade 180ms ease-out; nautical charts are static reference documents
- **Forbidden:** dark backgrounds, warm colors, decorative flourishes, anything that compromises legibility

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; nautical charts use crisp rectilinear geometry

## Code Pattern
```css
.nautical-grid {
  background-color: #F0F4F8;
  background-image:
    linear-gradient(rgba(74, 122, 155, 0.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(74, 122, 155, 0.15) 1px, transparent 1px);
  background-size: 40px 40px;
}

.depth-label {
  font-family: 'Gill Sans', 'Futura', sans-serif;
  font-size: 0.65rem;
  color: #1A2B5A;
  letter-spacing: 0.04em;
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
- Chart grid lines must be blue-tinted (not neutral grey) — nautical charts use blue for water grid lines as a convention; grey grids read as spreadsheets
- Depth labels must use Gill Sans not a serif; maritime charts use sans-serif for all annotations for legibility at small sizes
