# Hero Character Sculpture

**Category:** extended
**Motion tier:** Kinetic

## Typography
- **Display font:** Syne 800 — heavy geometric weight matches sculptural mass
- **Body font:** Syne Regular
- **Tracking:** 0.02em | **Leading:** 1.3

## Colors
- **Background:** #111111 (gallery black)
- **Primary action:** Hero palette (character-defined)
- **Accent:** Rim light color (contrasting to hero palette)
- **Elevation model:** sculptural — multiple light sources create dimensional shadow volumes

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 180, damping: 14 }` — heroic overshoot
- **Enter animation:** hero enters from below with scale 0.9 → 1.02 → 1, 500ms
- **Forbidden:** flat design, 2D illustration style, soft pastels

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px for frame/pedestal; 999px for power indicators

## Code Pattern
```css
.hero-sculpture {
  filter: drop-shadow(0 8px 32px rgba(0,0,0,0.6))
          drop-shadow(0 -2px 8px rgba(255,255,255,0.1));
  /* Rim light simulation */
}

.hero-name {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
```

## Slop Watch
- `drop-shadow` (not `box-shadow`) must be used on character images — box-shadow clips to the element rectangle, not the character silhouette
- Rim light (white edge glow) must be subtle (0.1–0.15 alpha); bright rim light reads as a selection state, not ambient lighting
