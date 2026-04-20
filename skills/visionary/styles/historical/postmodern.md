---
id: postmodern
category: historical
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: []
keywords: [postmodern, historical]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Postmodern

**Category:** historical
**Motion tier:** Expressive

## Typography
- **Display font:** Playfair Display — used ironically, with deliberate tension against surrounding elements
- **Body font:** JetBrains Mono (unexpected pairing, rule-breaking)
- **Tracking:** variable — 0em body, 0.15em display | **Leading:** 1.6 | **Weight range:** 400/700/900

## Colors
- **Background:** #F8F4EE
- **Primary action:** #1A1A2E
- **Accent:** #E8424A
- **Elevation model:** none — visual hierarchy via ironic juxtaposition

## Motion
- **Tier:** Expressive
- **Spring tokens:** `stiffness: 160, damping: 14` — theatrical but knowing
- **Enter animation:** unexpected — elements enter from off-grid directions (translateX(40px) OR translateY(-30px), randomized per element)
- **Forbidden:** predictable grids, earnest design, visual harmony for its own sake

## Spacing
- **Base grid:** 8px (deliberately broken — some elements intentionally misalign)
- **Border-radius vocabulary:** wildly inconsistent — 0px elements beside 999px pills beside 24px cards

## Code Pattern
```css
/* Postmodern: the rules exist to be broken knowingly */
.pm-heading {
  font-family: 'Playfair Display', serif;
  font-size: clamp(3rem, 10vw, 8rem);
  line-height: 0.9;
  mix-blend-mode: multiply;
}
.pm-code-body {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  color: #E8424A;
}
.pm-disruption {
  margin-left: -5%; /* intentional overflow */
  position: relative;
  z-index: 2;
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
Rule-breaking must be legible — the joke only lands if the audience can tell a rule is being broken. Incoherent chaos without detectable intent reads as amateur, not postmodern. Design the break, not the accident.
