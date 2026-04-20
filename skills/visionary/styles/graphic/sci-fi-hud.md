---
id: sci-fi-hud
category: graphic
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, neon, pastel, earth]
keywords: [sci, hud, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Sci-Fi HUD

**Category:** graphic
**Motion tier:** Kinetic

## Typography
- **Display font:** Orbitron — angular, screen-native, military-tech register
- **Body font:** Exo 2
- **Tracking:** 0.12em | **Leading:** 1.35

## Colors
- **Background:** #000810 (deep space black)
- **Primary action:** #00D4FF (HUD cyan)
- **Accent:** #FFB000 (amber alert)
- **Elevation model:** colored glow only; no neutral shadows

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 350, damping: 28 }`
- **Enter animation:** clip-path wipe left→right + fade, 300ms ease-out
- **Forbidden:** organic curves, warm colors, soft ease-in-out

## Spacing
- **Base grid:** 4px (dense data display)
- **Border-radius vocabulary:** 0px; all panels use polygon clip-paths

## Code Pattern
```css
.hud-panel {
  clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%);
  background: rgba(0, 212, 255, 0.06);
  border: 1px solid rgba(0, 212, 255, 0.4);
  box-shadow:
    0 0 20px rgba(0, 212, 255, 0.15),
    inset 0 0 20px rgba(0, 212, 255, 0.05);
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
- clip-path polygon must match border geometry exactly — a border-radius on a clip-path panel exposes the un-clipped rectangle beneath
- Orbitron at body-text sizes (< 14px) becomes unreadable; switch to Exo 2 for anything below display size
