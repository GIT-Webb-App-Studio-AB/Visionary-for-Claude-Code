# Stone Mineral

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** EB Garamond — classical weight evokes geological time and museum labels
- **Body font:** EB Garamond Regular
- **Tracking:** 0.02em | **Leading:** 1.6

## Colors
- **Background:** #E8E4DC (granite pale)
- **Primary action:** #2A2A2A (basalt dark)
- **Accent:** #4A8B8C (mineral teal — malachite reference)
- **Elevation model:** striated shadow following mineral layers; no soft blur

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 400, damping: 45 }` — geological weight, near-static
- **Enter animation:** fault-reveal — 150ms linear fade; stone does not animate expressively
- **Forbidden:** bounce, glow, warm shadows, organic edges

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; minerals fracture, they don't curve

## Code Pattern
```css
.mineral-surface {
  background: #E8E4DC;
  background-image: repeating-linear-gradient(
    170deg,
    transparent 0px, transparent 8px,
    rgba(42,42,42,0.04) 8px, rgba(42,42,42,0.04) 9px
  );
  border: 1px solid rgba(42,42,42,0.2);
}
```

## Slop Watch
- Mineral striation lines must be near-invisible (0.04 opacity) — heavier lines read as wood grain or wallpaper rather than geological strata
- Accent teal (#4A8B8C) must be used sparingly — malachite is a rare inclusion, not the dominant material
