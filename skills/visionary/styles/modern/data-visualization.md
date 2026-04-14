# Data Visualization

**Category:** modern
**Motion tier:** Subtle

## Typography
- **Display font:** DM Sans — neutral, legible, numeric-capable
- **Body font:** DM Sans Regular
- **Tracking:** 0em | **Leading:** 1.4 | **Weight range:** 400/500/700; tabular-nums mandatory

## Colors
- **Background:** #0D1117
- **Primary action:** #58A6FF
- **Accent:** #3FB950
- **Elevation model:** none — chart surfaces at #161B22; axis lines at rgba(255,255,255,0.1)

## Motion
- **Tier:** Subtle
- **Spring tokens:** `stiffness: 300, damping: 30` — precise, no overshoot on data transitions
- **Enter animation:** draw-in for lines (stroke-dashoffset), grow-up for bars (scaleY from bottom)
- **Forbidden:** decorative motion, 3D chart effects, shadows on chart elements

## Spacing
- **Base grid:** 8px; chart padding: minimum 40px top, 24px sides for label clearance
- **Border-radius vocabulary:** 2px for bar chart bars; 0px for everything else

## Code Pattern
```css
.dataviz-number {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
  font-size: 2rem;
  font-weight: 700;
  color: #58A6FF;
}
.dataviz-surface {
  background: #161B22;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 24px;
}
.dataviz-axis-label {
  font-size: 0.75rem;
  fill: rgba(255, 255, 255, 0.5);
  font-family: 'DM Sans', sans-serif;
}
```

## Slop Watch
Tabular-nums is non-negotiable — numbers in data tables that shift width as values change destroy scanability. Apply `font-variant-numeric: tabular-nums` universally to all metric displays. Never use proportional figures in a data context.
