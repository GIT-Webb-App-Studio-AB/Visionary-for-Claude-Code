# Soft Apocalypse

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Space Grotesk — neutral modern grotesque that shows through the dust
- **Body font:** Space Grotesk Regular
- **Tracking:** 0.01em | **Leading:** 1.55

## Colors
- **Background:** #C9A8A8 (dusty rose — the world ended gently)
- **Primary action:** #3A2A2A (ash dark)
- **Accent:** #8C7A7A (warm ash)
- **Elevation model:** soft desaturated shadows; the light is diffuse and gray-pink

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 180, damping: 30 }` — tired, not urgent
- **Enter animation:** drift — fade + 4px downward settle, 400ms ease-out; gravity is still working
- **Forbidden:** bright saturated color, sharp contrasts, energetic motion, clean whites

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 6–12px; soft apocalypse has worn edges, not sharp ones

## Code Pattern
```css
.soft-apocalypse-bg {
  background: linear-gradient(180deg, #C9A8A8 0%, #B89898 100%);
  filter: saturate(0.7) brightness(0.9);
}

.ash-card {
  background: rgba(58, 42, 42, 0.15);
  border: 1px solid rgba(58, 42, 42, 0.2);
  border-radius: 8px;
  backdrop-filter: blur(4px);
}
```

## Slop Watch
- Global desaturation via `filter: saturate(0.7)` affects all child elements including text — apply it to background layers only, not content containers
- The soft apocalypse is NOT grimdark; avoid black and aggressive reds; the palette is muted, dusty, resigned — not violent
