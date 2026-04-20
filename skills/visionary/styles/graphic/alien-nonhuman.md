---
id: alien-nonhuman
category: graphic
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, neon, earth]
keywords: [alien, nonhuman, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Alien Nonhuman

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Custom glyph font or Josefin Sans with heavy modification — human letterforms used wrongly
- **Body font:** Josefin Sans (intentionally awkward for the register)
- **Tracking:** 0.2em | **Leading:** 1.1 (deliberately cramped)

## Colors
- **Background:** #080012 (xenobiological dark)
- **Primary action:** #BFFF00 (chartreuse alien)
- **Accent:** #FF00B8 (bioluminescent magenta)
- **Elevation model:** phosphorescent glow; no human-legible shadow direction

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 90, damping: 6 }` — non-human damping ratio
- **Enter animation:** irregular morph: scale + skew + opacity, non-simultaneous axis, 500ms
- **Forbidden:** legible typographic hierarchy, familiar interaction patterns, warm earth tones

## Spacing
- **Base grid:** 7px (non-power-of-2 intentionally unsettling)
- **Border-radius vocabulary:** asymmetric: 40% 10% 60% 20%; never uniform

## Code Pattern
```css
.xenomorph-panel {
  border-radius: 40% 10% 60% 20% / 20% 60% 10% 40%;
  background: rgba(191, 255, 0, 0.06);
  border: 1px solid rgba(191, 255, 0, 0.3);
  transform: skewX(-2deg);
  transition: border-radius 800ms cubic-bezier(0.68, -0.6, 0.32, 1.6);
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
- The intentionally wrong spacing (7px grid) is meaningful — do not normalize to 8px; the slight wrongness is the aesthetic
- Skew must be applied to containers, not text; skewed text at body size crosses from alien into inaccessible
