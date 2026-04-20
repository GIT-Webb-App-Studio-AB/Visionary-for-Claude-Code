---
id: biomorphic-futurism
category: graphic
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, organic]
keywords: [biomorphic, futurism, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Biomorphic Futurism

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Bricolage Grotesque — organic width variation, grown not engineered
- **Body font:** Bricolage Grotesque Regular
- **Tracking:** -0.01em | **Leading:** 1.6

## Colors
- **Background:** #0A1A0E (biopunk dark green)
- **Primary action:** #39FF14 (bioluminescent green)
- **Accent:** #7FFF00 (chlorophyll lime)
- **Elevation model:** organic ambient glow; no geometric shadows

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 140, damping: 14 }` — organic, living bounce
- **Enter animation:** morph from blob shape to final form, 400ms ease-in-out
- **Forbidden:** rigid geometry, monospace type, mechanical easing (linear)

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** variable via SVG path; avoid fixed radius values

## Code Pattern
```css
.biomorph-panel {
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  background: rgba(57, 255, 20, 0.08);
  border: 1px solid rgba(57, 255, 20, 0.3);
  animation: biomorph 8s ease-in-out infinite;
}

@keyframes biomorph {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  50%       { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
}
```

## Accessibility

### Contrast
Body text must clear 4.5:1 (WCAG 2.2 AA) AND APCA Lc ≥ 75. Large text / UI labels: 3:1 and Lc ≥ 60. Run axe-core + apca-w3 during the critique loop.

### Focus
Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.

### Motion
This style exposes motion that can run longer than 5 seconds. Ship a visible pause/stop control bound to `animation-play-state` (CSS) or the JS equivalent — required by WCAG 2.2.2 (Level A). Also degrade to opacity-only transitions under `prefers-reduced-motion: reduce`.

### Touch target
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
- The border-radius morph animation must use matching vertex counts in both keyframes — mismatched values cause non-interpolating hard cuts
- Bioluminescent green (#39FF14) on a dark bg has contrast ratio ~9:1 which is fine; never lighten the background to > #1A2E1E or contrast fails
