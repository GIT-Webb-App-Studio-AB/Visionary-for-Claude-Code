---
id: skeuomorphism
category: morphisms
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, editorial]
keywords: [skeuomorphism, morphisms]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Skeuomorphism

**Category:** morphisms
**Motion tier:** Subtle

## Typography
- **Display font:** Georgia — serif that references print and physical objects
- **Body font:** Georgia, 'Times New Roman', serif
- **Tracking:** 0.01em | **Leading:** 1.65

## Colors
- **Background:** #2C1810 — dark wood grain texture base
- **Primary action:** #C8860A — aged brass/gold for interactive elements
- **Accent:** #8B0000 — deep red as used in leather-bound interfaces
- **Elevation model:** shadows — realistic drop shadows that match the implied light source

## Motion
- **Tier:** Subtle
- **Spring tokens:** ui (drawer open like a real drawer), gentle (page turn)
- **Enter animation:** position-based (drawer slides from edge, window opens from center)
- **Forbidden:** opacity fades, scale transforms — real objects don't fade in; they arrive from a direction

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** deliberate variation — 2px for metal edges, 4px for plastic, 0px for glass/wood — matches the simulated material

## Code Pattern
```css
.leather-button {
  background:
    repeating-linear-gradient(
      45deg,
      rgba(0,0,0,0.03) 0px,
      rgba(0,0,0,0.03) 1px,
      transparent 1px,
      transparent 4px
    ),
    linear-gradient(to bottom, #8B4513, #5C2E00);
  border: 1px solid #3a1800;
  border-radius: 4px;
  box-shadow:
    0 1px 0 rgba(255,255,255,0.15) inset,
    0 3px 6px rgba(0,0,0,0.5);
  font-family: Georgia, serif;
  text-shadow: 0 1px 1px rgba(0,0,0,0.6);
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
- **Inconsistent light source:** If your top-left shadow elements coexist with bottom-right highlights, the physics break — pick one light direction and apply it everywhere
- **Texture without purpose:** Adding a wood grain to a chart ruins both — textures should only appear on surfaces that simulate a textured material
