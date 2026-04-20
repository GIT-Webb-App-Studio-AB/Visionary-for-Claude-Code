---
id: photography-portfolio
category: hybrid
motion_tier: Expressive
density: sparse
locale_fit: [all]
palette_tags: [dark, light, neon, editorial]
keywords: [photography, portfolio, hybrid]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Photography Portfolio

**Category:** hybrid
**Motion tier:** Expressive

## Typography
- **Display font:** Playfair Display Italic — editorial elegance that defers to the photographs
- **Body font:** Source Sans 3
- **Tracking:** 0.01em | **Leading:** 1.6

## Colors
- **Background:** #111111 (near-black — photographs read best on dark)
- **Primary action:** #FFFFFF (white type on dark)
- **Accent:** #888888 (secondary text grey)
- **Elevation model:** no shadows — photographs provide all visual depth

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 200, damping: 20 }`
- **Enter animation:** fade-drift — opacity 0→1 + translateY 8px→0, 400ms ease-out
- **Forbidden:** bounce, zoom on hover (scale distorts composition), warm backgrounds

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; photography is unframed, edge-to-edge

## Code Pattern
```css
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 4px;
}

.photo-item img {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  display: block;
  transition: opacity 400ms ease-out;
}

.photo-item:hover img {
  opacity: 0.85;
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
- Never scale photographs on hover — `transform: scale()` changes the composition the photographer intended; opacity reduction is the respectful hover treatment
- Gap between images must be ≤ 4px; larger gaps fragment the portfolio grid into isolated tiles
