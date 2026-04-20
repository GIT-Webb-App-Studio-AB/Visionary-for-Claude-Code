---
id: reaction-diffusion
category: extended
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, monochrome]
keywords: [reaction, diffusion, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Reaction Diffusion

**Category:** extended
**Motion tier:** Kinetic

## Typography
- **Display font:** Space Mono — scientific notation for biological processes
- **Body font:** Space Mono Regular
- **Tracking:** 0em | **Leading:** 1.5

## Colors
- **Background:** #000000 (generated — algorithm determines visual field)
- **Primary action:** #FFFFFF (concentration high)
- **Accent:** #000000 (concentration low)
- **Elevation model:** none — the pattern IS the surface

## Motion
- **Tier:** Kinetic
- **Spring tokens:** N/A — continuous Turing pattern simulation
- **Enter animation:** pattern emerges from noise over 2–4 seconds; UI elements overlay
- **Forbidden:** static backgrounds, CSS-only patterns, fixed color beyond monochrome base

## Spacing
- **Base grid:** 8px for UI overlay; 1px for canvas simulation
- **Border-radius vocabulary:** 0px for UI chrome; organic patterns from algorithm

## Code Pattern
```javascript
// Gray-Scott model — recommended parameters for spot patterns
const feed = 0.055;
const kill = 0.062;
const Da = 1.0;   // diffusion rate A
const Db = 0.5;   // diffusion rate B
const dt = 1.0;

// Each frame: apply Laplacian convolution + reaction terms
// A' = A + (Da * lapA - A*B*B + feed*(1-A)) * dt
// B' = B + (Db * lapB + A*B*B - (kill+feed)*B) * dt
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
- Gray-Scott requires double-buffering (read from buffer A, write to buffer B, swap) — single-buffer updates cause race conditions in the convolution
- Feed/kill parameter space is extremely sensitive: changing feed by 0.005 can shift from spots to stripes to labyrinthine patterns; document the values used
