---
id: swiss-rationalism
category: historical
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [swiss, rationalism, historical]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Swiss Rationalism

**Category:** historical
**Motion tier:** Subtle

## Typography
- **Display font:** Neue Haas Grotesk (fallback: Helvetica Neue) — the canonical rational sans
- **Body font:** Helvetica Neue Light
- **Tracking:** -0.02em | **Leading:** 1.4 | **Weight range:** 300/400/700

## Colors
- **Background:** #FFFFFF
- **Primary action:** #000000
- **Accent:** #FF0000
- **Elevation model:** none — grid structure replaces visual hierarchy tricks

## Motion
- **Tier:** Subtle
- **Spring tokens:** `stiffness: 400, damping: 40` — terse, controlled
- **Enter animation:** none preferred; if required, fade 80ms linear
- **Forbidden:** decorative transitions, parallax, scroll-triggered theatrics

## Spacing
- **Base grid:** 12-column strict, 8px unit
- **Border-radius vocabulary:** 0px — geometry is the ornament

## Code Pattern
```css
.swiss-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
}
.swiss-heading {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
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
Content before motion — information hierarchy is achieved through grid placement, weight contrast, and scale, not animation. Never let a transition distract from reading. If in doubt, remove it.
