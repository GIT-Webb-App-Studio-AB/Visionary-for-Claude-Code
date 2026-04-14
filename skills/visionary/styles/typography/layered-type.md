# Layered Type

**Category:** typography-led
**Motion tier:** Expressive

## Typography
- **Display font:** Syne 800 (foreground) + Syne 200 (background layer)
- **Body font:** Syne 400
- **Weight range:** 200–800
- **Tracking:** 0em foreground, 0.08em background ghost layer
- **Leading:** 1.0 display layers, 1.5 body

## Colors
- **Background:** #0F0F0F
- **Primary action:** #FFFFFF
- **Accent:** #E8FF00
- **Elevation model:** none — z-index stacking of type layers creates all depth

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 180, damping: 22, mass: 1.2
- **Enter animation:** foreground layer slides in 40ms after background ghost, parallax scroll at 0.3x rate
- **Forbidden:** drop shadows on text, text outlines, legibility-first thinking (background layer is intentionally illegible)

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px — layout and depth come from type, not containers

## Code Pattern
```css
.layered-type-container {
  position: relative;
  overflow: hidden;
}

.type-ghost {
  position: absolute;
  font-family: 'Syne', sans-serif;
  font-weight: 200;
  font-size: 18vw;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.04);
  top: -10%;
  pointer-events: none;
  will-change: transform;
}

.type-foreground {
  position: relative;
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: clamp(3rem, 8vw, 8rem);
  z-index: 2;
}
```

## Slop Watch
- Making the ghost layer too visible (opacity above 0.08) — it becomes clutter, not atmosphere
- Animating both layers at the same speed; the parallax offset is what creates the layered illusion
