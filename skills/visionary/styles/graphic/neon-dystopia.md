---
id: neon-dystopia
category: graphic
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, neon, pastel]
keywords: [neon, dystopia, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
allows_slop:
  - "cyan-on-dark"
  - "dark background with colored glow shadow"
allows_slop_reason: "Neon dystopia is cyan-glow-on-dark BY DESIGN. Blocking these patterns would empty the style of its core vocabulary — the gate is for accidental defaults, not for style-authentic choices."
---

# Neon Dystopia

**Category:** graphic
**Motion tier:** Kinetic

## Typography
- **Display font:** Syne Bold — grotesque with tension, sits between elegance and aggression
- **Body font:** Syne Regular
- **Tracking:** 0.06em | **Leading:** 1.3

## Colors
- **Background:** #080808 (near-black city night)
- **Primary action:** #FF2079 (hot pink neon)
- **Accent:** #00FFCC (toxic cyan)
- **Elevation model:** dual-color neon glow; pink + cyan halos that bleed into each other

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 180, damping: 12 }` — springy, unnerving
- **Enter animation:** glitch-flicker: random X offset ±3px, 60ms, then settle
- **Forbidden:** pastels, rounded friendly corners > 4px, warm neutrals

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–4px; dystopia is angular with rare soft concession

## Code Pattern
```css
@keyframes glitch-enter {
  0%   { transform: translateX(-3px); opacity: 0.5; }
  20%  { transform: translateX(3px);  opacity: 0.8; }
  40%  { transform: translateX(-1px); opacity: 1;   }
  100% { transform: translateX(0);    opacity: 1;   }
}

.dystopia-element {
  animation: glitch-enter 180ms ease-out forwards;
  text-shadow: 1px 0 #00FFCC, -1px 0 #FF2079;
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
- The dual text-shadow chromatic aberration (1px offset R+G) must be subtle — large offsets read as 3D, not glitch
- Spring tension must stay loose (damping ≤ 15); a well-damped spring reads as clean tech, not dystopian anxiety
