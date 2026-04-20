---
id: solarpunk
category: internet
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, pastel, editorial, organic]
keywords: [solarpunk, internet]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Solarpunk

**Category:** internet
**Motion tier:** Expressive

## Typography
- **Display font:** Nunito 600 — rounded terminals mirror botanical curves; the softness reads as organic and communal rather than corporate
- **Body font:** Source Serif 4
- **Tracking:** 0em (display), -0.01em (body) | **Leading:** 1.35 (display), 1.65 (body)

## Colors
- **Background:** #F2F7EF — morning-leaf pale green; the hue reads as fresh air and growing things without triggering "dark mode plant" associations
- **Primary action:** Forest green #3D7A4A — readable on light ground, references deep canopy rather than poison or warning
- **Accent:** #E8A030 — solar gold; warm harvest light, the sun making things grow
- **Elevation model:** None — depth is created through botanical illustration layering (overlapping leaf shapes, vine borders as SVG border-image) not digital drop shadows; shadows imply industrial overhead lighting

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 120, damping: 14, mass: 1 (gentle, slightly underdamped — like a branch settling)
- **Enter animation:** grow-in — scale from 0.95 to 1.0 paired with opacity 0 to 1 over 380ms with cubic-bezier(0.34, 1.3, 0.64, 1); the slight overshoot mimics a leaf uncurling
- **Forbidden:** mechanical transforms (rotate with hard stops, snap-to-grid), hard cuts (instant visibility), dark green backgrounds (#1A3A20 range — kills the hopeful optimistic read entirely), industrial or tech-brutalist motion references (no translate-X jarring slides)

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 16px (panels), 24px (cards), 999px (badges and pills), 4px (inline code); no sharp 0px corners anywhere — this aesthetic has no right angles in nature

## Code Pattern
```css
/* Solarpunk panel — the core container unit */
.solarpunk-panel {
  background: linear-gradient(145deg, #EDF7E8 0%, #F2F7EF 60%, #FAFFEF 100%);
  border-radius: 16px;
  padding: 32px;
  /* Botanical border-image: swap SVG path for actual vine illustration */
  border: 2px solid #3D7A4A22;
  position: relative;
  overflow: hidden;
}

/* Leaf overlay — decorative botanical layering creates depth */
.solarpunk-panel::before {
  content: '';
  position: absolute;
  top: -24px;
  right: -24px;
  width: 120px;
  height: 120px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cellipse cx='70' cy='30' rx='40' ry='20' fill='%233D7A4A18' transform='rotate(-30 70 30)'/%3E%3C/svg%3E") no-repeat center;
  pointer-events: none;
}

.solarpunk-heading {
  font-family: 'Nunito', system-ui, sans-serif;
  font-weight: 600;
  font-size: 2rem;
  line-height: 1.35;
  color: #2A5E35;
  letter-spacing: 0em;
}

.solarpunk-body {
  font-family: 'Source Serif 4', Georgia, serif;
  font-size: 1rem;
  line-height: 1.65;
  color: #2A3D2C;
  letter-spacing: -0.01em;
}

/* Solar accent — CTA buttons */
.solar-accent {
  background: #E8A030;
  color: #1A2E0A;
  border: none;
  border-radius: 999px;
  padding: 12px 28px;
  font-family: 'Nunito', sans-serif;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transform: scale(1);
  transition: transform 380ms cubic-bezier(0.34, 1.3, 0.64, 1),
              box-shadow 380ms ease;
}

.solar-accent:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 16px #E8A03040;
}

/* Grow-in entrance — all solarpunk panels animate this way */
@keyframes grow-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.solarpunk-panel[data-animate] {
  animation: grow-in 380ms cubic-bezier(0.34, 1.3, 0.64, 1) both;
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
- **Dark green backgrounds (#1A3A20, #0D2B12 range):** These colors read as jungle darkness or industrial poison-warning, not hopeful botanical growth. Solarpunk's emotional register is morning light and abundance — backgrounds must stay in the #EDF7E8–#FAFFEF pale range. Dark forest green destroys the optimistic read that defines the genre.
- **Mechanical transforms and hard motion cuts:** Solarpunk's philosophical roots reject industrial-mechanical aesthetics. Using jarring slide-from-left entrances, instant cuts, or rotate transforms that snap to angles references factory machinery. All motion must read as organic process — growth, settling, unfurling — not mechanical actuation.
