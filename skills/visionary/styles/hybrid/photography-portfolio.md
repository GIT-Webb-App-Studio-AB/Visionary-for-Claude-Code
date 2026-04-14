# Photography Portfolio

**Category:** hybrid
**Motion tier:** Expressive

## Typography
- **Display font:** Playfair Display Italic — editorial elegance that defers to the photographs
- **Body font:** Source Sans 3
- **Tracking:** 0.01em | **Leading:** 1.6

## Colors
- **Background:** #111111 (near-black — photographs read best on dark)
- **Primary action:** #FFFFFF (white type on dark)
- **Accent:** #888888 (secondary text grey)
- **Elevation model:** no shadows — photographs provide all visual depth

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 200, damping: 20 }`
- **Enter animation:** fade-drift — opacity 0→1 + translateY 8px→0, 400ms ease-out
- **Forbidden:** bounce, zoom on hover (scale distorts composition), warm backgrounds

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; photography is unframed, edge-to-edge

## Code Pattern
```css
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 4px;
}

.photo-item img {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  display: block;
  transition: opacity 400ms ease-out;
}

.photo-item:hover img {
  opacity: 0.85;
}
```

## Slop Watch
- Never scale photographs on hover — `transform: scale()` changes the composition the photographer intended; opacity reduction is the respectful hover treatment
- Gap between images must be ≤ 4px; larger gaps fragment the portfolio grid into isolated tiles
