---
id: surveillance-panopticon
category: graphic
motion_tier: Subtle
density: dense
locale_fit: [all]
palette_tags: [dark, neon, pastel, earth, trust]
keywords: [surveillance, panopticon, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Surveillance Panopticon

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** IBM Plex Mono — institutional authority, machine-generated records
- **Body font:** IBM Plex Mono Regular
- **Tracking:** 0em | **Leading:** 1.5

## Colors
- **Background:** #050505 (CCTV black)
- **Primary action:** #FF8C00 (warning amber — under observation)
- **Accent:** #CC3300 (alert red — breach detected)
- **Elevation model:** none; surveillance is flat, clinical, grid-based

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 400, damping: 40 }` — immediate, mechanical
- **Enter animation:** scan-reveal — horizontal wipe at 120ms; like a camera pan
- **Forbidden:** warmth, softness, rounded anything, organic motion

## Spacing
- **Base grid:** 4px (surveillance grid, dense)
- **Border-radius vocabulary:** 0px; surveillance systems are rectilinear

## Code Pattern
```css
.cctv-overlay {
  border: 1px solid rgba(255, 140, 0, 0.4);
  background: rgba(255, 140, 0, 0.03);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  color: #FF8C00;
}

.timestamp {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  color: rgba(255, 140, 0, 0.7);
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
- All numeric displays must use `tabular-nums` — timestamp digits that shift width on update destroy the clinical surveillance aesthetic
- Warning amber (#FF8C00) must not be used as a general accent; it carries warning semantics — reserve for genuinely alerting states to preserve signal meaning
