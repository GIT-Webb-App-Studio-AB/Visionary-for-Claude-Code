---
id: data-physicalization
category: extended
motion_tier: Expressive
density: dense
locale_fit: [all]
palette_tags: []
keywords: [data, physicalization, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Data Physicalization

**Category:** extended
**Motion tier:** Expressive

## Typography
- **Display font:** IBM Plex Mono — data labels with technical authority
- **Body font:** IBM Plex Sans
- **Tracking:** 0em | **Leading:** 1.5

## Colors
- **Background:** #F8F8F8 (clean data canvas)
- **Primary action:** Data-driven palette (generated from dataset)
- **Accent:** Outlier highlight — contrast against data range
- **Elevation model:** physical metaphor — data bars cast shadows proportional to value

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 180, damping: 20 }`
- **Enter animation:** data-enter — each element animates from baseline value (0 or min) to actual value, 600ms staggered
- **Forbidden:** decorative animation unrelated to data, fixed color palettes ignoring data distribution

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px or data-driven (radius proportional to value for bubble charts)

## Code Pattern
```css
.data-bar {
  background: var(--data-color);
  height: var(--data-height);
  transform-origin: bottom;
  animation: data-grow 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes data-grow {
  from { transform: scaleY(0); opacity: 0; }
  to   { transform: scaleY(1); opacity: 1; }
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
- Every visual encoding must have a data justification — decorative size/color variation without data backing destroys the physicalization honesty
- Animation must start from baseline (0 or minimum), not from random values; enter from wrong state makes data relationships misleading during transition
