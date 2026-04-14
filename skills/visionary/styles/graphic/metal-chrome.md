# Metal Chrome

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Syncopate — geometric, hard-edged, industrial rhythm
- **Body font:** Audiowide
- **Tracking:** 0.08em | **Leading:** 1.3

## Colors
- **Background:** #1A1A1A (blackened steel)
- **Primary action:** #E8E8E8 (polished chrome)
- **Accent:** #6AABFF (specular blue highlight)
- **Elevation model:** metallic gradient sheen; layered specular highlights

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 280, damping: 22 }`
- **Enter animation:** scale 0.97 → 1 with specular flash 240ms
- **Forbidden:** warm tones, soft ease-in-out, organic curves

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–3px; machined precision, minimal rounding

## Code Pattern
```css
.chrome-surface {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 40%, #3a3a3a 50%, #2d2d2d 60%, #1a1a1a 100%);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.15),
    0 -1px 0 rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,255,255,0.08);
}
```

## Slop Watch
- Specular highlight must be a single thin line (1px), not a wide gradient band — wide bands read as plastic
- Avoid Orbitron here; Syncopate's uniform stroke weight better matches machined metal
