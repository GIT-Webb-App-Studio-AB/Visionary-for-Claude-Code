---
id: cosmic-astronomical
category: graphic
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [cosmic, astronomical, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Cosmic Astronomical

**Category:** graphic
**Motion tier:** Kinetic

## Typography
- **Display font:** Space Grotesk — the name is apt; geometric precision for celestial scale
- **Body font:** Space Grotesk Regular
- **Tracking:** 0.04em | **Leading:** 1.5

## Colors
- **Background:** #00010D (deep space indigo-black)
- **Primary action:** #FFFFFF (star white)
- **Accent:** #9B59FF (nebula violet)
- **Elevation model:** radial glow emanation; no hard shadows

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 60, damping: 12 }` — slow, orbital drift
- **Enter animation:** scale 0 → 1 from center with nebula-purple glow bloom, 800ms ease-out
- **Forbidden:** warm tones, hard edges, fast snap animations

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 999px for celestial bodies; 0 for viewport panels

## Code Pattern
```css
.nebula-glow {
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(155, 89, 255, 0.3) 0%,
    rgba(0, 1, 13, 0) 70%
  );
  animation: nebula-pulse 6s ease-in-out infinite alternate;
}

@keyframes nebula-pulse {
  from { opacity: 0.6; transform: scale(1); }
  to   { opacity: 1;   transform: scale(1.08); }
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
- The nebula pulse must use `ease-in-out` with a duration ≥ 5s — faster pulses read as UI interaction feedback, not cosmic breathing
- Star-field backgrounds must be CSS/canvas, not a JPEG — JPEG compression artifacts break the point-light illusion
