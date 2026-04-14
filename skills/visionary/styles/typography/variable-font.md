# Variable Font

**Category:** typography-led
**Motion tier:** Expressive

## Typography
- **Display font:** Fraunces (variable: opsz, wght, SOFT, WONK axes)
- **Body font:** Inter (variable: wght, slnt axes)
- **Weight range:** 100–900 (continuous variable)
- **Tracking:** -0.02em display, 0.01em body
- **Leading:** 1.1 display, 1.6 body

## Colors
- **Background:** #F5F0E8
- **Primary action:** #1A1A1A
- **Accent:** #7C3AED
- **Elevation model:** subtle shadows (0 2px 8px rgba(0,0,0,0.08))

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 200, damping: 30, mass: 1
- **Enter animation:** font-weight interpolates from 100→700 on scroll intersection
- **Forbidden:** snapping between weight values, ignoring variable axes beyond weight

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 6px default, 12px cards, 999px tags — consistent rounding

## Code Pattern
```css
@supports (font-variation-settings: normal) {
  .variable-headline {
    font-family: 'Fraunces', serif;
    font-variation-settings: 'wght' 300, 'SOFT' 50, 'opsz' 72;
    transition: font-variation-settings 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .variable-headline:hover {
    font-variation-settings: 'wght' 800, 'SOFT' 100, 'opsz' 144;
  }
}
```

## Slop Watch
- Only using the weight axis — SOFT and WONK axes on Fraunces are what differentiate this from regular bold/thin
- Animating on every scroll pixel instead of at intersection thresholds — produces motion sickness, not delight
