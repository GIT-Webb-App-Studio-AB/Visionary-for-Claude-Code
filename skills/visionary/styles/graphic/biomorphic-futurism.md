# Biomorphic Futurism

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Bricolage Grotesque — organic width variation, grown not engineered
- **Body font:** Bricolage Grotesque Regular
- **Tracking:** -0.01em | **Leading:** 1.6

## Colors
- **Background:** #0A1A0E (biopunk dark green)
- **Primary action:** #39FF14 (bioluminescent green)
- **Accent:** #7FFF00 (chlorophyll lime)
- **Elevation model:** organic ambient glow; no geometric shadows

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 140, damping: 14 }` — organic, living bounce
- **Enter animation:** morph from blob shape to final form, 400ms ease-in-out
- **Forbidden:** rigid geometry, monospace type, mechanical easing (linear)

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** variable via SVG path; avoid fixed radius values

## Code Pattern
```css
.biomorph-panel {
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  background: rgba(57, 255, 20, 0.08);
  border: 1px solid rgba(57, 255, 20, 0.3);
  animation: biomorph 8s ease-in-out infinite;
}

@keyframes biomorph {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  50%       { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
}
```

## Slop Watch
- The border-radius morph animation must use matching vertex counts in both keyframes — mismatched values cause non-interpolating hard cuts
- Bioluminescent green (#39FF14) on a dark bg has contrast ratio ~9:1 which is fine; never lighten the background to > #1A2E1E or contrast fails
