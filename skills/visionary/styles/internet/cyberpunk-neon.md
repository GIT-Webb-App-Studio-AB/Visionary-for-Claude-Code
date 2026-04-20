---
id: cyberpunk-neon
category: internet
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, neon, organic]
keywords: [cyberpunk, neon, internet]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Cyberpunk Neon

**Category:** internet
**Motion tier:** Kinetic

## Typography
- **Display font:** Orbitron 700-900 — the canonical cyberpunk typeface
- **Body font:** Share Tech Mono or Courier New — terminal monospace
- **Tracking:** -0.02em display, 0.05em mono body | **Leading:** 1.4

## Colors
- **Background:** #0A0A0F — near-black with barely-perceptible blue
- **Primary action:** #FF00FF — magenta neon for primary CTAs
- **Accent:** #00FFAA — green-cyan neon (Blade Runner palette variant)
- **Elevation model:** glows — neon glow is the only depth signal; no shadows

## Motion
- **Tier:** Kinetic
- **Spring tokens:** snappy (glitch), layout (HUD data updates)
- **Enter animation:** glitch-in — element appears with 3-frame RGB channel offset before settling
- **Forbidden:** smooth organic easing, warm colors, anything pastoral or natural

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px or 2px for tech panel feel; 999px for data pills only

## Code Pattern
```css
.neon-text {
  color: #00FFAA;
  text-shadow:
    0 0 4px #00FFAA,
    0 0 12px #00FFAA,
    0 0 30px rgba(0,255,170,0.5),
    0 0 60px rgba(0,255,170,0.2);
}

.neon-border {
  border: 1px solid #FF00FF;
  box-shadow:
    0 0 5px #FF00FF,
    0 0 15px rgba(255,0,255,0.4),
    inset 0 0 5px rgba(255,0,255,0.1);
}

/* Scanline overlay */
.scanlines::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.15) 2px,
    rgba(0,0,0,0.15) 4px
  );
  pointer-events: none;
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
- **Purple as background:** Using #1a0030 as the background looks like vaporwave, not cyberpunk — cyberpunk backgrounds are near-black, the neon provides all the color
- **Too many neon colors:** Using 4+ neon accent colors creates chaos, not cyberpunk — pick magenta + one secondary maximum
