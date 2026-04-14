# Risograph Screen Print

**Category:** hybrid
**Motion tier:** Subtle

## Typography
- **Display font:** Space Mono or Courier New — matches risograph's mechanical type register
- **Body font:** Space Mono Regular
- **Tracking:** 0.02em | **Leading:** 1.5

## Colors
- **Background:** #F5F0E8 (off-white with grain)
- **Primary action:** #1A1A1A (riso black)
- **Accent:** Fluorescent risograph ink — CMYK-limited 2-3 colors only (e.g., #FF4B00 riso red + #00B4D8 riso teal)
- **Elevation model:** mix-blend-mode: multiply for color overlaps; no elevation

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 200, damping: 28 }`
- **Enter animation:** fade 200ms ease-out; no movement
- **Forbidden:** clean digital gradients, smooth color blends, more than 3 ink colors

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; risograph printing is rectilinear

## Code Pattern
```css
.riso-layer {
  mix-blend-mode: multiply;
  opacity: 0.85; /* slight transparency simulates ink absorption variation */
}

.riso-background {
  background-color: #F5F0E8;
  /* SVG grain noise overlay */
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
}
```

## Slop Watch
- `mix-blend-mode: multiply` is essential for color overlap — without it, layered ink colors appear as separate opaque shapes rather than printed overlap
- Limit to 2-3 ink colors maximum; real risograph machines use one drum per color, making 4+ color prints expensive and rare
