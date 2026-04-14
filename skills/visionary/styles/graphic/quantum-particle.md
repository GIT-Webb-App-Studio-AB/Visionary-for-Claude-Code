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

## Slop Watch
- Canvas must be pointer-events: none — mouse interactions passing through to content beneath is a critical UX regression
- Particle count must be capped (recommend ≤ 120 particles); uncapped particle fields degrade to < 30fps on mobile devices
