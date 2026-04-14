# Glass Dashboard

**Category:** modern
**Motion tier:** Expressive

## Typography
- **Display font:** Syne — futuristic, pairs with depth-layer aesthetic
- **Body font:** DM Sans Regular
- **Tracking:** -0.01em | **Leading:** 1.4 | **Weight range:** 400/500/700

## Colors
- **Background:** #080B14
- **Primary action:** #22D3EE (cyan-400)
- **Accent:** #A78BFA (violet-400)
- **Elevation model:** glassmorphism — backdrop-filter blur, semi-transparent surfaces

## Motion
- **Tier:** Expressive
- **Spring tokens:** `stiffness: 160, damping: 18`
- **Enter animation:** glass-reveal (backdrop-filter blur 20px→4px + opacity 0→1, 400ms)
- **Forbidden:** opaque cards on dark bg (defeats glass effect), low contrast text on blurred surfaces

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 16px standard panels; 24px featured panels; 8px chips/badges

## Code Pattern
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
.glass-metric {
  color: #22D3EE;
  font-size: 2.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 20px rgba(34, 211, 238, 0.4);
}
```

## Slop Watch
Glass only works over content — a glass card over a flat color background is just a semi-transparent div. Ensure there is genuinely complex content behind glass surfaces (a gradient, pattern, or imagery). Text on glass must meet 4.5:1 contrast against the actual rendered backdrop, not theoretical color values.
