# De Stijl

**Category:** historical
**Motion tier:** Subtle

## Typography
- **Display font:** Futura — geometric purity aligns with neoplastic philosophy
- **Body font:** Futura Book
- **Tracking:** 0.02em | **Leading:** 1.3 | **Weight range:** 400/700

## Colors
- **Background:** #FFFFFF
- **Primary action:** #FF0000
- **Accent:** #0000FF
- **Elevation model:** none — color planes are structure

## Motion
- **Tier:** Subtle
- **Spring tokens:** `stiffness: 350, damping: 35`
- **Enter animation:** fade 100ms linear
- **Forbidden:** diagonal elements, curves, organic shapes, gradients

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px — absolute; circles and curves are categorically forbidden

## Code Pattern
```css
.destijl-composition {
  display: grid;
  grid-template-columns: 3fr 1fr;
  grid-template-rows: auto 8px auto;
  gap: 0;
}
.destijl-divider {
  background: #000000;
  height: 8px;
  grid-column: 1 / -1;
}
.destijl-block-red   { background: #FF0000; }
.destijl-block-blue  { background: #0000FF; }
.destijl-block-yellow { background: #FFFF00; }
```

## Slop Watch
Strict horizontals and verticals only. The moment a diagonal appears, it is no longer De Stijl. No gradients between color blocks — they must be pure, flat, and separated by black lines.
