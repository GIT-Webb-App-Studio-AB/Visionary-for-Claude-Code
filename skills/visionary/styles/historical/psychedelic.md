---
id: psychedelic
category: historical
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [light, neon, pastel, editorial]
keywords: [psychedelic, historical]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Psychedelic

**Category:** historical
**Motion tier:** Kinetic

## Typography
- **Display font:** Boogaloo (or any flowing display face with rounded strokes) — liquid, organic letterforms
- **Body font:** Nunito (readable under visual noise)
- **Tracking:** 0.02em | **Leading:** 1.5 | **Weight range:** 400/700

## Colors
- **Background:** #1A0533
- **Primary action:** #FF4FCB
- **Accent:** #4DFFD2
- **Elevation model:** glows (0 0 40px rgba(255,79,203,0.6), 0 0 80px rgba(77,255,210,0.3))

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `stiffness: 100, damping: 10` — slow oscillating, liquid
- **Enter animation:** wave-in (translateY(20px) + rotate(-2deg) → 0, 600ms with elastic ease)
- **Forbidden:** grid alignment, white backgrounds, neutral palettes, sharp edges

## Spacing
- **Base grid:** 8px (loosely applied)
- **Border-radius vocabulary:** flowing — large asymmetric values, blob shapes, 999px pills

## Code Pattern
```css
.psychedelic-heading {
  background: linear-gradient(90deg, #FF4FCB, #4DFFD2, #FFE44D, #FF4FCB);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: rainbow-flow 3s linear infinite;
}
@keyframes rainbow-flow {
  to { background-position: 200% center; }
}
.psychedelic-glow {
  box-shadow: 0 0 40px rgba(255, 79, 203, 0.6),
              0 0 80px rgba(77, 255, 210, 0.3);
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
Complementary contrast, not random rainbow dumps. Every color must clash with intention — purple/pink against teal/cyan, warm gold against cool violet. Do not use pastel variants; saturation must be maximum.
