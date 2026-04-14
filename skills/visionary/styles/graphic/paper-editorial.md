# Paper Editorial

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** Playfair Display — high-contrast serif evokes broadsheet authority
- **Body font:** Source Serif 4
- **Tracking:** -0.01em | **Leading:** 1.65

## Colors
- **Background:** #F5F0E8 (newsprint)
- **Primary action:** #1A1008 (ink black)
- **Accent:** #8B1A1A (editorial red)
- **Elevation model:** subtle drop shadows, no glow

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 180, damping: 28 }`
- **Enter animation:** fade-in 200ms ease-out
- **Forbidden:** bounce, scale pop, neon glow

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–2px only; editorial content uses no rounding

## Code Pattern
```css
.editorial-layout {
  column-count: 2;
  column-gap: 40px;
  column-rule: 1px solid #C8B89A;
  orphans: 3;
  widows: 3;
}
```

## Slop Watch
- Avoid web-safe Garamond fallbacks — load Playfair Display properly or the display contrast collapses
- Never apply border-radius > 2px; rounded cards destroy the broadsheet register
