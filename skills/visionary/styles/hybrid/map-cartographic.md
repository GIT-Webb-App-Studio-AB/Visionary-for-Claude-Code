# Map Cartographic

**Category:** hybrid
**Motion tier:** Subtle

## Typography
- **Display font:** Playfair Display — classical cartographic serif for place names and titles
- **Body font:** Crimson Pro
- **Tracking:** 0.04em | **Leading:** 1.55

## Colors
- **Background:** #E8DCC8 (aged parchment)
- **Primary action:** #2B2B2B (ink)
- **Accent:** #8B6914 (sepia/aged gold)
- **Elevation model:** subtle terrain shading; no hard shadows

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 180, damping: 28 }`
- **Enter animation:** subtle pan-zoom reveal, 400ms ease-out
- **Forbidden:** neon, bright primaries, digital precision aesthetics

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–4px; cartographic frames have small radius at most

## Code Pattern
```css
.map-container {
  background: #E8DCC8;
  background-image:
    repeating-linear-gradient(
      0deg, transparent, transparent 39px,
      rgba(43,43,43,0.06) 39px, rgba(43,43,43,0.06) 40px
    ),
    repeating-linear-gradient(
      90deg, transparent, transparent 39px,
      rgba(43,43,43,0.06) 39px, rgba(43,43,43,0.06) 40px
    );
  border: 2px solid #8B6914;
  padding: 24px;
}

.map-label {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2B2B2B;
}
```

## Slop Watch
- Cartographic grid lines must use `repeating-linear-gradient`, not CSS Grid — physical map grids are decorative, not layout-structural
- Place name labels must be italic — cartographic convention uses italic for water features and upright for land features; mixing breaks the geographic visual grammar
