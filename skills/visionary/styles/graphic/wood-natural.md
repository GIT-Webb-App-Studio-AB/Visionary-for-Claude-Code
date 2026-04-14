# Wood Natural

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** Bitter — slab serif with warmth, echoes wood grain direction
- **Body font:** Source Serif 4
- **Tracking:** 0.005em | **Leading:** 1.65

## Colors
- **Background:** #8B5E3C (mid-oak)
- **Primary action:** #F5E6C8 (pale birch)
- **Accent:** #4A2C0A (walnut dark)
- **Elevation model:** grain-following shadow lines; no hard drop shadows

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 180, damping: 30 }`
- **Enter animation:** fade 200ms ease-out
- **Forbidden:** metallic sheen, neon, bounce

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 2–6px; wood joints have slight chamfer

## Code Pattern
```css
.wood-panel {
  background: linear-gradient(
    160deg,
    #8B5E3C 0%,
    #9A6B42 20%,
    #7A5230 45%,
    #8B5E3C 70%,
    #A07248 100%
  );
  background-size: 100% 100%;
}
```

## Slop Watch
- Do not tile the grain pattern — grain runs in one consistent direction across the panel
- Avoid system serif fallbacks; their uniform stroke weight removes the hand-hewn warmth
