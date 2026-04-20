---
id: solarpunk-dark
category: graphic
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, pastel, editorial, organic]
keywords: [solarpunk, dark, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Solarpunk Dark

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Nunito (or Quicksand) — rounded, communal, optimistic
- **Body font:** Nunito Regular
- **Tracking:** -0.005em | **Leading:** 1.65

## Colors
- **Background:** #2D5A27 (living leaf green — immersive)
- **Primary action:** #F4C430 (solar gold — energy)
- **Accent:** #7AC74F (bright growth green)
- **Elevation model:** botanical soft shadow; solar panels cast clean geometric shadows

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 160, damping: 16 }` — organic growth energy
- **Enter animation:** grow-emerge — scale 0.94 → 1 + fade upward, 350ms ease-out
- **Forbidden:** grey corporate tones, fossil fuel brown/black aesthetic, dystopian elements

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 16–32px; botanical curves, solar panel geometry

## Code Pattern
```css
.solarpunk-panel {
  background: linear-gradient(160deg, #2D5A27, #3A7A34);
  border: 1px solid rgba(244, 196, 48, 0.3);
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(45, 90, 39, 0.3);
}

.solar-accent {
  color: #F4C430;
  text-shadow: 0 0 12px rgba(244, 196, 48, 0.3);
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
- Leaf green backgrounds require white text (not black) for contrast — #F4C430 solar gold on #2D5A27 is 4.8:1 (passes AA); black text on this background fails
- This extended variant uses dark green background vs. the base solarpunk-futurism.md light variant; do not mix both in the same product
