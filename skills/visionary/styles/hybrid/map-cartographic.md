---
id: map-cartographic
category: hybrid
motion_tier: Subtle
density: dense
locale_fit: [all]
palette_tags: [neon, editorial]
keywords: [map, cartographic, hybrid]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Map Cartographic

**Category:** hybrid
**Motion tier:** Subtle

## Typography
- **Display font:** Playfair Display — classical cartographic serif for place names and titles
- **Body font:** Crimson Pro
- **Tracking:** 0.04em | **Leading:** 1.55

## Colors
- **Background:** #E8DCC8 (aged parchment)
- **Primary action:** #2B2B2B (ink)
- **Accent:** #8B6914 (sepia/aged gold)
- **Elevation model:** subtle terrain shading; no hard shadows

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 180, damping: 28 }`
- **Enter animation:** subtle pan-zoom reveal, 400ms ease-out
- **Forbidden:** neon, bright primaries, digital precision aesthetics

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–4px; cartographic frames have small radius at most

## Code Pattern
```css
.map-container {
  background: #E8DCC8;
  background-image:
    repeating-linear-gradient(
      0deg, transparent, transparent 39px,
      rgba(43,43,43,0.06) 39px, rgba(43,43,43,0.06) 40px
    ),
    repeating-linear-gradient(
      90deg, transparent, transparent 39px,
      rgba(43,43,43,0.06) 39px, rgba(43,43,43,0.06) 40px
    );
  border: 2px solid #8B6914;
  padding: 24px;
}

.map-label {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2B2B2B;
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
- Cartographic grid lines must use `repeating-linear-gradient`, not CSS Grid — physical map grids are decorative, not layout-structural
- Place name labels must be italic — cartographic convention uses italic for water features and upright for land features; mixing breaks the geographic visual grammar
