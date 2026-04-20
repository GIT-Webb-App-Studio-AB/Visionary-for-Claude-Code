---
id: coastal-grandmother
category: extended
motion_tier: Subtle
density: sparse
locale_fit: [all]
palette_tags: [dark, neon, pastel, editorial]
keywords: [coastal, grandmother, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Coastal Grandmother

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Lora — warm serif with a lived-in quality
- **Body font:** Source Serif 4
- **Tracking:** 0.005em | **Leading:** 1.7

## Colors
- **Background:** #F5F0E8 (linen)
- **Primary action:** #3D5A7A (faded navy)
- **Accent:** #6B9E9F (sea glass)
- **Elevation model:** soft ambient shadows; sun-bleached, no sharp contrasts

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 160, damping: 28 }` — unhurried, like a summer afternoon
- **Enter animation:** gentle drift — fade + 4px Y, 350ms ease-out
- **Forbidden:** bright saturated colors, fast animations, hard edges, dark modes

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8–16px; sun-worn surfaces have gentle curves

## Code Pattern
```css
.coastal-card {
  background: #F5F0E8;
  border: 1px solid rgba(107, 158, 159, 0.3);
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(61, 90, 122, 0.08);
  padding: 32px;
}

.coastal-accent-line {
  border-top: 2px solid #D4B896; /* sand */
  margin: 24px 0;
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
- Colors must be desaturated (HSL saturation ≤ 40%) — vibrant colors break the sun-faded, gentle register of this aesthetic
- Sea glass accent must not appear on more than 20% of UI surface; it is a detail color, not a dominant
