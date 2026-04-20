---
id: risograph-screen-print
category: hybrid
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [risograph, screen, print, hybrid]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

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

## Accessibility

### Contrast
Body text must clear 4.5:1 (WCAG 2.2 AA) AND APCA Lc ≥ 75. Large text / UI labels: 3:1 and Lc ≥ 60. Run axe-core + apca-w3 during the critique loop.

### Focus
Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.

### Motion
Under `prefers-reduced-motion: reduce`, keep opacity transitions but drop transform/scale/translate — transform is a vestibular trigger. No autoplay exceeds 5 s without a pause control.

### Touch target
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
- `mix-blend-mode: multiply` is essential for color overlap — without it, layered ink colors appear as separate opaque shapes rather than printed overlap
- Limit to 2-3 ink colors maximum; real risograph machines use one drum per color, making 4+ color prints expensive and rare
