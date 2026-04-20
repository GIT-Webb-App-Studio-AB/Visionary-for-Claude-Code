---
id: hyper-comfort-hygge
category: extended
motion_tier: Subtle
density: sparse
locale_fit: [all]
palette_tags: [pastel, trust]
keywords: [hyper, comfort, hygge, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Hyper Comfort Hygge

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Nunito (or Quicksand) — rounded, warm, approachable
- **Body font:** Nunito Regular
- **Tracking:** -0.005em | **Leading:** 1.7

## Colors
- **Background:** #F7F0E6 (warm oat)
- **Primary action:** #C4896F (clay)
- **Accent:** #7FAF8B (sage)
- **Elevation model:** ultra-soft ambient shadows; everything is wrapped in warmth

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 160, damping: 30 }` — cozy and gentle
- **Enter animation:** fade 250ms ease-out; 2px Y drift upward
- **Forbidden:** sharp edges, cold blues, hard shadows, anything crisp or clinical

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** pill-shaped (9999px) for interactive elements; 16–24px for containers

## Code Pattern
```css
.hygge-card {
  background: #FBF7F0;
  border-radius: 20px;
  box-shadow:
    0 2px 8px rgba(196, 137, 111, 0.08),
    0 8px 32px rgba(196, 137, 111, 0.06);
  padding: 32px;
  border: none;
}

.hygge-button {
  background: #C4896F;
  color: #FBF7F0;
  border-radius: 9999px;
  padding: 12px 28px;
  border: none;
  font-family: 'Nunito', sans-serif;
  font-weight: 600;
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
- Shadows must use warm-tinted colors (clay alpha), not grey — grey shadows introduce cold contrast that destroys the hygge warmth
- Never use sharp border-radius values (0–4px) on interactive elements; the pill shape is a core signal of the comfort aesthetic
