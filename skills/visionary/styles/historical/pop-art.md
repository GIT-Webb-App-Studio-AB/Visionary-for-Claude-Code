---
id: pop-art
category: historical
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, editorial]
keywords: [pop, art, historical]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Pop Art

**Category:** historical
**Motion tier:** Kinetic

## Typography
- **Display font:** Futura Bold — commercial, democratic, off-the-shelf
- **Body font:** Futura Medium
- **Tracking:** 0.02em | **Leading:** 1.2 | **Weight range:** 700/900

## Colors
- **Background:** #FFFF00
- **Primary action:** #FF0000
- **Accent:** #0000FF
- **Elevation model:** hard offset shadows (4px 4px 0 #000000) — comic book depth

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `stiffness: 250, damping: 15` — punchy, snappy
- **Enter animation:** pop-in (scale 0.5 → 1.08 → 1, 300ms cubic-bezier(0.34,1.56,0.64,1))
- **Forbidden:** subtle palettes, refined gradients, editorial spacing

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px primary; 50% for circular Ben Day dot elements only

## Code Pattern
```css
.pop-art-card {
  background: #FFFFFF;
  border: 3px solid #000000;
  box-shadow: 6px 6px 0 #000000;
  padding: 32px;
}
.pop-art-dot-bg {
  background-image: radial-gradient(circle, #FF0000 30%, transparent 30%);
  background-size: 12px 12px;
  opacity: 0.15;
}
.pop-art-speech-bubble {
  position: relative;
  background: #FFFF00;
  border: 3px solid #000000;
  border-radius: 16px;
  padding: 16px 24px;
  font-weight: 900;
  text-transform: uppercase;
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
Ben Day dots are the signature — without them it is just primary-color flat design. The dots must be visible at normal reading distance (12–16px pattern size). Hard offset shadows at exactly 4–6px are required, not approximate.
