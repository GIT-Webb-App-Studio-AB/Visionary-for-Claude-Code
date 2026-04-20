---
id: stone-mineral
category: extended
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, pastel]
keywords: [stone, mineral, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Stone Mineral

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** EB Garamond — classical weight evokes geological time and museum labels
- **Body font:** EB Garamond Regular
- **Tracking:** 0.02em | **Leading:** 1.6

## Colors
- **Background:** #E8E4DC (granite pale)
- **Primary action:** #2A2A2A (basalt dark)
- **Accent:** #4A8B8C (mineral teal — malachite reference)
- **Elevation model:** striated shadow following mineral layers; no soft blur

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 400, damping: 45 }` — geological weight, near-static
- **Enter animation:** fault-reveal — 150ms linear fade; stone does not animate expressively
- **Forbidden:** bounce, glow, warm shadows, organic edges

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; minerals fracture, they don't curve

## Code Pattern
```css
.mineral-surface {
  background: #E8E4DC;
  background-image: repeating-linear-gradient(
    170deg,
    transparent 0px, transparent 8px,
    rgba(42,42,42,0.04) 8px, rgba(42,42,42,0.04) 9px
  );
  border: 1px solid rgba(42,42,42,0.2);
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
- Mineral striation lines must be near-invisible (0.04 opacity) — heavier lines read as wood grain or wallpaper rather than geological strata
- Accent teal (#4A8B8C) must be used sparingly — malachite is a rare inclusion, not the dominant material
