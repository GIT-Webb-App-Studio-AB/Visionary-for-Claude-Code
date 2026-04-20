---
id: art-nouveau
category: historical
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [pastel, earth, organic]
keywords: [art, nouveau, historical]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Art Nouveau

**Category:** historical
**Motion tier:** Expressive

## Typography
- **Display font:** Libre Baskerville — organic serif with flowing stroke contrast
- **Body font:** Libre Baskerville Regular
- **Tracking:** 0.01em | **Leading:** 1.7 | **Weight range:** 400/700

## Colors
- **Background:** #F5F0E8
- **Primary action:** #4A6741
- **Accent:** #8B4513
- **Elevation model:** soft diffuse shadows (0 4px 24px rgba(74,103,65,0.15))

## Motion
- **Tier:** Expressive
- **Spring tokens:** `stiffness: 120, damping: 15` — flowing, organic
- **Enter animation:** bloom (scale 0.92 + opacity 0 → 1, 400ms ease-out with gentle overshoot)
- **Forbidden:** hard geometric edges, primary-color palettes, mechanical motion

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** highly variable — use organic curves, asymmetric rounding (e.g., `border-radius: 40% 60% 70% 30% / 30% 40% 60% 70%`)

## Code Pattern
```css
.art-nouveau-panel {
  background: #F5F0E8;
  border-radius: 40% 60% 70% 30% / 30% 40% 60% 70%;
  padding: 48px;
  border: 2px solid #4A6741;
  position: relative;
}
.art-nouveau-panel::before {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: inherit;
  border: 1px solid rgba(74, 103, 65, 0.3);
}
.art-nouveau-botanical {
  /* Botanical motifs via SVG clip-path or background-image */
  background-image: url("data:image/svg+xml,...");
  background-repeat: repeat;
  opacity: 0.08;
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
Organic curves must feel botanical, not bubbly. Avoid candy-like rounded rectangles — the curves of Art Nouveau are asymmetric and purposeful, echoing plant forms and flowing hair. Earth tones only; no primaries.
