# Underwater Aquatic

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Raleway — thin strokes suggest light through water
- **Body font:** Raleway Regular
- **Tracking:** 0.02em | **Leading:** 1.7

## Colors
- **Background:** #001F3F (abyssal blue)
- **Primary action:** #00B4D8 (shallow water blue)
- **Accent:** #90E0EF (caustic light pale)
- **Elevation model:** volumetric depth; deeper elements darker, caustic light from above

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 80, damping: 14 }` — fluid resistance
- **Enter animation:** float up from -10px with sine-wave drift, 600ms
- **Forbidden:** sharp snap, hard edges, warm colors, dry-land metaphors

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 20–40px; water shapes everything smooth

## Code Pattern
```css
@keyframes caustic-light {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  33%       { opacity: 0.7; transform: scale(1.1) translate(2px, -1px); }
  66%       { opacity: 0.5; transform: scale(0.95) translate(-1px, 2px); }
}

.caustic-overlay {
  background: radial-gradient(ellipse at 30% 20%, rgba(144, 224, 239, 0.15), transparent 60%);
  animation: caustic-light 4s ease-in-out infinite;
  pointer-events: none;
}
```

## Slop Watch
- Caustic light animation must run at ≥ 3s duration — faster caustics read as UI feedback rather than ambient oceanic light
- Do not use blur filters on the caustic overlay for performance reasons; radial-gradient opacity variation achieves the effect without repaints
