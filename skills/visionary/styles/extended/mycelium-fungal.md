# Mycelium Fungal

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Crimson Pro — organic serif with biological warmth
- **Body font:** Crimson Pro Regular
- **Tracking:** 0.005em | **Leading:** 1.7

## Colors
- **Background:** #1A1209 (forest floor dark)
- **Primary action:** #C8860A (spore amber)
- **Accent:** #4A7A3A (moss green)
- **Elevation model:** bioluminescent ambient glow; mycelium networks glow from within

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 160, damping: 28 }` — slow organic growth
- **Enter animation:** grow-in — scale 0.94 → 1 + fade, 500ms ease-out
- **Forbidden:** clean geometry, neon, fast snaps, white backgrounds

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** variable organic (12–40% asymmetric); mycelium has no uniform edges

## Code Pattern
```css
.mycelium-thread {
  stroke: rgba(200, 134, 10, 0.4);
  stroke-width: 1;
  stroke-linecap: round;
  filter: drop-shadow(0 0 4px rgba(200, 134, 10, 0.3));
}

.spore-node {
  background: radial-gradient(circle, #C8860A, #7A4A08);
  border-radius: 999px;
  box-shadow: 0 0 12px rgba(200, 134, 10, 0.4);
}
```

## Slop Watch
- Mycelium network lines must use SVG (stroke) not CSS borders — CSS borders can't render thin organic branching paths
- Bioluminescent glow must stay below 0.4 alpha spread; brighter glows shift from fungal to science-fiction
