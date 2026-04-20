---
id: generative-algorithmic
category: graphic
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [generative, algorithmic, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

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
- The p5.js background alpha trail (0.02) is critical — a fully cleared canvas each frame loses the generative trace that makes this aesthetic
- UI elements must be layered ABOVE the canvas via z-index, not inside it — mixing DOM and canvas coordinate systems creates maintenance traps
