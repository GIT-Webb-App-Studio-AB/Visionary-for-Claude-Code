---
id: wood-natural
category: graphic
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, neon]
keywords: [wood, natural, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Wood Natural

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** Bitter — slab serif with warmth, echoes wood grain direction
- **Body font:** Source Serif 4
- **Tracking:** 0.005em | **Leading:** 1.65

## Colors
- **Background:** #8B5E3C (mid-oak)
- **Primary action:** #F5E6C8 (pale birch)
- **Accent:** #4A2C0A (walnut dark)
- **Elevation model:** grain-following shadow lines; no hard drop shadows

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 180, damping: 30 }`
- **Enter animation:** fade 200ms ease-out
- **Forbidden:** metallic sheen, neon, bounce

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 2–6px; wood joints have slight chamfer

## Code Pattern
```css
.wood-panel {
  background: linear-gradient(
    160deg,
    #8B5E3C 0%,
    #9A6B42 20%,
    #7A5230 45%,
    #8B5E3C 70%,
    #A07248 100%
  );
  background-size: 100% 100%;
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
- Do not tile the grain pattern — grain runs in one consistent direction across the panel
- Avoid system serif fallbacks; their uniform stroke weight removes the hand-hewn warmth
