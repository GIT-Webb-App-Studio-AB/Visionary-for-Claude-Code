# Stone Geological

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** Rockwell (or Arvo as web fallback) — slab weight evokes carved stone
- **Body font:** Arvo
- **Tracking:** 0.03em | **Leading:** 1.5

## Colors
- **Background:** #4A4A4A (slate grey)
- **Primary action:** #E8E0D5 (limestone pale)
- **Accent:** #8B7355 (sandstone)
- **Elevation model:** chiseled inset shadows; no glow, no soft blur

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 500, damping: 50 }` — near-rigid
- **Enter animation:** fade 150ms linear; stone does not spring
- **Forbidden:** bounce, glow, warm shadows, any elastic easing

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; stone is fractured or chiseled, never rounded

## Code Pattern
```css
.stone-surface {
  background: #4A4A4A;
  box-shadow:
    inset 2px 2px 4px rgba(0,0,0,0.5),
    inset -1px -1px 2px rgba(255,255,255,0.05);
  border-top: 1px solid #5A5A5A;
  border-left: 1px solid #5A5A5A;
}
```

## Slop Watch
- The chiseled shadow must use inset only — outer drop shadows make stone look levitating
- Avoid Inter or Helvetica body text; their geometric softness contradicts the geological weight
