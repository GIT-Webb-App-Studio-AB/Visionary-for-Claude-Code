# Alien Nonhuman

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Custom glyph font or Josefin Sans with heavy modification — human letterforms used wrongly
- **Body font:** Josefin Sans (intentionally awkward for the register)
- **Tracking:** 0.2em | **Leading:** 1.1 (deliberately cramped)

## Colors
- **Background:** #080012 (xenobiological dark)
- **Primary action:** #BFFF00 (chartreuse alien)
- **Accent:** #FF00B8 (bioluminescent magenta)
- **Elevation model:** phosphorescent glow; no human-legible shadow direction

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 90, damping: 6 }` — non-human damping ratio
- **Enter animation:** irregular morph: scale + skew + opacity, non-simultaneous axis, 500ms
- **Forbidden:** legible typographic hierarchy, familiar interaction patterns, warm earth tones

## Spacing
- **Base grid:** 7px (non-power-of-2 intentionally unsettling)
- **Border-radius vocabulary:** asymmetric: 40% 10% 60% 20%; never uniform

## Code Pattern
```css
.xenomorph-panel {
  border-radius: 40% 10% 60% 20% / 20% 60% 10% 40%;
  background: rgba(191, 255, 0, 0.06);
  border: 1px solid rgba(191, 255, 0, 0.3);
  transform: skewX(-2deg);
  transition: border-radius 800ms cubic-bezier(0.68, -0.6, 0.32, 1.6);
}
```

## Slop Watch
- The intentionally wrong spacing (7px grid) is meaningful — do not normalize to 8px; the slight wrongness is the aesthetic
- Skew must be applied to containers, not text; skewed text at body size crosses from alien into inaccessible
