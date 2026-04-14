# Latin Fiesta

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Lato ExtraBold — warmth at high weight; Latin-adjacent origin (Łukasz Dziedzic, Warsaw)
- **Body font:** Lato Regular
- **Tracking:** 0.02em | **Leading:** 1.55

## Colors
- **Background:** #FFF8F0 (warm cream)
- **Primary action:** #D4380D (terracotta orange-red)
- **Accent:** #1A7A4A (Mexican jade green)
- **Elevation model:** warm drop shadows with hue; no cold greys

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 240, damping: 16 }` — celebratory bounce
- **Enter animation:** scale 0.9 → 1.04 → 1, 320ms; fiesta energy
- **Forbidden:** cold palettes, understated motion, muted desaturation

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8–20px; warm and approachable

## Code Pattern
```css
.fiesta-card {
  background: #FFF8F0;
  border-radius: 16px;
  border: 2px solid #D4380D;
  box-shadow: 4px 4px 0 #1A7A4A;
  transition: transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 280ms ease;
}

.fiesta-card:hover {
  transform: translate(-2px, -2px) rotate(0.5deg);
  box-shadow: 6px 6px 0 #1A7A4A;
}
```

## Slop Watch
- The complementary colored shadow (border red + shadow green) is the signature move; a grey shadow reads as generic card design
- The 0.5deg rotation on hover is optional but effective; beyond 1deg it reads as broken layout
