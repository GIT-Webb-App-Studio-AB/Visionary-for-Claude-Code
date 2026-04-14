# Holographic

**Category:** morphisms
**Motion tier:** Kinetic

## Typography
- **Display font:** Cabinet Grotesk 800 — sharp geometric weight that reads against iridescent backgrounds
- **Body font:** Cabinet Grotesk 400
- **Tracking:** -0.03em display | **Leading:** 1.3

## Colors
- **Background:** #0D0D0D — near-black for maximum iridescence contrast
- **Primary action:** hsl(var(--hue, 280) 80% 60%) — hue shifts with interaction
- **Accent:** rainbow — deliberately cycling through spectrum
- **Elevation model:** glows — spectral glow that cycles hue, no traditional shadows

## Motion
- **Tier:** Kinetic
- **Spring tokens:** snappy (interaction), ui (state change), bounce (entrance)
- **Enter animation:** hue-rotate sweep from 0 to 360deg over 0.4s on entrance, then settle
- **Forbidden:** static single-hue color treatment, greyscale elements mixed with holographic, Roboto/Inter (too corporate)

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 16px standard, 24px feature cards, 999px pills — smooth to match the spectral flow

## Code Pattern
```css
.holographic-surface {
  background: linear-gradient(
    135deg,
    hsl(0, 90%, 70%),
    hsl(60, 90%, 70%),
    hsl(120, 90%, 70%),
    hsl(180, 90%, 70%),
    hsl(240, 90%, 70%),
    hsl(300, 90%, 70%),
    hsl(360, 90%, 70%)
  );
  background-size: 300% 300%;
  animation: holo-shift 4s linear infinite;
}

@keyframes holo-shift {
  0% { background-position: 0% 50%; filter: hue-rotate(0deg); }
  50% { background-position: 100% 50%; filter: hue-rotate(180deg); }
  100% { background-position: 0% 50%; filter: hue-rotate(360deg); }
}

.holographic-card {
  background: rgba(13,13,13,0.85);
  border: 1px solid transparent;
  border-image: linear-gradient(135deg, #ff006e, #8338ec, #3a86ff, #06d6a0) 1;
  border-radius: 16px; /* border-image disables border-radius — use clip-path instead in production */
}
```

## Slop Watch
- **Overusing hue-rotate on the entire page:** Rotating everything including body text creates an accessibility and readability crisis — holographic treatment is for surfaces and accents only
- **Low-saturation "holographic":** Using pastel rainbow gradients reads as unicorn/pride flag aesthetic, not holographic — keep saturation above 70%
