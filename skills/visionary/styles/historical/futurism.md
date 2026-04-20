---
id: futurism
category: historical
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [futurism, historical]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Futurism

**Category:** historical
**Motion tier:** Expressive

## Typography
- **Display font:** Syne Bold — angular velocity, modern echo of futurist urgency
- **Body font:** Syne Regular
- **Tracking:** 0.04em | **Leading:** 1.1 | **Weight range:** 700/900

## Colors
- **Background:** #0D0D0D
- **Primary action:** #FF2B00
- **Accent:** #FFFFFF
- **Elevation model:** none — speed lines as structural element replace depth

## Motion
- **Tier:** Expressive
- **Spring tokens:** `stiffness: 200, damping: 18` — velocity, forward momentum
- **Enter animation:** speed-blur-in (translateX(-40px) + blur(8px) → translateX(0) + blur(0), 350ms)
- **Forbidden:** static compositions, symmetry, gentle easing, backward motion

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px — forward-cutting geometric angles

## Code Pattern
```css
.futurist-speed-lines {
  position: relative;
  overflow: hidden;
}
.futurist-speed-lines::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    -15deg,
    transparent 0px, transparent 8px,
    rgba(255,43,0,0.08) 8px, rgba(255,43,0,0.08) 9px
  );
  pointer-events: none;
}
.futurist-heading {
  font-family: 'Syne', sans-serif;
  font-weight: 900;
  transform: skewX(-3deg);
  color: #FF2B00;
  text-shadow: 2px 0 0 rgba(255,255,255,0.3);
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
Speed implies direction — every diagonal element must reinforce forward (rightward, upward) movement. Futurist diagonals always angle toward the future, never retreat. Do not apply skew randomly; it must feel like velocity.
