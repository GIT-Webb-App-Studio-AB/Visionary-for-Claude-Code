# Op Art

**Category:** historical
**Motion tier:** Subtle

## Typography
- **Display font:** Space Grotesk — optical rhythm, geometric precision
- **Body font:** Space Grotesk Regular
- **Tracking:** 0em | **Leading:** 1.5 | **Weight range:** 400/700

## Colors
- **Background:** #FFFFFF
- **Primary action:** #000000
- **Accent:** #FFFFFF (inverted application)
- **Elevation model:** none — optical depth through pattern, not shadows

## Motion
- **Tier:** Subtle (the visual patterns provide all the motion perception needed)
- **Spring tokens:** `stiffness: 400, damping: 40` — measured, precise
- **Enter animation:** none — static pattern IS the animation; if transition required, fade 150ms
- **Forbidden:** color, motion blur, drop shadows, gradients

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px — geometry is the entire vocabulary

## Code Pattern
```css
.op-art-pattern-concentric {
  background-image: repeating-radial-gradient(
    circle,
    #000000 0px, #000000 2px,
    #FFFFFF 2px, #FFFFFF 8px
  );
}
.op-art-pattern-chevron {
  background-image: repeating-linear-gradient(
    45deg,
    #000000 0, #000000 4px,
    #FFFFFF 4px, #FFFFFF 16px
  );
}
.op-art-moiré {
  position: relative;
}
.op-art-moiré::after {
  content: '';
  position: absolute;
  inset: 0;
  background: inherit;
  transform: rotate(1deg);
  mix-blend-mode: difference;
  opacity: 0.4;
}
```

## Slop Watch
Monochrome only — the moment color enters, it becomes something else. The optical effect must be perceptible at standard screen density; patterns that are too fine or too coarse fail to activate. Test at 100% zoom.
