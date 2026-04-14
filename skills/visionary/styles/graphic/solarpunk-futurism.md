# Solarpunk Futurism

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Nunito — rounded, communal, optimistic weight
- **Body font:** Nunito Regular
- **Tracking:** -0.005em | **Leading:** 1.65

## Colors
- **Background:** #F0F7E6 (sunlit leaf)
- **Primary action:** #4A7C59 (deep botanical green)
- **Accent:** #E8B84B (solar gold)
- **Elevation model:** warm ambient shadow; soft botanical blur

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 160, damping: 16 }` — gentle, growing
- **Enter animation:** grow from 0.95 scale + fade, 320ms ease-out; organic, not mechanical
- **Forbidden:** dystopian grit, neon, hard geometric edges, dark backgrounds

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 12–24px; organic growth curves

## Code Pattern
```css
.solarpunk-card {
  background: linear-gradient(135deg, #F0F7E6 0%, #E8F5DA 100%);
  border: 1px solid rgba(74, 124, 89, 0.2);
  border-radius: 20px;
  box-shadow:
    0 4px 24px rgba(74, 124, 89, 0.12),
    0 1px 4px rgba(74, 124, 89, 0.08);
}
```

## Slop Watch
- Solarpunk is optimistic ecology, not nature photography — avoid literal leaf/plant imagery in CSS; the palette carries the register
- Gold accent must stay warm (#E8B84B range); a cool yellow reads as caution/warning and undermines the solar warmth
