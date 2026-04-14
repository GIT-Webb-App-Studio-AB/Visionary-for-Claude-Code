# Leather Craft

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** Libre Baskerville — warm, aged, hand-press character
- **Body font:** Libre Baskerville Regular
- **Tracking:** 0.01em | **Leading:** 1.6

## Colors
- **Background:** #3B1F0E (dark saddle leather)
- **Primary action:** #C8842A (burnished tan)
- **Accent:** #5C3A1E (mid-brown)
- **Elevation model:** embossed inset shadows, debossed press effects

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 200, damping: 32 }`
- **Enter animation:** fade-in 180ms ease-out; no movement
- **Forbidden:** scale, brightness flash, neon

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 2–4px; tooling leaves small but present rounding

## Code Pattern
```css
.leather-surface {
  background: #5C3A1E;
  box-shadow:
    inset 0 1px 3px rgba(0,0,0,0.6),
    inset 0 -1px 2px rgba(200,132,42,0.2);
  border: 1px solid #3B1F0E;
}
```

## Slop Watch
- Emboss must use inset shadows — never outer glow; leather recedes, it does not emit
- Avoid web-safe serif fallbacks; Georgia collapses the warm character Libre Baskerville provides
