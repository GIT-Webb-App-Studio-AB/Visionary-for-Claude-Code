# Retrofuturism

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Orbitron — the atomic age imagined this letterform; it is period-correct
- **Body font:** Audiowide
- **Tracking:** 0.1em | **Leading:** 1.4

## Colors
- **Background:** #F5F0E0 (atomic cream) — or #0D3B47 (Googie teal) as dark variant
- **Primary action:** #FF6B00 (atomic orange)
- **Accent:** #00B3A4 (turquoise)
- **Elevation model:** hard-edged drop shadows (2-color, no blur); optimistic and geometric

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 200, damping: 12 }` — optimistic bounce; the future was exciting
- **Enter animation:** bounce-in from bottom, overshoot 8px, settle, 360ms
- **Forbidden:** dystopian glitch, desaturation, decay effects

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** mix of 0px (sharp fins) and 999px (boomerang curves); no middle ground

## Code Pattern
```css
.retro-card {
  background: #F5F0E0;
  border: 3px solid #FF6B00;
  box-shadow: 6px 6px 0 #FF6B00;
  border-radius: 0 40px 0 40px; /* boomerang diagonal */
}

.retro-card:hover {
  transform: translate(-3px, -3px);
  box-shadow: 9px 9px 0 #FF6B00;
  transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

## Slop Watch
- The bounce spring (damping 12) on hover must not exceed 1.5 cycles of overshoot — more than 2 bounces reads as broken animation, not optimistic
- Never add weathering or decay textures; retrofuturism imagines the future from the past — it is pristine and enthusiastic
