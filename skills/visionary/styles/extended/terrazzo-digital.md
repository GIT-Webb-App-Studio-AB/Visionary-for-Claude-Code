---
id: terrazzo-digital
category: extended
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, earth]
keywords: [terrazzo, digital, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Terrazzo Digital

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Neue Haas Grotesk — clean industrial sans that doesn't compete with the pattern
- **Body font:** DM Sans
- **Tracking:** 0em | **Leading:** 1.55

## Colors
- **Background:** Terrazzo chip pattern (terracotta #C8714F + teal #4A9B8F + cream #F5EDD8)
- **Primary action:** #1C1C1C (neutral dark)
- **Accent:** #C8714F (terracotta dominant)
- **Elevation model:** subtle drop shadows; terrazzo is a floor material with physical weight

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 200, damping: 28 }`
- **Enter animation:** fade 200ms ease-out
- **Forbidden:** neon, gradients over the pattern, anything that competes with the chip texture

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8–16px; polished terrazzo surfaces are smooth and rounded at edges

## Code Pattern
```css
.terrazzo-surface {
  background-color: #F5EDD8;
  background-image:
    radial-gradient(circle at 20% 30%, #C8714F 0, #C8714F 6px, transparent 6px),
    radial-gradient(circle at 70% 60%, #4A9B8F 0, #4A9B8F 4px, transparent 4px),
    radial-gradient(circle at 45% 80%, #C8714F 0, #C8714F 3px, transparent 3px),
    radial-gradient(circle at 85% 20%, #4A9B8F 0, #4A9B8F 5px, transparent 5px),
    radial-gradient(circle at 35% 50%, #A8956A 0, #A8956A 4px, transparent 4px);
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
- Terrazzo chip placement must look random — evenly distributed chips read as a pattern repeat, not natural stone; use varied positions and sizes
- Keep chip sizes varied (3–8px radius); uniform chip sizes look digital/artificial rather than stone aggregate
