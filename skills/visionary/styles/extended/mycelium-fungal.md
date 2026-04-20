---
id: mycelium-fungal
category: extended
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, earth, organic]
keywords: [mycelium, fungal, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Mycelium Fungal

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Crimson Pro — organic serif with biological warmth
- **Body font:** Crimson Pro Regular
- **Tracking:** 0.005em | **Leading:** 1.7

## Colors
- **Background:** #1A1209 (forest floor dark)
- **Primary action:** #C8860A (spore amber)
- **Accent:** #4A7A3A (moss green)
- **Elevation model:** bioluminescent ambient glow; mycelium networks glow from within

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 160, damping: 28 }` — slow organic growth
- **Enter animation:** grow-in — scale 0.94 → 1 + fade, 500ms ease-out
- **Forbidden:** clean geometry, neon, fast snaps, white backgrounds

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** variable organic (12–40% asymmetric); mycelium has no uniform edges

## Code Pattern
```css
.mycelium-thread {
  stroke: rgba(200, 134, 10, 0.4);
  stroke-width: 1;
  stroke-linecap: round;
  filter: drop-shadow(0 0 4px rgba(200, 134, 10, 0.3));
}

.spore-node {
  background: radial-gradient(circle, #C8860A, #7A4A08);
  border-radius: 999px;
  box-shadow: 0 0 12px rgba(200, 134, 10, 0.4);
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
- Mycelium network lines must use SVG (stroke) not CSS borders — CSS borders can't render thin organic branching paths
- Bioluminescent glow must stay below 0.4 alpha spread; brighter glows shift from fungal to science-fiction
