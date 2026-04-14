# Generative Algorithmic

**Category:** graphic
**Motion tier:** Kinetic

## Typography
- **Display font:** Space Mono — the algorithm labels itself
- **Body font:** Space Mono Regular
- **Tracking:** 0em | **Leading:** 1.5

## Colors
- **Background:** #000000 (void — the canvas is the content)
- **Primary action:** #FFFFFF (output signal)
- **Accent:** Algorithm-determined (HSL rotation based on seed)
- **Elevation model:** none — the generative canvas IS the depth

## Motion
- **Tier:** Kinetic
- **Spring tokens:** N/A — motion is rule-driven, not spring-based
- **Enter animation:** algorithm initializes from seed, draws frame-by-frame; UI emerges from the system
- **Forbidden:** static decorative elements, stock imagery, fixed color palettes, CSS animations not tied to algorithm state

## Spacing
- **Base grid:** Algorithm-determined (typically 1px canvas grid)
- **Border-radius vocabulary:** 0px for UI chrome; algorithm handles all visual geometry

## Code Pattern
```jsx
// The design IS the motion — canvas drives everything
const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.colorMode(p.HSB, 360, 100, 100, 1);
    p.noFill();
  };

  p.draw = () => {
    p.background(0, 0, 0, 0.02); // trail fade
    const t = p.frameCount * 0.01;
    const x = p.width/2 + Math.sin(t * 2.3) * 200;
    const y = p.height/2 + Math.cos(t * 1.7) * 150;
    p.stroke((t * 30) % 360, 80, 100, 0.8);
    p.ellipse(x, y, 2, 2);
  };
};
```

## Slop Watch
- The p5.js background alpha trail (0.02) is critical — a fully cleared canvas each frame loses the generative trace that makes this aesthetic
- UI elements must be layered ABOVE the canvas via z-index, not inside it — mixing DOM and canvas coordinate systems creates maintenance traps
