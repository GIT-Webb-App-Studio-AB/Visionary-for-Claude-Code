---
id: bauhaus
category: historical
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [bauhaus, historical]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Bauhaus

**Category:** historical
**Motion tier:** Subtle

## Typography
- **Display font:** Bebas Neue — geometric letterforms echo structural grid discipline
- **Body font:** DM Serif Display
- **Tracking:** 0em | **Leading:** 1.2 | **Weight range:** 400/700 only

## Colors
- **Background:** #FFFFFF
- **Primary action:** #0066CC
- **Accent:** #FFCD29
- **Elevation model:** none — flat surfaces only, depth via color blocks

## Motion
- **Tier:** Subtle
- **Spring tokens:** `stiffness: 300, damping: 30` — mechanical, no bounce
- **Enter animation:** fade (opacity 0→1, 120ms linear)
- **Forbidden:** easing curves, bounce, blur, drop-shadows

## Spacing
- **Base grid:** 8px strict — every value a multiple of 8
- **Border-radius vocabulary:** 0px everywhere — no rounding, ever

## Code Pattern
```css
.bauhaus-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 0;
}
.bauhaus-accent {
  border-left: 8px solid #FFCD29;
  padding-left: 24px;
}
.bauhaus-primary {
  background: #FF3B30;
  color: #FFFFFF;
  border-radius: 0;
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
Do not add gradients, rounded corners, or drop-shadows. No serif body text. If you find yourself reaching for `border-radius` or `box-shadow`, stop — those are modernist additions Bauhaus never knew.
