---
id: grainy-blur
category: extended
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [light, neon, pastel]
keywords: [grainy, blur, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

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
- SVG grain filter must be `filter: url(#grain)` on the element — CSS `filter: blur()` alone produces different results and doesn't add grain texture
- Gradient colors must have ≥ 40° hue separation to remain visually interesting through the grain layer; similar hues flatten to mud
