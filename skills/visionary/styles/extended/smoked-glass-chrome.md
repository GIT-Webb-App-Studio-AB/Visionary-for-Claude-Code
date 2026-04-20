---
id: smoked-glass-chrome
category: extended
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark]
keywords: [smoked, glass, chrome, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Smoked Glass Chrome

**Category:** extended
**Motion tier:** Expressive

## Typography
- **Display font:** Inter (or Geist) — neutral, reads cleanly through translucent surfaces
- **Body font:** Inter
- **Tracking:** -0.01em | **Leading:** 1.5

## Colors
- **Background:** #0D0D0F (near-black)
- **Primary action:** #C0C0C0 (chrome)
- **Accent:** rgba(255,255,255,0.08) (smoke)
- **Elevation model:** glass shimmer; backdrop-filter blur + chrome edge highlights

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 260, damping: 22 }`
- **Enter animation:** glass shimmer — backdrop-filter blur increases then resolves, 320ms
- **Forbidden:** warm tones, opaque backgrounds on glass elements, hard geometric shadows

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 12–16px; smoked glass is formed, smooth-edged

## Code Pattern
```css
.smoked-glass {
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-top-color: rgba(255, 255, 255, 0.2); /* chrome edge highlight */
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
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
- `backdrop-filter` requires the element background to be non-opaque — a solid `background-color` defeats the blur entirely
- Chrome edge highlight must be on `border-top-color` only; applying it to all four edges removes directionality and makes it look like a glow, not a metal edge
