---
id: naive-outsider-art
category: extended
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [naive, outsider, art, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Naive Outsider Art

**Category:** extended
**Motion tier:** Expressive

## Typography
- **Display font:** Caveat (or Patrick Hand) — handwritten authenticity
- **Body font:** Caveat Regular
- **Tracking:** 0.01em | **Leading:** 1.6

## Colors
- **Background:** #F9F5ED (off-white — aged paper)
- **Primary action:** #1A1A1A (pencil/marker black)
- **Accent:** Primary crayon set — #FF0000, #0000FF, #FFFF00, #008000 (one at a time)
- **Elevation model:** hand-drawn shadow strokes; no CSS shadows

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 180, damping: 16 }`
- **Enter animation:** draw-on — SVG stroke-dashoffset animation, like being drawn in real-time
- **Forbidden:** clean geometric shapes, drop shadows, professional font rendering, digital perfection

## Spacing
- **Base grid:** irregular — hand-drawn doesn't respect grids
- **Border-radius vocabulary:** organic hand-drawn (0 to very variable); never machine-perfect curves

## Code Pattern
```css
.handdrawn-box {
  border: 2px solid #1A1A1A;
  border-radius: 2px 4px 3px 5px / 3px 2px 5px 2px; /* slightly uneven */
  background: #F9F5ED;
  position: relative;
}

.handdrawn-box::after {
  content: '';
  position: absolute;
  inset: -2px;
  border: 1px solid rgba(26,26,26,0.15);
  border-radius: 3px 6px 4px 7px / 5px 3px 6px 4px;
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
- Handwriting fonts at body size (< 16px) become illegible; use at display size only, or pair with a readable system font for body text
- Asymmetric border-radius values must vary across elements — using the same asymmetry on all elements reveals the pattern and breaks authenticity
