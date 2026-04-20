---
id: hero-character-sculpture
category: graphic
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, light, pastel]
keywords: [hero, character, sculpture, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Hero Character Sculpture

**Category:** graphic
**Motion tier:** Kinetic

## Typography
- **Display font:** Syne 800 — heavy geometric weight matches sculptural mass
- **Body font:** Syne Regular
- **Tracking:** 0.02em | **Leading:** 1.3

## Colors
- **Background:** #111111 (gallery black)
- **Primary action:** Hero palette (character-defined)
- **Accent:** Rim light color (contrasting to hero palette)
- **Elevation model:** sculptural — multiple light sources create dimensional shadow volumes

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 180, damping: 14 }` — heroic overshoot
- **Enter animation:** hero enters from below with scale 0.9 → 1.02 → 1, 500ms
- **Forbidden:** flat design, 2D illustration style, soft pastels

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px for frame/pedestal; 999px for power indicators

## Code Pattern
```css
.hero-sculpture {
  filter: drop-shadow(0 8px 32px rgba(0,0,0,0.6))
          drop-shadow(0 -2px 8px rgba(255,255,255,0.1));
  /* Rim light simulation */
}

.hero-name {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02em;
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
- `drop-shadow` (not `box-shadow`) must be used on character images — box-shadow clips to the element rectangle, not the character silhouette
- Rim light (white edge glow) must be subtle (0.1–0.15 alpha); bright rim light reads as a selection state, not ambient lighting
