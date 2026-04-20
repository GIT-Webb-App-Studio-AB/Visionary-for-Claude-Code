---
id: flat
category: morphisms
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [light, neon, pastel]
keywords: [flat, morphisms]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Flat Design

**Category:** morphisms
**Motion tier:** Subtle

## Typography
- **Display font:** Helvetica Neue or system-ui — Flat design emerged partly as rejection of decorative type
- **Body font:** Helvetica Neue, Arial, sans-serif
- **Tracking:** 0em | **Leading:** 1.5

## Colors
- **Background:** #FFFFFF — pure white, no gradients
- **Primary action:** #E74C3C — Flat UI's iconic tomato red (or any pure hue, no tints)
- **Accent:** #3498DB — peter river blue, full saturation
- **Elevation model:** none — zero depth, zero shadow, zero gradient

## Motion
- **Tier:** Subtle
- **Spring tokens:** ui (state change), micro (toggle)
- **Enter animation:** position slide or instant swap — never scale, never blur
- **Forbidden:** drop shadows, gradients, backdrop-filter, border-radius > 4px on rectangles — all decoration is banned

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px for cards/containers, 4px maximum for buttons, 999px for pills — geometric strictness

## Code Pattern
```css
.flat-button {
  background: #E74C3C;
  color: #ffffff;
  border: none;
  border-radius: 0;
  padding: 12px 24px;
  font-family: Helvetica Neue, sans-serif;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  /* No box-shadow. No gradient. No transition except color. */
  transition: background-color 150ms linear;
}

.flat-button:hover {
  background: #C0392B;
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
- **"Flat 2.0" creep:** Adding subtle shadows "just a little" destroys the conceptual integrity — commit fully or choose material design instead
- **Muted palette:** Flat design uses full-saturation colors; desaturating them creates a different (duller) aesthetic
