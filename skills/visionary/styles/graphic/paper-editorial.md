---
id: paper-editorial
category: graphic
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [light, neon, editorial]
keywords: [paper, editorial, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: static
  touch_target: 44
---

# Paper Editorial

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** Playfair Display — high-contrast serif evokes broadsheet authority
- **Body font:** Source Serif 4
- **Tracking:** -0.01em | **Leading:** 1.65

## Colors
- **Background:** #F5F0E8 (newsprint)
- **Primary action:** #1A1008 (ink black)
- **Accent:** #8B1A1A (editorial red)
- **Elevation model:** subtle drop shadows, no glow

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 180, damping: 28 }`
- **Enter animation:** fade-in 200ms ease-out
- **Forbidden:** bounce, scale pop, neon glow

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–2px only; editorial content uses no rounding

## Code Pattern
```css
.editorial-layout {
  column-count: 2;
  column-gap: 40px;
  column-rule: 1px solid #C8B89A;
  orphans: 3;
  widows: 3;
}
```

## Accessibility

### Contrast
Body text must clear 4.5:1 (WCAG 2.2 AA) AND APCA Lc ≥ 75. Large text / UI labels: 3:1 and Lc ≥ 60. Run axe-core + apca-w3 during the critique loop.

### Focus
Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.

### Motion
No animation by default; static entry and state changes. `prefers-reduced-motion` is already honored because there is nothing to reduce.

### Touch target
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
- Avoid web-safe Garamond fallbacks — load Playfair Display properly or the display contrast collapses
- Never apply border-radius > 2px; rounded cards destroy the broadsheet register
