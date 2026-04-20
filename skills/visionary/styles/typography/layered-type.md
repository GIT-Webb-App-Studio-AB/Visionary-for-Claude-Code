---
id: layered-type
category: typography
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [layered, type, typography, led]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Layered Type

**Category:** typography
**Motion tier:** Expressive

## Typography
- **Display font:** Syne 800 (foreground) + Syne 200 (background layer)
- **Body font:** Syne 400
- **Weight range:** 200–800
- **Tracking:** 0em foreground, 0.08em background ghost layer
- **Leading:** 1.0 display layers, 1.5 body

## Colors
- **Background:** #0F0F0F
- **Primary action:** #FFFFFF
- **Accent:** #E8FF00
- **Elevation model:** none — z-index stacking of type layers creates all depth

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 180, damping: 22, mass: 1.2
- **Enter animation:** foreground layer slides in 40ms after background ghost, parallax scroll at 0.3x rate
- **Forbidden:** drop shadows on text, text outlines, legibility-first thinking (background layer is intentionally illegible)

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px — layout and depth come from type, not containers

## Code Pattern
```css
.layered-type-container {
  position: relative;
  overflow: hidden;
}

.type-ghost {
  position: absolute;
  font-family: 'Syne', sans-serif;
  font-weight: 200;
  font-size: 18vw;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.04);
  top: -10%;
  pointer-events: none;
  will-change: transform;
}

.type-foreground {
  position: relative;
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: clamp(3rem, 8vw, 8rem);
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
- Making the ghost layer too visible (opacity above 0.08) — it becomes clutter, not atmosphere
- Animating both layers at the same speed; the parallax offset is what creates the layered illusion
