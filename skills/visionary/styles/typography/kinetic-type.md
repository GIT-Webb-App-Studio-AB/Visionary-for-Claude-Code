# Kinetic Type

**Category:** typography-led
**Motion tier:** Kinetic

## Typography
- **Display font:** Syne Mono
- **Body font:** Syne
- **Weight range:** 400–800
- **Tracking:** 0em to -0.03em (animates between values)
- **Leading:** 1.0–1.2 (compressed for typographic density)

## Colors
- **Background:** #0A0A0A
- **Primary action:** #FFFFFF
- **Accent:** #FF3366
- **Elevation model:** none — depth via type scale only

## Motion
- **Tier:** Kinetic
- **Spring tokens:** stiffness: 400, damping: 20, mass: 0.8
- **Enter animation:** characters stagger in with letter-spacing collapse (0.2em → -0.01em over 600ms)
- **Forbidden:** static text, fade-only transitions, healthcare contexts

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px everywhere — geometry is typographic, not rounded

## Code Pattern
```css
@keyframes kinetic-enter {
  from {
    letter-spacing: 0.2em;
    opacity: 0;
    filter: blur(4px);
  }
  to {
    letter-spacing: -0.01em;
    opacity: 1;
    filter: blur(0);
  }
}

.kinetic-headline {
  font-family: 'Syne Mono', monospace;
  font-size: clamp(3rem, 10vw, 9rem);
  font-weight: 800;
  animation: kinetic-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

## Slop Watch
- Using standard fade-in instead of letter-spacing animation — this style's identity IS the motion
- Adding decorative elements; the type is the only ornament
