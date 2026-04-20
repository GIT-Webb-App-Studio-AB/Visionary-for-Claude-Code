---
id: underwater-aquatic
category: graphic
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark]
keywords: [underwater, aquatic, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Underwater Aquatic

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Raleway — thin strokes suggest light through water
- **Body font:** Raleway Regular
- **Tracking:** 0.02em | **Leading:** 1.7

## Colors
- **Background:** #001F3F (abyssal blue)
- **Primary action:** #00B4D8 (shallow water blue)
- **Accent:** #90E0EF (caustic light pale)
- **Elevation model:** volumetric depth; deeper elements darker, caustic light from above

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 80, damping: 14 }` — fluid resistance
- **Enter animation:** float up from -10px with sine-wave drift, 600ms
- **Forbidden:** sharp snap, hard edges, warm colors, dry-land metaphors

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 20–40px; water shapes everything smooth

## Code Pattern
```css
@keyframes caustic-light {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  33%       { opacity: 0.7; transform: scale(1.1) translate(2px, -1px); }
  66%       { opacity: 0.5; transform: scale(0.95) translate(-1px, 2px); }
}

.caustic-overlay {
  background: radial-gradient(ellipse at 30% 20%, rgba(144, 224, 239, 0.15), transparent 60%);
  animation: caustic-light 4s ease-in-out infinite;
  pointer-events: none;
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
- Caustic light animation must run at ≥ 3s duration — faster caustics read as UI feedback rather than ambient oceanic light
- Do not use blur filters on the caustic overlay for performance reasons; radial-gradient opacity variation achieves the effect without repaints
