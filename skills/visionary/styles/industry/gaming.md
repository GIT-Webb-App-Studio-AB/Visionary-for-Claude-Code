# Gaming

**Category:** industry
**Motion tier:** Kinetic

## Typography
- **Display font:** Orbitron 700–900 (sci-fi/tech) or Exo 2 800 (action/sport)
- **Body font:** Exo 2 400
- **Weight range:** 400–900
- **Tracking:** 0.04em display (wide tracking for sci-fi authority), 0em body
- **Leading:** 1.0–1.1 display, 1.5 body

## Colors
- **Background:** #0A0014 (deep space dark)
- **Primary action:** #00F0FF (electric cyan)
- **Accent:** #B4FF00 (neon green) or #FF3DFF (neon magenta) — pick one
- **Elevation model:** glows (box-shadow: 0 0 30px rgba(0, 240, 255, 0.4))

## Motion
- **Tier:** Kinetic
- **Spring tokens:** stiffness: 500, damping: 18, mass: 0.7
- **Enter animation:** scanline wipe → content reveal, HUD elements slide in from edges with overshoot
- **Forbidden:** slow graceful easing, organic curves, anything that feels calm or meditative

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px for HUD elements, 2px for cards, 999px for health/energy bars only

## Code Pattern
```css
.gaming-hud-panel {
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 2px;
  backdrop-filter: blur(8px);
  position: relative;
}

.gaming-hud-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(0,240,255,0.05) 0%, transparent 60%);
  pointer-events: none;
}

.gaming-energy-bar {
  height: 6px;
  border-radius: 999px;
  background: #1A1A2E;
  overflow: hidden;
}

.gaming-energy-fill {
  height: 100%;
  background: linear-gradient(90deg, #00F0FF, #B4FF00);
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.6);
  transition: width 0.1s linear;
}
```

## Slop Watch
- Using rounded cards and pastel colors — gaming UI must be aggressive and precise; consumer-app softness destroys immersion
- Applying glows to body text; glow effects are reserved for interactive elements and energy indicators only
