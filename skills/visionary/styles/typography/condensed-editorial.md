---
id: condensed-editorial
category: typography
motion_tier: Subtle
density: dense
locale_fit: [all]
palette_tags: [editorial]
keywords: [condensed, editorial, typography, led]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Condensed Editorial

**Category:** typography
**Motion tier:** Subtle

## Typography
- **Display font:** Barlow Condensed 700–900
- **Body font:** Barlow 400
- **Weight range:** 400–900
- **Tracking:** -0.01em display, 0.03em uppercase labels
- **Leading:** 0.95 display, 1.55 body

## Colors
- **Background:** #F2F0EB
- **Primary action:** #1A1A1A
- **Accent:** #C8392B
- **Elevation model:** none — layout grid creates depth

## Motion
- **Tier:** Subtle
- **Spring tokens:** stiffness: 350, damping: 30, mass: 0.9
- **Enter animation:** slide up 16px + opacity 0→1, 350ms stagger per column
- **Forbidden:** bouncy spring animations, full-screen transitions, display font below 48px

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px everywhere — editorial geometry is rectilinear

## Code Pattern
```css
.condensed-headline {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(3.5rem, 9vw, 10rem);
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 0.95;
  text-transform: uppercase;
}

.editorial-label {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
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
- Setting the condensed font at a modest size — condensed faces must be used large or not at all
- Mixing Barlow Condensed with a different body sans; the contrast between condensed display and normal-width body IS the editorial tension
