---
id: kinetic-type
category: typography
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [kinetic, type, typography, led]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Kinetic Type

**Category:** typography
**Motion tier:** Kinetic

## Typography
- **Display font:** Syne Mono
- **Body font:** Syne
- **Weight range:** 400–800
- **Tracking:** 0em to -0.03em (animates between values)
- **Leading:** 1.0–1.2 (compressed for typographic density)

## Colors
- **Background:** #0A0A0A
- **Primary action:** #FFFFFF
- **Accent:** #FF3366
- **Elevation model:** none — depth via type scale only

## Motion
- **Tier:** Kinetic
- **Spring tokens:** stiffness: 400, damping: 20, mass: 0.8
- **Enter animation:** characters stagger in with letter-spacing collapse (0.2em → -0.01em over 600ms)
- **Forbidden:** static text, fade-only transitions, healthcare contexts

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px everywhere — geometry is typographic, not rounded

## Code Pattern
```css
@keyframes kinetic-enter {
  from {
    letter-spacing: 0.2em;
    opacity: 0;
    filter: blur(4px);
  }
  to {
    letter-spacing: -0.01em;
    opacity: 1;
    filter: blur(0);
  }
}

.kinetic-headline {
  font-family: 'Syne Mono', monospace;
  font-size: clamp(3rem, 10vw, 9rem);
  font-weight: 800;
  animation: kinetic-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
- Using standard fade-in instead of letter-spacing animation — this style's identity IS the motion
- Adding decorative elements; the type is the only ornament
