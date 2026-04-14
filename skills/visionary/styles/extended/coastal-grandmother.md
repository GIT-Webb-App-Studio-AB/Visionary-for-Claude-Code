# Coastal Grandmother

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Lora — warm serif with a lived-in quality
- **Body font:** Source Serif 4
- **Tracking:** 0.005em | **Leading:** 1.7

## Colors
- **Background:** #F5F0E8 (linen)
- **Primary action:** #3D5A7A (faded navy)
- **Accent:** #6B9E9F (sea glass)
- **Elevation model:** soft ambient shadows; sun-bleached, no sharp contrasts

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 160, damping: 28 }` — unhurried, like a summer afternoon
- **Enter animation:** gentle drift — fade + 4px Y, 350ms ease-out
- **Forbidden:** bright saturated colors, fast animations, hard edges, dark modes

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8–16px; sun-worn surfaces have gentle curves

## Code Pattern
```css
.coastal-card {
  background: #F5F0E8;
  border: 1px solid rgba(107, 158, 159, 0.3);
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(61, 90, 122, 0.08);
  padding: 32px;
}

.coastal-accent-line {
  border-top: 2px solid #D4B896; /* sand */
  margin: 24px 0;
}
```

## Slop Watch
- Colors must be desaturated (HSL saturation ≤ 40%) — vibrant colors break the sun-faded, gentle register of this aesthetic
- Sea glass accent must not appear on more than 20% of UI surface; it is a detail color, not a dominant
