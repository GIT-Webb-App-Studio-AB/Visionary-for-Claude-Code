---
id: clinical-cold
category: emotional
motion_tier: Subtle
density: sparse
locale_fit: [all]
palette_tags: [dark, light, trust]
keywords: [clinical, cold, emotional]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Clinical Cold

**Category:** emotional
**Motion tier:** Subtle

## Typography
- **Display font:** IBM Plex Sans 400–500
- **Body font:** IBM Plex Sans 400
- **Weight range:** 300–600 (nothing dramatic)
- **Tracking:** 0.02em labels, 0em body
- **Leading:** 1.4 display, 1.5 body (efficient, not generous)

## Colors
- **Background:** #F4F6F8 (cold grey-blue tint)
- **Primary action:** #0066CC (cold blue)
- **Accent:** #6B7280 (neutral grey — no warmth)
- **Elevation model:** flat borders (1px solid #E5E7EB) over shadows — clinical preference for flat surfaces

## Motion
- **Tier:** Subtle (mechanical, not organic)
- **Spring tokens:** stiffness: 600, damping: 45, mass: 0.6
- **Enter animation:** linear opacity 0→1, 150ms — no spring, no curve, just linear
- **Forbidden:** warm colors, rounded organic forms, anything suggesting human emotion or error

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 2px consistent — functional minimum, not designed

## Code Pattern
```css
.clinical-cold-surface {
  background: #F4F6F8;
  border: 1px solid #E5E7EB;
  border-radius: 2px;
  padding: 20px 24px;
}

.clinical-data-row {
  display: flex;
  align-items: baseline;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid #E5E7EB;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
}

.clinical-key {
  color: #6B7280;
  font-weight: 400;
  min-width: 160px;
}

.clinical-value {
  color: #111827;
  font-weight: 500;
  font-feature-settings: 'tnum' 1;
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
- Warming up the background even slightly (cream, off-white) — the cold grey-blue tint is the emotional signal; warmth undermines the clinical register immediately
- Adding any hover state that goes beyond border-color change; clinical interfaces perform functions, they don't invite delight
