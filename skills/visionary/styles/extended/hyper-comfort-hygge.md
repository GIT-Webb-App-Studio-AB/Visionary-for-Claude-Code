# Hyper Comfort Hygge

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Nunito (or Quicksand) — rounded, warm, approachable
- **Body font:** Nunito Regular
- **Tracking:** -0.005em | **Leading:** 1.7

## Colors
- **Background:** #F7F0E6 (warm oat)
- **Primary action:** #C4896F (clay)
- **Accent:** #7FAF8B (sage)
- **Elevation model:** ultra-soft ambient shadows; everything is wrapped in warmth

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 160, damping: 30 }` — cozy and gentle
- **Enter animation:** fade 250ms ease-out; 2px Y drift upward
- **Forbidden:** sharp edges, cold blues, hard shadows, anything crisp or clinical

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** pill-shaped (9999px) for interactive elements; 16–24px for containers

## Code Pattern
```css
.hygge-card {
  background: #FBF7F0;
  border-radius: 20px;
  box-shadow:
    0 2px 8px rgba(196, 137, 111, 0.08),
    0 8px 32px rgba(196, 137, 111, 0.06);
  padding: 32px;
  border: none;
}

.hygge-button {
  background: #C4896F;
  color: #FBF7F0;
  border-radius: 9999px;
  padding: 12px 28px;
  border: none;
  font-family: 'Nunito', sans-serif;
  font-weight: 600;
}
```

## Slop Watch
- Shadows must use warm-tinted colors (clay alpha), not grey — grey shadows introduce cold contrast that destroys the hygge warmth
- Never use sharp border-radius values (0–4px) on interactive elements; the pill shape is a core signal of the comfort aesthetic
