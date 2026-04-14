# Glass Crystal

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Space Grotesk — clean, refracts well over complex backgrounds
- **Body font:** Inter
- **Tracking:** -0.01em | **Leading:** 1.5

## Colors
- **Background:** rgba(255,255,255,0.08) (clear glass panel)
- **Primary action:** rgba(255,255,255,0.9) (frosted white)
- **Accent:** rgba(100,200,255,0.6) (refracted cyan)
- **Elevation model:** backdrop-filter blur + prismatic edge highlights

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 260, damping: 20 }`
- **Enter animation:** scale 0.98 → 1 + blur 8px → 0, 280ms
- **Forbidden:** opaque backgrounds on glass panels, hard shadows, warm tones

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 12–20px; glass is formed, not machined

## Code Pattern
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
```

## Slop Watch
- backdrop-filter requires a non-opaque background — setting background to a solid color defeats the effect entirely
- Refraction accent must stay at ≤0.6 opacity; saturated solid color on glass reads as paint, not light
