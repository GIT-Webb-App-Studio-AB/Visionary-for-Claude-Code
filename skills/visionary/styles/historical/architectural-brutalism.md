---
id: architectural-brutalism
category: historical
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [light]
keywords: [architectural, brutalism, historical]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Architectural Brutalism

**Category:** historical
**Motion tier:** Subtle

## Typography
- **Display font:** Syne Bold — raw weight, structural honesty
- **Body font:** Space Grotesk Regular
- **Tracking:** 0.01em | **Leading:** 1.4 | **Weight range:** 400/700

## Colors
- **Background:** #6B7280 (exposed concrete)
- **Primary action:** #1F2937
- **Accent:** #F3F4F6
- **Elevation model:** none — raw structural form; mass creates presence

## Motion
- **Tier:** Subtle
- **Spring tokens:** `stiffness: 500, damping: 50` — heavy, no elasticity
- **Enter animation:** none preferred; if required: translateY(-8px) → 0, 200ms linear
- **Forbidden:** drop-shadows, rounded corners, gentle motion, warmth of any kind

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px absolute — concrete does not curve

## Code Pattern
```css
.brutalist-surface {
  background: #6B7280;
  border: none;
  padding: 40px 48px;
}
.brutalist-block {
  background: #1F2937;
  color: #F3F4F6;
  padding: 24px;
  /* No shadows, no borders — mass alone */
}
.brutalist-exposed {
  /* Show the structure */
  outline: 2px solid rgba(243, 244, 246, 0.2);
  outline-offset: -2px;
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
Brutalism in web design often means "no CSS" — architectural brutalism means raw material honestly expressed. The concrete grey must read as material, not dirt. White text on grey requires precise contrast ratios; test with a contrast checker.
