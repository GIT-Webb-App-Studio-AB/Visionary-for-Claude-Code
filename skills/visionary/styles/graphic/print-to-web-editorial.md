---
id: print-to-web-editorial
category: graphic
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [neon, editorial]
keywords: [print, web, editorial, hybrid]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Print to Web Editorial

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** Playfair Display — high-contrast serif maintains print authority in web context
- **Body font:** Source Serif 4
- **Tracking:** -0.01em | **Leading:** 1.65

## Colors
- **Background:** #F5F0E8 (newsprint warm)
- **Primary action:** #1A1008 (ink black)
- **Accent:** #8B1A1A (editorial red)
- **Elevation model:** subtle drop shadows; no glow

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 180, damping: 28 }`
- **Enter animation:** fade-in 200ms ease-out
- **Forbidden:** bounce, scale pop, neon glow

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–2px; editorial discipline, no rounding

## Code Pattern
```css
.editorial-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.editorial-lead {
  grid-column: 1 / 8;
  font-family: 'Playfair Display', Georgia, serif;
}

.editorial-sidebar {
  grid-column: 9 / 13;
  border-left: 1px solid #C8B89A;
  padding-left: 20px;
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
- Print column layouts require CSS Grid — float-based or flexbox multi-column layouts lose typographic precision at narrow viewports
- Never mix the editorial serif display with a sans-serif body; the tonal clash defeats the broadsheet register
