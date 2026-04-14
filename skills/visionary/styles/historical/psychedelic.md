# Psychedelic

**Category:** historical
**Motion tier:** Kinetic

## Typography
- **Display font:** Boogaloo (or any flowing display face with rounded strokes) — liquid, organic letterforms
- **Body font:** Nunito (readable under visual noise)
- **Tracking:** 0.02em | **Leading:** 1.5 | **Weight range:** 400/700

## Colors
- **Background:** #1A0533
- **Primary action:** #FF4FCB
- **Accent:** #4DFFD2
- **Elevation model:** glows (0 0 40px rgba(255,79,203,0.6), 0 0 80px rgba(77,255,210,0.3))

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `stiffness: 100, damping: 10` — slow oscillating, liquid
- **Enter animation:** wave-in (translateY(20px) + rotate(-2deg) → 0, 600ms with elastic ease)
- **Forbidden:** grid alignment, white backgrounds, neutral palettes, sharp edges

## Spacing
- **Base grid:** 8px (loosely applied)
- **Border-radius vocabulary:** flowing — large asymmetric values, blob shapes, 999px pills

## Code Pattern
```css
.psychedelic-heading {
  background: linear-gradient(90deg, #FF4FCB, #4DFFD2, #FFE44D, #FF4FCB);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: rainbow-flow 3s linear infinite;
}
@keyframes rainbow-flow {
  to { background-position: 200% center; }
}
.psychedelic-glow {
  box-shadow: 0 0 40px rgba(255, 79, 203, 0.6),
              0 0 80px rgba(77, 255, 210, 0.3);
}
```

## Slop Watch
Complementary contrast, not random rainbow dumps. Every color must clash with intention — purple/pink against teal/cyan, warm gold against cool violet. Do not use pastel variants; saturation must be maximum.
