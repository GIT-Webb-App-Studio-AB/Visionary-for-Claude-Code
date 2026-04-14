# Grainy Blur (Grainient)

**Category:** extended
**Motion tier:** Expressive

## Typography
- **Display font:** Bricolage Grotesque — organic variable-width pairs well with grain texture
- **Body font:** Bricolage Grotesque Regular
- **Tracking:** -0.01em | **Leading:** 1.55

## Colors
- **Background:** Gradient + SVG grain noise filter (e.g., #FF3B6B → #6B3BFF)
- **Primary action:** #FFFFFF (white on gradient)
- **Accent:** Gradient-derived highlight
- **Elevation model:** blur + grain creates depth; no traditional shadows

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 220, damping: 20 }`
- **Enter animation:** blur-reveal — blur 12px → 0 + fade, 400ms ease-out
- **Forbidden:** flat solid backgrounds without grain, sharp pixelated elements

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 16–24px; grain softens sharp edges philosophically

## Code Pattern
```css
.grainient-bg {
  filter: url(#grain);
  background: linear-gradient(135deg, #FF3B6B, #6B3BFF);
}

/* SVG grain filter — inline in HTML or referenced */
/* <filter id="grain">
     <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
     <feColorMatrix type="saturate" values="0"/>
     <feBlend in="SourceGraphic" mode="overlay" result="blend"/>
     <feComposite in="blend" in2="SourceGraphic" operator="in"/>
   </filter> */
```

## Slop Watch
- SVG grain filter must be `filter: url(#grain)` on the element — CSS `filter: blur()` alone produces different results and doesn't add grain texture
- Gradient colors must have ≥ 40° hue separation to remain visually interesting through the grain layer; similar hues flatten to mud
