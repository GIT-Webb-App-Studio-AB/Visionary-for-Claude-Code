---
id: new-wave-swiss-punk
category: historical
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, pastel]
keywords: [new, wave, swiss, punk, historical]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# New Wave / Swiss Punk

**Category:** historical
**Motion tier:** Kinetic

## Typography
- **Display font:** Helvetica Neue (deconstructed — overlapping, rotated, cut off) — the establishment appropriated
- **Body font:** Helvetica Neue Regular (treated normally to create ironic contrast)
- **Tracking:** chaotic — 0em to 0.3em within same composition | **Leading:** 0.9 to 1.8 mixed | **Weight range:** 300/700 deliberately colliding

## Colors
- **Background:** #FFFFFF
- **Primary action:** #000000
- **Accent:** #FF0000
- **Elevation model:** none — raw structure only

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `stiffness: 220, damping: 10` — twitchy, aggressive
- **Enter animation:** glitch-in (rapid position jitter 3×, then settle, 250ms)
- **Forbidden:** smooth animations, comfortable spacing, restrained color application

## Spacing
- **Base grid:** 8px (actively violated)
- **Border-radius vocabulary:** 0px — the rebellion is geometric

## Code Pattern
```css
.nwsp-layer-1 {
  position: absolute;
  font-size: 12rem;
  font-weight: 700;
  opacity: 0.12;
  top: -20px;
  left: -40px;
  user-select: none;
}
.nwsp-layer-2 {
  position: relative;
  z-index: 2;
  font-weight: 300;
  letter-spacing: 0.3em;
  color: #FF0000;
}
@keyframes glitch {
  0%, 100% { transform: translate(0); }
  20%       { transform: translate(-3px, 1px); }
  40%       { transform: translate(3px, -1px); }
  60%       { transform: translate(-1px, 3px); }
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
Deconstruction without legibility is noise. At least one text element must be clearly readable at all times — the chaos frames the message, not replaces it. Limited palette (black/white/red) is non-negotiable.
