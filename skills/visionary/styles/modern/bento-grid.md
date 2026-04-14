# Bento Grid

**Category:** modern
**Motion tier:** Expressive

## Typography
- **Display font:** Bricolage Grotesque — contemporary variable, engineered personality
- **Body font:** Bricolage Grotesque Regular
- **Tracking:** -0.01em | **Leading:** 1.4 | **Weight range:** 400/600/800

## Colors
- **Background:** #F4F4F5
- **Primary action:** #18181B
- **Accent:** #FFFFFF (card surfaces)
- **Elevation model:** subtle shadows (0 1px 3px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06))

## Motion
- **Tier:** Expressive
- **Spring tokens:** `stiffness: 180, damping: 20` — layout-aware spring
- **Enter animation:** stagger (each cell fades + translateY(16px) → 0, 60ms apart, starting cell 0)
- **Forbidden:** all-identical cell sizes, uniform animation timing (stagger required)

## Spacing
- **Base grid:** 8px; cell gap: 16px
- **Border-radius vocabulary:** 16px standard cells; 24px for hero/featured cells

## Code Pattern
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 160px;
  gap: 16px;
}
.bento-cell { background: #FFFFFF; border-radius: 16px; padding: 24px; }
.bento-cell--2x1 { grid-column: span 2; }
.bento-cell--1x2 { grid-row: span 2; }
.bento-cell--2x2 { grid-column: span 2; grid-row: span 2; border-radius: 24px; }
/* Stagger entry */
.bento-cell:nth-child(1) { animation-delay: 0ms; }
.bento-cell:nth-child(2) { animation-delay: 60ms; }
.bento-cell:nth-child(3) { animation-delay: 120ms; }
```

## Slop Watch
Do not make all cells identical size — the bento aesthetic requires irregular cell sizes (1×1, 2×1, 1×2, 2×2). A grid of equal rectangles is just a grid, not bento. Vary cell spans to create visual rhythm and hierarchy.
