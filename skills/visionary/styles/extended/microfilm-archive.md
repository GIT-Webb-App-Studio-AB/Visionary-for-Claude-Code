---
id: microfilm-archive
category: extended
motion_tier: Subtle
density: dense
locale_fit: [all]
palette_tags: [dark, light, neon, earth, organic]
keywords: [microfilm, archive, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Microfilm Archive

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Courier Prime — monospace authority of document scanning and archival systems
- **Body font:** Courier Prime Regular
- **Tracking:** 0em | **Leading:** 1.55

## Colors
- **Background:** #0D0D00 (phosphor amber variant) or #1A1A0F (phosphor green variant)
- **Primary action:** #FFB300 (amber phosphor) or #00FF41 (green phosphor)
- **Accent:** Slightly dimmer version of primary phosphor
- **Elevation model:** scan-line pattern; no traditional shadows

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 300, damping: 32 }`
- **Enter animation:** scan-line flicker — subtle opacity variation 0.85→1 at 8fps (not smooth)
- **Forbidden:** color, warm whites, smooth gradients, modern UI signals

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; CRT monitors and microfilm readers are rectilinear

## Code Pattern
```css
.microfilm-display {
  font-family: 'Courier Prime', 'Courier New', monospace;
  color: #FFB300;
  background: #0D0D00;
  filter: contrast(1.2) brightness(0.9);
}

.scan-line-overlay {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.15) 2px,
    rgba(0, 0, 0, 0.15) 4px
  );
  pointer-events: none;
  position: fixed;
  inset: 0;
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
- Scan-line overlay must be a separate element with `pointer-events: none` — applying it directly to content containers blocks interaction
- CRT phosphor flicker must use `step` timing function not smooth easing — analog phosphor doesn't fade gracefully, it flickers in discrete steps
