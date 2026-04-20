---
id: paper-cut
category: extended
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [light, organic]
keywords: [paper, cut, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Paper Cut

**Category:** extended
**Motion tier:** Expressive

## Typography
- **Display font:** Nunito ExtraBold — rounded, approachable, complements the hand-cut aesthetic
- **Body font:** Nunito Regular
- **Tracking:** 0em | **Leading:** 1.6

## Colors
- **Background:** #F7F3ED (cream base layer)
- **Primary action:** #E84545 (cut red layer)
- **Accent:** #2D6A4F (forest green layer)
- **Elevation model:** layered drop shadows simulating paper depth; each layer +2px Y +1px blur

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 220, damping: 18 }`
- **Enter animation:** layers slide-in sequentially with 40ms stagger, bottom layer first
- **Forbidden:** glow, metallic sheen, sharp geometric transitions

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–2px; cut paper has clean edges, not machined curves

## Code Pattern
```css
.paper-layer {
  position: relative;
  box-shadow:
    2px 2px 0 rgba(0,0,0,0.08),
    4px 4px 0 rgba(0,0,0,0.06),
    6px 6px 0 rgba(0,0,0,0.04);
}

.paper-layer--foreground {
  transform: translateY(-4px);
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
- Each layer shadow must step in consistent increments — random blur values break the physical depth illusion
- Do not use border-radius > 2px; rounded paper cut silhouettes lose the crisp cut-with-scissors authenticity
