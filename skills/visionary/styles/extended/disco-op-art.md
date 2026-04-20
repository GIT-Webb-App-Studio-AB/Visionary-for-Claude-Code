---
id: disco-op-art
category: extended
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, pastel, editorial]
keywords: [disco, art, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Disco Op Art

**Category:** extended
**Motion tier:** Kinetic

## Typography
- **Display font:** Syne or Bebas Neue — geometric boldness for optical environments
- **Body font:** DM Sans
- **Tracking:** 0.04em | **Leading:** 1.3

## Colors
- **Background:** High-contrast black #000000 + white #FFFFFF alternating
- **Primary action:** #FF006E (disco pink)
- **Accent:** #00E5FF (electric cyan) + #FFE000 (gold)
- **Elevation model:** optical illusion creates perceived depth; no traditional shadows

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 200, damping: 20 }`
- **Enter animation:** optical pulse — pattern scale or rotation creates visual vibration
- **Forbidden:** muted colors, gray tones, static backgrounds without optical movement

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px for op-art geometry; 999px for disco circle motifs

## Code Pattern
```css
.op-art-pattern {
  background-image: repeating-linear-gradient(
    45deg,
    #000000 0px, #000000 10px,
    #FFFFFF 10px, #FFFFFF 20px
  );
  animation: op-pulse 2s ease-in-out infinite alternate;
}

@keyframes op-pulse {
  from { background-size: 28px 28px; }
  to   { background-size: 32px 32px; }
}

.disco-ball-light {
  background: conic-gradient(
    from 0deg,
    #FF006E, #FFE000, #00E5FF, #FF006E
  );
  border-radius: 999px;
  animation: spin 3s linear infinite;
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
- Op-art pulse animation must be `alternate` direction — unidirectional pattern scaling builds then disappears, destroying the optical oscillation
- Disco colors must be fully saturated — desaturating any of the three colors (pink, cyan, gold) neutralizes the chromatic vibration that makes disco lighting work
