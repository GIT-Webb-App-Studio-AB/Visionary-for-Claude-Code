---
id: memphis
category: historical
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, pastel]
keywords: [memphis, historical]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Memphis

**Category:** historical
**Motion tier:** Kinetic

## Typography
- **Display font:** Futura Heavy — bold, geometric, unapologetically loud
- **Body font:** Futura Medium
- **Tracking:** 0em | **Leading:** 1.2 | **Weight range:** 700/900

## Colors
- **Background:** #FFFFFF
- **Primary action:** #FF0080
- **Accent:** #FFFF00
- **Elevation model:** none — flat + pattern fills replace depth

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `stiffness: 180, damping: 12, mass: 0.8` — bouncy, irreverent
- **Enter animation:** bounce-in (scale 0 → 1.1 → 0.95 → 1, 400ms)
- **Forbidden:** restraint, quiet color combinations, grid alignment (intentional misalignment is correct)

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** deliberately inconsistent — mix 0px sharp elements with 50% pill shapes; never uniform

## Code Pattern
```css
.memphis-card {
  background: #FFFFFF;
  border: 3px solid #000000;
  position: relative;
  padding: 32px;
}
.memphis-card::after {
  content: '';
  position: absolute;
  inset: 4px -4px -4px 4px;
  background: #FF0080;
  z-index: -1;
}
.memphis-pattern {
  background-image:
    repeating-linear-gradient(45deg, #FFFF00 0, #FFFF00 2px, transparent 0, transparent 50%),
    repeating-linear-gradient(-45deg, #0055FF 0, #0055FF 2px, transparent 0, transparent 50%);
  background-size: 20px 20px;
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
Memphis chaos must be compositionally intentional — it breaks rules on purpose, not randomly. Avoid making it look like a mistake. Patterns should clash loudly; muted Memphis is not Memphis.
