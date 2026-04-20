---
id: deconstructed-type
category: typography
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [deconstructed, type, typography, led]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Deconstructed Type

**Category:** typography
**Motion tier:** Kinetic

## Typography
- **Display font:** Helvetica Neue (fragments scattered) + Neue Haas Grotesk Display
- **Body font:** Helvetica Neue 400
- **Weight range:** 100–900 (extreme contrast between fragments)
- **Tracking:** variable — fragments have -0.05em to 0.2em intentionally
- **Leading:** 0.8–1.0 for display fragments (overlapping is intentional)

## Colors
- **Background:** #F0EEE8
- **Primary action:** #0A0A0A
- **Accent:** #FF2D20
- **Elevation model:** none — z-index and overlap of type fragments create all hierarchy

## Motion
- **Tier:** Kinetic
- **Spring tokens:** stiffness: 600, damping: 15, mass: 0.6
- **Enter animation:** fragments scatter from center point and settle into reading-order positions over 800ms
- **Forbidden:** readable linear text in hero (fragments are the aesthetic), accessibility contexts, enterprise B2B

## Spacing
- **Base grid:** none — intentional chaos mapped to an invisible 8px grid on body content only
- **Border-radius vocabulary:** 0px — deconstruction is rectilinear

## Code Pattern
```css
.deconstructed-fragment {
  position: absolute;
  font-family: 'Helvetica Neue', 'Arial', sans-serif;
  mix-blend-mode: multiply;
  pointer-events: none;
}

.fragment-large {
  font-size: clamp(6rem, 20vw, 20rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  opacity: 0.9;
}

.fragment-ghost {
  font-size: clamp(4rem, 12vw, 14rem);
  font-weight: 100;
  letter-spacing: 0.15em;
  opacity: 0.15;
}
```

## Accessibility

### Contrast
Body text must clear 4.5:1 (WCAG 2.2 AA) AND APCA Lc ≥ 75. Large text / UI labels: 3:1 and Lc ≥ 60. Run axe-core + apca-w3 during the critique loop.

### Focus
Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.

### Motion
This style exposes motion that can run longer than 5 seconds. Ship a visible pause/stop control bound to `animation-play-state` (CSS) or the JS equivalent — required by WCAG 2.2.2 (Level A). Also degrade to opacity-only transitions under `prefers-reduced-motion: reduce`.

### Touch target
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
- Making the deconstruction so complete it becomes illegible — one word must anchor the composition at full legibility
- Adding color to the fragments; deconstruction works in near-black on light or near-white on dark, not multicolor
