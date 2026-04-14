# White Futurism

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** Geist (or SF Pro Display as system fallback) — Apple-adjacent clarity
- **Body font:** Geist Regular
- **Tracking:** -0.02em | **Leading:** 1.5

## Colors
- **Background:** #FFFFFF (pure white)
- **Primary action:** #000000 (absolute black)
- **Accent:** #0066FF (single clean blue)
- **Elevation model:** ultra-thin 1px borders + micro drop shadows (0 1px 4px rgba(0,0,0,0.06))

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 280, damping: 28 }` — crisp, no overshoot
- **Enter animation:** fade 180ms ease-out; 2px Y shift only
- **Forbidden:** gradients, textures, glow, bounce, color beyond the 3-color palette

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8–12px; clean, product-grade rounding

## Code Pattern
```css
.white-futurist-card {
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04);
  padding: 32px;
}
```

## Slop Watch
- Any gradient introduction immediately collapses the "pure" register — even a background: #FAFAFA is a meaningful departure from the aesthetic
- Accent blue must stay at exactly one hue; a second accent color (even subtle) breaks the monastic restraint this style depends on
