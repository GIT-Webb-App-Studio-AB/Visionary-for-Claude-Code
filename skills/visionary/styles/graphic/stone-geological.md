---
id: stone-geological
category: graphic
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [pastel]
keywords: [stone, geological, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Stone Geological

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** Rockwell (or Arvo as web fallback) — slab weight evokes carved stone
- **Body font:** Arvo
- **Tracking:** 0.03em | **Leading:** 1.5

## Colors
- **Background:** #4A4A4A (slate grey)
- **Primary action:** #E8E0D5 (limestone pale)
- **Accent:** #8B7355 (sandstone)
- **Elevation model:** chiseled inset shadows; no glow, no soft blur

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 500, damping: 50 }` — near-rigid
- **Enter animation:** fade 150ms linear; stone does not spring
- **Forbidden:** bounce, glow, warm shadows, any elastic easing

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; stone is fractured or chiseled, never rounded

## Code Pattern
```css
.stone-surface {
  background: #4A4A4A;
  box-shadow:
    inset 2px 2px 4px rgba(0,0,0,0.5),
    inset -1px -1px 2px rgba(255,255,255,0.05);
  border-top: 1px solid #5A5A5A;
  border-left: 1px solid #5A5A5A;
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
- The chiseled shadow must use inset only — outer drop shadows make stone look levitating
- Avoid Inter or Helvetica body text; their geometric softness contradicts the geological weight
