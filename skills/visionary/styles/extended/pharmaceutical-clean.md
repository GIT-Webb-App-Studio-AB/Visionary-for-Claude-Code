---
id: pharmaceutical-clean
category: extended
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, pastel, trust]
keywords: [pharmaceutical, clean, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Pharmaceutical Clean

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Helvetica Neue (or Inter) — clinical precision, zero personality
- **Body font:** Inter Regular
- **Tracking:** -0.01em | **Leading:** 1.5

## Colors
- **Background:** #FAFCFF (clinical white with blue undertone)
- **Primary action:** #005CB9 (pharma blue — FDA-adjacent)
- **Accent:** #E8F0F8 (light clinical tint)
- **Elevation model:** ultra-thin borders; 0 1px 4px rgba(0,0,255,0.04) — clinical precision

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 260, damping: 28 }` — precise, no ambiguity
- **Enter animation:** fade 150ms ease-out; pharmaceutical packaging doesn't animate
- **Forbidden:** warm colors, decorative elements, any non-functional visual

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 4px; clinical equipment has minimal rounding

## Code Pattern
```css
.pharma-card {
  background: #FAFCFF;
  border: 1px solid rgba(0, 92, 185, 0.12);
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 92, 185, 0.06);
}

.dosage-label {
  font-family: 'Helvetica Neue', 'Inter', sans-serif;
  font-size: 0.75rem;
  color: #005CB9;
  text-transform: uppercase;
  letter-spacing: 0.08em;
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
- Blue accent must be a single institutional hue — multiple blue tones read as branding inconsistency, which in pharma context signals unreliability
- Never add decorative shadows beyond 1px; pharmaceutical packaging trust comes from clinical precision, not design warmth
