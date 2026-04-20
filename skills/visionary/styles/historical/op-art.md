---
id: op-art
category: historical
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, monochrome]
keywords: [art, historical]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Op Art

**Category:** historical
**Motion tier:** Subtle

## Typography
- **Display font:** Space Grotesk — optical rhythm, geometric precision
- **Body font:** Space Grotesk Regular
- **Tracking:** 0em | **Leading:** 1.5 | **Weight range:** 400/700

## Colors
- **Background:** #FFFFFF
- **Primary action:** #000000
- **Accent:** #FFFFFF (inverted application)
- **Elevation model:** none — optical depth through pattern, not shadows

## Motion
- **Tier:** Subtle (the visual patterns provide all the motion perception needed)
- **Spring tokens:** `stiffness: 400, damping: 40` — measured, precise
- **Enter animation:** none — static pattern IS the animation; if transition required, fade 150ms
- **Forbidden:** color, motion blur, drop shadows, gradients

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px — geometry is the entire vocabulary

## Code Pattern
```css
.op-art-pattern-concentric {
  background-image: repeating-radial-gradient(
    circle,
    #000000 0px, #000000 2px,
    #FFFFFF 2px, #FFFFFF 8px
  );
}
.op-art-pattern-chevron {
  background-image: repeating-linear-gradient(
    45deg,
    #000000 0, #000000 4px,
    #FFFFFF 4px, #FFFFFF 16px
  );
}
.op-art-moiré {
  position: relative;
}
.op-art-moiré::after {
  content: '';
  position: absolute;
  inset: 0;
  background: inherit;
  transform: rotate(1deg);
  mix-blend-mode: difference;
  opacity: 0.4;
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
Monochrome only — the moment color enters, it becomes something else. The optical effect must be perceptible at standard screen density; patterns that are too fine or too coarse fail to activate. Test at 100% zoom.
