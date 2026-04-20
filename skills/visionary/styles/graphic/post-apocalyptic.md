---
id: post-apocalyptic
category: graphic
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, neon, earth]
keywords: [post, apocalyptic, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Post-Apocalyptic

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** Oswald — condensed, utilitarian, salvaged-signage energy
- **Body font:** Roboto Condensed
- **Tracking:** 0.04em | **Leading:** 1.4

## Colors
- **Background:** #1C1510 (scorched earth)
- **Primary action:** #C17B2A (rust orange)
- **Accent:** #5A4A3A (ash grey-brown)
- **Elevation model:** heavy inset shadows; worn, structural

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 350, damping: 38 }` — stiff, labored
- **Enter animation:** slow fade 300ms linear; nothing springs in a wasteland
- **Forbidden:** bounce, neon, clean gradients, optimistic color

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; salvaged metal does not have rounded edges

## Code Pattern
```css
.salvage-panel {
  background: #1C1510;
  border: 2px solid #5A4A3A;
  border-top-color: #C17B2A;
  box-shadow:
    inset 0 0 40px rgba(0,0,0,0.6),
    4px 4px 0 rgba(0,0,0,0.4);
  position: relative;
}

.salvage-panel::before {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1px solid rgba(193,123,42,0.15);
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
- Desaturation is the primary tool — never introduce a fully saturated color; even the rust orange sits at low saturation
- The double-border technique (border + ::before inner border) simulates welded metal seams; skipping it makes panels look like dark-themed UI, not scavenged materials
