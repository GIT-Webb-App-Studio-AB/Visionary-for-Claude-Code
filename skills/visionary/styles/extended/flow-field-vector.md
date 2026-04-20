---
id: flow-field-vector
category: extended
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark]
keywords: [flow, field, vector, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Flow Field Vector

**Category:** extended
**Motion tier:** Kinetic

## Typography
- **Display font:** Syne Mono — vector-grid precision
- **Body font:** DM Sans
- **Tracking:** 0em | **Leading:** 1.5

## Colors
- **Background:** #0A0A0A (void)
- **Primary action:** Velocity-mapped hue rotation (HSL)
- **Accent:** High-velocity particles brighten
- **Elevation model:** none — particle trails define visual depth

## Motion
- **Tier:** Kinetic
- **Spring tokens:** N/A — Perlin noise drives continuous flow
- **Enter animation:** particles spawn at random positions and flow along field vectors
- **Forbidden:** static particle positions, uniform color, grid-aligned movement

## Spacing
- **Base grid:** 8px for UI overlay
- **Border-radius vocabulary:** 0px; particles are points, not shapes

## Code Pattern
```javascript
// Perlin-based flow field
ctx.strokeStyle = `hsl(${angle * 57.3}, 80%, 60%)`;

// Each particle follows field angle at its position
const angle = noise(x * scale, y * scale, time * 0.001) * Math.PI * 4;
particle.vx += Math.cos(angle) * force;
particle.vy += Math.sin(angle) * force;

// Velocity damping to prevent escape
particle.vx *= 0.95;
particle.vy *= 0.95;
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
- Particle velocity must be damped each frame (multiply by 0.9–0.95) — undamped particles accelerate to screen-edge escape velocities within seconds
- Angle-to-hue mapping (`angle * 57.3` converts radians to degrees) must wrap at 360 — without wrapping, hue jumps from 359° to 0° cause visible color seams in the field
