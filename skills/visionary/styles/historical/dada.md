---
id: dada
category: historical
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [light]
keywords: [dada, historical]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Dada

**Category:** historical
**Motion tier:** Kinetic

## Typography
- **Display font:** Mixed — intentionally inconsistent; use at least 3 different typefaces simultaneously
- **Body font:** Any serif, unexpectedly
- **Tracking:** no rule | **Leading:** no rule | **Weight range:** everything, applied irrationally

## Colors
- **Background:** #F0EBE0 (aged paper)
- **Primary action:** #1C1C1C
- **Accent:** #B22222
- **Elevation model:** none — collage layering replaces spatial depth

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `stiffness: 120, damping: 8` — lurching, irrational
- **Enter animation:** absurdist — elements appear from random positions at random delays (0–800ms stagger)
- **Forbidden:** consistency, rational layout, purposeful composition (paradoxically, purposeless purpose)

## Spacing
- **Base grid:** no grid — intentional rejection
- **Border-radius vocabulary:** inconsistent, arbitrary; torn-paper edge effects preferred

## Code Pattern
```css
.dada-collage {
  position: relative;
  min-height: 400px;
}
.dada-element {
  position: absolute;
  /* Positions set intentionally without pattern */
}
.dada-element:nth-child(1) { top: 12%; left: 8%;  transform: rotate(-7deg); font-family: serif; }
.dada-element:nth-child(2) { top: 45%; left: 55%; transform: rotate(4deg);  font-family: monospace; font-size: 2.5rem; }
.dada-element:nth-child(3) { top: 5%;  left: 40%; transform: rotate(-2deg); font-size: 0.7rem; font-family: sans-serif; }
.dada-torn-edge {
  clip-path: polygon(0 0, 100% 2%, 98% 100%, 2% 98%);
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
Dada is anti-art, not bad art. The anti-rules must be applied with full awareness of the rules being rejected. A truly Dada interface communicates the intended content — it just does so through apparent rejection of every convention. Meaningless chaos is just broken design.
