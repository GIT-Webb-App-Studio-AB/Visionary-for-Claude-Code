# Concrete Brutalist Material

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** Space Grotesk Bold — industrial weight, no humanist softness
- **Body font:** Space Grotesk Regular
- **Tracking:** 0.02em | **Leading:** 1.4

## Colors
- **Background:** #C8C8C8 (raw concrete)
- **Primary action:** #1C1C1C (formwork black)
- **Accent:** #6B7280 (aggregate grey)
- **Elevation model:** no shadows; depth from offset outlines and raw borders

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 400, damping: 40 }` — stiff, no spring
- **Enter animation:** translate Y 4px → 0, 120ms linear
- **Forbidden:** soft easing, rounded shadows, any glow

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px everywhere — radius is ideologically forbidden

## Code Pattern
```css
.brutalist-card {
  border: 3px solid #1C1C1C;
  box-shadow: 6px 6px 0 #1C1C1C;
  border-radius: 0;
  background: #C8C8C8;
}
```

## Slop Watch
- Do not add hover transitions longer than 100ms — sluggish transitions break the raw aesthetic
- Never introduce border-radius; even 1px signals a design system softness inconsistent with this register
