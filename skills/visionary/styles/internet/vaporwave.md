---
id: vaporwave
category: internet
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, neon, pastel]
keywords: [vaporwave, internet]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Vaporwave

**Category:** internet
**Motion tier:** Kinetic

## Typography
- **Display font:** VCR OSD Mono — the corrupted VHS display font is definitional
- **Body font:** VCR OSD Mono or Press Start 2P for pixel aesthetic variant
- **Tracking:** 0.1em — wide spacing references the stretched aesthetics | **Leading:** 1.8

## Colors
- **Background:** #2D1B69 — deep purple that unifies the magenta/cyan duality
- **Primary action:** #FF00FF — magenta, fully saturated
- **Accent:** #00FFFF — cyan, fully saturated
- **Elevation model:** none — vaporwave is flat with glow overlays, no traditional elevation

## Motion
- **Tier:** Kinetic
- **Spring tokens:** bounce (element entrance), layout (scroll marquee)
- **Enter animation:** scanline wipe — element reveals from top-to-bottom via clip-path, with CRT scanline overlay
- **Forbidden:** smooth professional easing, clean sans-serif, anything from 2020+ design vocabulary

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px for retro elements, 4px max — grid-based and geometric

## Code Pattern
```css
.vaporwave-grid {
  background-color: #2D1B69;
  background-image:
    linear-gradient(rgba(255,0,255,0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,0,255,0.3) 1px, transparent 1px);
  background-size: 40px 40px;
  perspective: 400px;
}

/* Perspective grid (the floor) */
.vaporwave-floor {
  background-image:
    linear-gradient(cyan 1px, transparent 1px),
    linear-gradient(90deg, magenta 1px, transparent 1px);
  background-size: 40px 40px;
  transform: rotateX(60deg);
  transform-origin: bottom;
}

.vaporwave-text {
  font-family: 'VCR OSD Mono', monospace;
  color: #FF00FF;
  text-shadow:
    0 0 10px #FF00FF,
    0 0 20px #FF00FF,
    0 0 40px #FF00FF;
  letter-spacing: 0.1em;
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
- **Using Outrun instead of Vaporwave palette:** Outrun is orange/pink/purple — vaporwave is specifically magenta + cyan on purple/dark. They are different aesthetics
- **Pastel vaporwave:** Desaturating to lavender/rose tones creates "aesthetic/tumblr" not vaporwave — full saturation is required
