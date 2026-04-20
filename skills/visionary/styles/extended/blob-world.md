---
id: blob-world
category: extended
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [pastel]
keywords: [blob, world, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Blob World

**Category:** extended
**Motion tier:** Kinetic

## Typography
- **Display font:** Nunito 700 (or Fredoka 700) — round, soft, lives in the same visual space as blobs
- **Body font:** Nunito Regular
- **Tracking:** -0.01em | **Leading:** 1.6

## Colors
- **Background:** #F0E6FF (soft pastel lavender)
- **Primary action:** #8B5CF6 (purple)
- **Accent:** #F472B6 (pink)
- **Elevation model:** soft blur shadows matching blob color; no hard edges

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 120, damping: 10 }` — continuous organic morphing
- **Enter animation:** blob morphs from collapsed to expanded form, 600ms ease-in-out
- **Forbidden:** sharp corners, geometric shapes, monospace type, hard shadows

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** continuous morph (60% 40% 70% 30% / 30% 60% 40% 70%) — never static

## Code Pattern
```css
.blob {
  border-radius: 60% 40% 70% 30% / 30% 60% 40% 70%;
  animation: blob-morph 8s ease-in-out infinite;
  background: linear-gradient(135deg, #8B5CF6, #F472B6);
}

@keyframes blob-morph {
  0%   { border-radius: 60% 40% 70% 30% / 30% 60% 40% 70%; }
  25%  { border-radius: 40% 60% 30% 70% / 60% 30% 70% 40%; }
  50%  { border-radius: 70% 30% 40% 60% / 40% 70% 30% 60%; }
  75%  { border-radius: 30% 70% 60% 40% / 70% 40% 60% 30%; }
  100% { border-radius: 60% 40% 70% 30% / 30% 60% 40% 70%; }
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
- Blob morph keyframes must return to the start state at 100% — if start and end values differ, browsers will interpolate an abrupt jump between the last and first frame
- Never add `overflow: hidden` to blob containers — clipping the morph animation cuts off the organic edges that define the aesthetic
