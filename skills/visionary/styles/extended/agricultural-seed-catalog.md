# Agricultural Seed Catalog

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Clarendon (or Rockwell) — Victorian slab serif of agricultural printing tradition
- **Body font:** Rockwell Regular
- **Tracking:** 0.01em | **Leading:** 1.6

## Colors
- **Background:** #F5EDD8 (cream paper — Burpee catalog warmth)
- **Primary action:** #1C1C1C (typeset black)
- **Accent:** #C4861A (harvest gold)
- **Elevation model:** subtle drop shadows; seed packets cast gentle weight

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 180, damping: 28 }`
- **Enter animation:** fade 200ms ease-out; catalog pages don't animate
- **Forbidden:** digital neon, dark modes, sans-serif primary type, modern tech signals

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 2–4px; seed packet labels have minor rounding

## Code Pattern
```css
.seed-catalog-card {
  background: #F5EDD8;
  border: 2px solid #C4861A;
  border-radius: 4px;
  box-shadow: 3px 3px 0 rgba(196, 134, 26, 0.3);
  padding: 16px;
}

.variety-name {
  font-family: 'Rockwell', 'Courier New', serif;
  font-weight: 700;
  font-style: italic;
  color: #1C1C1C;
}
```

## Slop Watch
- Slab serif must be loaded properly — system fallbacks (Georgia, Times) lose the Victorian agricultural character that Clarendon/Rockwell provides
- Harvest gold border shadow must use 0-blur, hard-edge offset — blurred shadows read as modern design, not letterpress printing
