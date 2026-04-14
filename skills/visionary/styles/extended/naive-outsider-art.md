# Naive Outsider Art

**Category:** extended
**Motion tier:** Expressive

## Typography
- **Display font:** Caveat (or Patrick Hand) — handwritten authenticity
- **Body font:** Caveat Regular
- **Tracking:** 0.01em | **Leading:** 1.6

## Colors
- **Background:** #F9F5ED (off-white — aged paper)
- **Primary action:** #1A1A1A (pencil/marker black)
- **Accent:** Primary crayon set — #FF0000, #0000FF, #FFFF00, #008000 (one at a time)
- **Elevation model:** hand-drawn shadow strokes; no CSS shadows

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 180, damping: 16 }`
- **Enter animation:** draw-on — SVG stroke-dashoffset animation, like being drawn in real-time
- **Forbidden:** clean geometric shapes, drop shadows, professional font rendering, digital perfection

## Spacing
- **Base grid:** irregular — hand-drawn doesn't respect grids
- **Border-radius vocabulary:** organic hand-drawn (0 to very variable); never machine-perfect curves

## Code Pattern
```css
.handdrawn-box {
  border: 2px solid #1A1A1A;
  border-radius: 2px 4px 3px 5px / 3px 2px 5px 2px; /* slightly uneven */
  background: #F9F5ED;
  position: relative;
}

.handdrawn-box::after {
  content: '';
  position: absolute;
  inset: -2px;
  border: 1px solid rgba(26,26,26,0.15);
  border-radius: 3px 6px 4px 7px / 5px 3px 6px 4px;
}
```

## Slop Watch
- Handwriting fonts at body size (< 16px) become illegible; use at display size only, or pair with a readable system font for body text
- Asymmetric border-radius values must vary across elements — using the same asymmetry on all elements reveals the pattern and breaks authenticity
