---
id: agricultural-seed-catalog
category: extended
motion_tier: Subtle
density: dense
locale_fit: [all]
palette_tags: [dark, light, neon, editorial]
keywords: [agricultural, seed, catalog, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Agricultural Seed Catalog

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Clarendon (or Rockwell) — Victorian slab serif of agricultural printing tradition
- **Body font:** Rockwell Regular
- **Tracking:** 0.01em | **Leading:** 1.6

## Colors
- **Background:** #F5EDD8 (cream paper — Burpee catalog warmth)
- **Primary action:** #1C1C1C (typeset black)
- **Accent:** #C4861A (harvest gold)
- **Elevation model:** subtle drop shadows; seed packets cast gentle weight

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 180, damping: 28 }`
- **Enter animation:** fade 200ms ease-out; catalog pages don't animate
- **Forbidden:** digital neon, dark modes, sans-serif primary type, modern tech signals

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 2–4px; seed packet labels have minor rounding

## Code Pattern
```css
.seed-catalog-card {
  background: #F5EDD8;
  border: 2px solid #C4861A;
  border-radius: 4px;
  box-shadow: 3px 3px 0 rgba(196, 134, 26, 0.3);
  padding: 16px;
}

.variety-name {
  font-family: 'Rockwell', 'Courier New', serif;
  font-weight: 700;
  font-style: italic;
  color: #1C1C1C;
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
- Slab serif must be loaded properly — system fallbacks (Georgia, Times) lose the Victorian agricultural character that Clarendon/Rockwell provides
- Harvest gold border shadow must use 0-blur, hard-edge offset — blurred shadows read as modern design, not letterpress printing
