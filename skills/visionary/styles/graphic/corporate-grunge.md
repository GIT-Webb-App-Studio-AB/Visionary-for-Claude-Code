---
id: corporate-grunge
category: graphic
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [light]
keywords: [corporate, grunge, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Corporate Grunge

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** Arial Bold (distressed via filter or texture overlay) — corporate font made gritty
- **Body font:** Arial Regular
- **Tracking:** 0.02em | **Leading:** 1.4

## Colors
- **Background:** #E8E4DC (aged office paper)
- **Primary action:** #1C1C1C (stamp black)
- **Accent:** #8B3A1A (rust — corporate degradation)
- **Elevation model:** worn shadows; photocopy degradation, no clean drop shadows

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 300, damping: 32 }` — stiff, bureaucratic
- **Enter animation:** stamp-in — instant appear with brief scale 1.02 → 1, 100ms
- **Forbidden:** clean gradients, polished shadows, anything suggesting the brand is healthy

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; stamped bureaucratic forms are rectilinear

## Code Pattern
```css
.corporate-stamp {
  font-family: Arial, Helvetica, sans-serif;
  font-weight: 700;
  color: #8B3A1A;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.7; /* degraded ink */
  transform: rotate(-8deg);
  border: 3px solid #8B3A1A;
  padding: 4px 12px;
  display: inline-block;
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
- Distress effect must be applied via filter or texture overlay on the element, not by using a distressed font — proper distressed fonts don't exist for Arial and faking it with image filters is more controllable
- Stamp rotation must be ≤ ±12 degrees; beyond that it reads as deliberate design accident rather than authentic stamp misalignment
