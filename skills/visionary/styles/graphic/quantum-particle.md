---
id: quantum-particle
category: graphic
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark]
keywords: [quantum, particle, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Quantum Particle

**Category:** graphic
**Motion tier:** Kinetic

## Typography
- **Display font:** Space Grotesk — precise, technical without being cold
- **Body font:** Space Grotesk Regular
- **Tracking:** 0.02em | **Leading:** 1.45

## Colors
- **Background:** #05050F (void black)
- **Primary action:** #7B2FFF (quantum violet)
- **Accent:** #00BFFF (particle blue)
- **Elevation model:** glow emanation from particle nodes; no static shadows

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 80, damping: 8 }` — float, never settle fully
- **Enter animation:** particles converge from random positions to form element, 600ms
- **Forbidden:** static layout, hard borders, non-animated states

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 999px for particle nodes; 0 for data panels

## Code Pattern
```jsx
// Particle canvas layer (runs behind all content)
<canvas
  ref={canvasRef}
  className="particle-field"
  style={{
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
    opacity: 0.6,
  }}
/>
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
- Canvas must be pointer-events: none — mouse interactions passing through to content beneath is a critical UX regression
- Particle count must be capped (recommend ≤ 120 particles); uncapped particle fields degrade to < 30fps on mobile devices
