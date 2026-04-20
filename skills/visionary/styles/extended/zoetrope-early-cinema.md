---
id: zoetrope-early-cinema
category: extended
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, earth]
keywords: [zoetrope, early, cinema, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Zoetrope Early Cinema

**Category:** extended
**Motion tier:** Kinetic

## Typography
- **Display font:** Playfair Display — Victorian era print authority
- **Body font:** Playfair Display Regular
- **Tracking:** 0.02em | **Leading:** 1.55

## Colors
- **Background:** #D4C4A8 (sepia photograph)
- **Primary action:** #1A1008 (darkroom black)
- **Accent:** #8B6340 (projected light amber)
- **Elevation model:** projection light cone; radial gradient from center

## Motion
- **Tier:** Kinetic
- **Spring tokens:** N/A — frame-based stepping, not spring physics
- **Enter animation:** film-flicker — step-based opacity variation at 12fps (1900s projection rate)
- **Forbidden:** smooth motion blur, color, digital-clean rendering

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; film frames are rectangular; zoetrope slots are rectangular

## Code Pattern
```css
@keyframes film-flicker {
  0%   { opacity: 1; filter: sepia(0.8) brightness(0.95); }
  25%  { opacity: 0.9; filter: sepia(0.9) brightness(1.05); }
  50%  { opacity: 1; filter: sepia(0.7) brightness(0.9); }
  75%  { opacity: 0.95; filter: sepia(0.85) brightness(1); }
  100% { opacity: 1; filter: sepia(0.8) brightness(0.95); }
}

.film-frame {
  animation: film-flicker 0.083s steps(1) infinite; /* 12fps step */
  filter: sepia(0.8);
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
- Film flicker must use `steps(1)` timing — smooth opacity transitions are modern and destroy the analog frame projection reference
- Sepia filter value must stay 0.7–0.9; full sepia (1.0) reads as a CSS filter effect, not aged photographic emulsion
