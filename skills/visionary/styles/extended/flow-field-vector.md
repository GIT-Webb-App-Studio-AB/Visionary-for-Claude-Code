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

## Slop Watch
- Particle velocity must be damped each frame (multiply by 0.9–0.95) — undamped particles accelerate to screen-edge escape velocities within seconds
- Angle-to-hue mapping (`angle * 57.3` converts radians to degrees) must wrap at 360 — without wrapping, hue jumps from 359° to 0° cause visible color seams in the field
