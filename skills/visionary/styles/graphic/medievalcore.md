# Medievalcore

**Category:** extended
**Motion tier:** Expressive

## Typography
- **Display font:** Cinzel — classical Roman-adjacent for contemporary medieval aesthetic
- **Body font:** IM Fell English — authentic historical typeface feel
- **Tracking:** 0.04em | **Leading:** 1.65

## Colors
- **Background:** #1C1208 (parchment void)
- **Primary action:** #8B3A2A (crimson)
- **Accent:** #C9A84C (gold illumination)
- **Elevation model:** candlelit depth; warm shadows, cold void edges

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 160, damping: 20 }`
- **Enter animation:** unfurl — expand from center with 600ms ease-out, like unrolling a scroll
- **Forbidden:** neon, clean modern sans, cold blue tones, digital flatness

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–2px; stone and parchment are flat-edged

## Code Pattern
```css
.medieval-panel {
  background: linear-gradient(160deg, #1C1208, #2A1A0C);
  border: 1px solid rgba(201, 168, 76, 0.3);
  box-shadow:
    inset 0 0 40px rgba(0,0,0,0.5),
    0 4px 16px rgba(0,0,0,0.4);
}

.rune-text {
  font-family: 'Cinzel', 'Times New Roman', serif;
  color: #C9A84C;
  letter-spacing: 0.06em;
}
```

## Slop Watch
- Cinzel is a display font — use IM Fell English for body text; Cinzel at body size loses readability rapidly
- Gold (#C9A84C) must not appear on more than 25% of the surface; gold is precious and overuse removes its value as an accent
