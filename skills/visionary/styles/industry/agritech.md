---
id: agritech
category: industry
motion_tier: Subtle
density: dense
locale_fit: [all]
palette_tags: [light, neon, earth, organic]
keywords: [agritech, industry]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Agritech

**Category:** industry
**Motion tier:** Subtle

## Typography
- **Display font:** Chillax 600 (approachable for farmer-users) or Space Grotesk 600 (technical users)
- **Body font:** Plus Jakarta Sans 400
- **Weight range:** 400–700
- **Tracking:** 0em body, -0.01em display
- **Leading:** 1.55 body (accessible for outdoor/field use)

## Colors
- **Background:** #F5F7F2 (natural light green-grey)
- **Primary action:** #2D6A1F (field green)
- **Accent:** #E67E22 (harvest amber)
- **Elevation model:** subtle shadows (0 2px 8px rgba(0,0,0,0.08))

## Motion
- **Tier:** Subtle
- **Spring tokens:** stiffness: 350, damping: 35, mass: 0.9
- **Enter animation:** opacity 0→1, 250ms — field workers often on slow connections; motion must not delay perceived performance
- **Forbidden:** decorative animations that consume bandwidth, anything that requires a stable animation frame rate (field devices vary)

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8px consistent — friendly but not consumer-playful; field workers need clear tap targets

## Code Pattern
```css
/* Optimized for outdoor readability and variable lighting */
.agritech-field-card {
  background: #FFFFFF;
  border-radius: 8px;
  padding: 20px;
  border: 2px solid #E8EDE4;
  min-height: 48px; /* field-tap-friendly */
}

.agritech-status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #2D6A1F;
  box-shadow: 0 0 0 4px rgba(45, 106, 31, 0.15);
}

.agritech-metric-large {
  font-size: 2.5rem;
  font-weight: 700;
  font-feature-settings: 'tnum' 1;
  color: #1A2A14;
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
- Using the same design language as a Silicon Valley SaaS; agritech users need to trust the product works in a field, not in a boardroom
- Small tap targets below 44px; field workers often use gloves or operate in conditions that reduce precision
