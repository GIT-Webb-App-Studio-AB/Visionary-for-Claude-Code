---
id: early-web-geocities
category: graphic
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [early, web, geocities, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Early Web Geocities

**Category:** graphic
**Motion tier:** Kinetic

## Typography
- **Display font:** Comic Sans MS (intentional) or Impact — the authentic 1996–2003 web register
- **Body font:** Times New Roman (browser default era) or Verdana (early web-safe)
- **Tracking:** 0em | **Leading:** 1.2 (cramped by modern standards)

## Colors
- **Background:** Tiled pattern (stars, flames, or animated GIF background)
- **Primary action:** #FF0000 (bright red) or #0000FF (hyperlink blue)
- **Accent:** #FFFF00 (yellow — marquee text standard)
- **Elevation model:** none; everything is flat 1990s web

## Motion
- **Tier:** Kinetic
- **Spring tokens:** N/A — CSS animations only, keyframe-based
- **Enter animation:** blinking marquee text; under construction GIF; visitor counter
- **Forbidden:** smooth transitions, backdrop-filter, CSS Grid, modern layout

## Spacing
- **Base grid:** none — table-based layout, pixel-perfect manual placement
- **Border-radius vocabulary:** 0px; CSS border-radius didn't exist

## Code Pattern
```css
@keyframes blink {
  0%, 100% { visibility: visible; }
  50%       { visibility: hidden; }
}

.blink-text {
  animation: blink 0.5s step-end infinite;
  color: #FF0000;
  text-decoration: underline blink; /* nostalgic non-standard */
}

.marquee-container {
  overflow: hidden;
  white-space: nowrap;
}

.marquee-text {
  display: inline-block;
  animation: marquee 8s linear infinite;
}

@keyframes marquee {
  from { transform: translateX(100%); }
  to   { transform: translateX(-100%); }
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
- Comic Sans must be used intentionally and consistently — mixing it with modern fonts ironically produces "ironic bad design" which misses the genuine nostalgia register
- Blink animation must use `step-end` timing not smooth easing — smooth blink looks like a fade, not the binary on/off of early browser implementations
