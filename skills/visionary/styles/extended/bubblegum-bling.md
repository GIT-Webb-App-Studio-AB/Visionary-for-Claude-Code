---
id: bubblegum-bling
category: extended
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, neon, pastel, editorial]
keywords: [bubblegum, bling, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Bubblegum Bling

**Category:** extended
**Motion tier:** Kinetic

## Typography
- **Display font:** Fredoka One — round, bouncy, confectionery-adjacent
- **Body font:** Fredoka One Regular
- **Tracking:** 0.01em | **Leading:** 1.5

## Colors
- **Background:** #FFB3E6 (pastel pink)
- **Primary action:** #FF1493 (hot pink)
- **Accent:** #FFD700 (glitter gold) and #B0E0FF (baby blue)
- **Elevation model:** glitter glow; sparkle reflections, no neutral shadows

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 240, damping: 14 }` — bouncy and fun
- **Enter animation:** pop-in with overshoot — scale 0 → 1.15 → 1, 350ms
- **Forbidden:** serious greys, sharp geometry, understated anything

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 999px (pill) or large radius 24–32px; bubblegum has no hard edges

## Code Pattern
```css
.bubblegum-card {
  background: linear-gradient(135deg, #FFB3E6, #FFD6F0);
  border-radius: 24px;
  border: 3px solid #FF1493;
  box-shadow:
    0 4px 0 #CC0070,
    0 8px 16px rgba(255, 20, 147, 0.25);
}

.bling-text {
  font-family: 'Fredoka One', 'Fredoka', sans-serif;
  color: #FF1493;
  text-shadow: 2px 2px 0 rgba(255,255,255,0.5);
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
- The 3D button effect (bottom border as box-shadow offset) requires `box-shadow: 0 4px 0 [darker-pink]` — CSS `border-bottom` thickness doesn't create the same press effect
- Never use weight below 400; Fredoka One is a single-weight display font and doesn't have lighter variants
