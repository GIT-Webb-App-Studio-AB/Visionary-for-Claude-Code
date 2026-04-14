# Pop Art

**Category:** historical
**Motion tier:** Kinetic

## Typography
- **Display font:** Futura Bold — commercial, democratic, off-the-shelf
- **Body font:** Futura Medium
- **Tracking:** 0.02em | **Leading:** 1.2 | **Weight range:** 700/900

## Colors
- **Background:** #FFFF00
- **Primary action:** #FF0000
- **Accent:** #0000FF
- **Elevation model:** hard offset shadows (4px 4px 0 #000000) — comic book depth

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `stiffness: 250, damping: 15` — punchy, snappy
- **Enter animation:** pop-in (scale 0.5 → 1.08 → 1, 300ms cubic-bezier(0.34,1.56,0.64,1))
- **Forbidden:** subtle palettes, refined gradients, editorial spacing

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px primary; 50% for circular Ben Day dot elements only

## Code Pattern
```css
.pop-art-card {
  background: #FFFFFF;
  border: 3px solid #000000;
  box-shadow: 6px 6px 0 #000000;
  padding: 32px;
}
.pop-art-dot-bg {
  background-image: radial-gradient(circle, #FF0000 30%, transparent 30%);
  background-size: 12px 12px;
  opacity: 0.15;
}
.pop-art-speech-bubble {
  position: relative;
  background: #FFFF00;
  border: 3px solid #000000;
  border-radius: 16px;
  padding: 16px 24px;
  font-weight: 900;
  text-transform: uppercase;
}
```

## Slop Watch
Ben Day dots are the signature — without them it is just primary-color flat design. The dots must be visible at normal reading distance (12–16px pattern size). Hard offset shadows at exactly 4–6px are required, not approximate.
