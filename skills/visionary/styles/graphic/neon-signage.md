---
id: neon-signage
category: graphic
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [neon, signage, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Neon Signage

**Category:** graphic
**Motion tier:** Kinetic

## Typography
- **Display font:** Bungee — condensed, signage-forward, built for vertical and horizontal display
- **Body font:** Bungee Inline (for secondary) or system sans for readable body copy
- **Tracking:** 0.04em | **Leading:** 1.2

## Colors
- **Background:** #0A0A0A (night street)
- **Primary action:** #FF2D78 (neon pink)
- **Accent:** #00E5FF (neon cyan)
- **Elevation model:** colored glow shadows only; no neutral drop shadows

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 120, damping: 10 }` — loose flicker rhythm
- **Enter animation:** flicker-on: opacity pulses 0→0.6→0.3→1 over 400ms
- **Forbidden:** smooth linear fade, white backgrounds, serif body text

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 999px for pill shapes (tube glass); 0 for rectangular sign frames

## Code Pattern
```css
@keyframes neon-flicker {
  0%, 100% { opacity: 1; }
  4%        { opacity: 0.8; }
  8%        { opacity: 1; }
  15%       { opacity: 0.6; }
  20%       { opacity: 1; }
}

.neon-text {
  color: #FF2D78;
  text-shadow:
    0 0 7px #FF2D78,
    0 0 21px #FF2D78,
    0 0 42px rgba(255,45,120,0.6);
  animation: neon-flicker 3s infinite;
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
- Multi-layer text-shadow is mandatory — a single shadow layer reads as a CSS glow filter, not glass tube
- Never animate at a fixed 60fps-synced interval; irregular timing (3s, 2.7s, 4.1s) is what makes it feel analog
