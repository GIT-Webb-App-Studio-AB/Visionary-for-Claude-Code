# Solarpunk Futurism (Extended)

**Category:** extended
**Motion tier:** Expressive

## Typography
- **Display font:** Nunito (or Quicksand) — rounded, communal, optimistic
- **Body font:** Nunito Regular
- **Tracking:** -0.005em | **Leading:** 1.65

## Colors
- **Background:** #2D5A27 (living leaf green — immersive)
- **Primary action:** #F4C430 (solar gold — energy)
- **Accent:** #7AC74F (bright growth green)
- **Elevation model:** botanical soft shadow; solar panels cast clean geometric shadows

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 160, damping: 16 }` — organic growth energy
- **Enter animation:** grow-emerge — scale 0.94 → 1 + fade upward, 350ms ease-out
- **Forbidden:** grey corporate tones, fossil fuel brown/black aesthetic, dystopian elements

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 16–32px; botanical curves, solar panel geometry

## Code Pattern
```css
.solarpunk-panel {
  background: linear-gradient(160deg, #2D5A27, #3A7A34);
  border: 1px solid rgba(244, 196, 48, 0.3);
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(45, 90, 39, 0.3);
}

.solar-accent {
  color: #F4C430;
  text-shadow: 0 0 12px rgba(244, 196, 48, 0.3);
}
```

## Slop Watch
- Leaf green backgrounds require white text (not black) for contrast — #F4C430 solar gold on #2D5A27 is 4.8:1 (passes AA); black text on this background fails
- This extended variant uses dark green background vs. the base solarpunk-futurism.md light variant; do not mix both in the same product
