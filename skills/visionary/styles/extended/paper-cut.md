# Paper Cut

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Nunito ExtraBold — rounded, approachable, complements the hand-cut aesthetic
- **Body font:** Nunito Regular
- **Tracking:** 0em | **Leading:** 1.6

## Colors
- **Background:** #F7F3ED (cream base layer)
- **Primary action:** #E84545 (cut red layer)
- **Accent:** #2D6A4F (forest green layer)
- **Elevation model:** layered drop shadows simulating paper depth; each layer +2px Y +1px blur

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 220, damping: 18 }`
- **Enter animation:** layers slide-in sequentially with 40ms stagger, bottom layer first
- **Forbidden:** glow, metallic sheen, sharp geometric transitions

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–2px; cut paper has clean edges, not machined curves

## Code Pattern
```css
.paper-layer {
  position: relative;
  box-shadow:
    2px 2px 0 rgba(0,0,0,0.08),
    4px 4px 0 rgba(0,0,0,0.06),
    6px 6px 0 rgba(0,0,0,0.04);
}

.paper-layer--foreground {
  transform: translateY(-4px);
}
```

## Slop Watch
- Each layer shadow must step in consistent increments — random blur values break the physical depth illusion
- Do not use border-radius > 2px; rounded paper cut silhouettes lose the crisp cut-with-scissors authenticity
