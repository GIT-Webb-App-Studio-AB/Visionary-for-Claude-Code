# Smoked Glass Chrome

**Category:** extended
**Motion tier:** Expressive

## Typography
- **Display font:** Inter (or Geist) — neutral, reads cleanly through translucent surfaces
- **Body font:** Inter
- **Tracking:** -0.01em | **Leading:** 1.5

## Colors
- **Background:** #0D0D0F (near-black)
- **Primary action:** #C0C0C0 (chrome)
- **Accent:** rgba(255,255,255,0.08) (smoke)
- **Elevation model:** glass shimmer; backdrop-filter blur + chrome edge highlights

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 260, damping: 22 }`
- **Enter animation:** glass shimmer — backdrop-filter blur increases then resolves, 320ms
- **Forbidden:** warm tones, opaque backgrounds on glass elements, hard geometric shadows

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 12–16px; smoked glass is formed, smooth-edged

## Code Pattern
```css
.smoked-glass {
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-top-color: rgba(255, 255, 255, 0.2); /* chrome edge highlight */
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}
```

## Slop Watch
- `backdrop-filter` requires the element background to be non-opaque — a solid `background-color` defeats the blur entirely
- Chrome edge highlight must be on `border-top-color` only; applying it to all four edges removes directionality and makes it look like a glow, not a metal edge
