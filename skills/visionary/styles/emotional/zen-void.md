---
id: zen-void
category: emotional
motion_tier: Subtle
density: sparse
locale_fit: [all]
palette_tags: [dark, light, trust]
keywords: [zen, void, emotional]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Zen Void

**Category:** emotional
**Motion tier:** Subtle

## Typography
- **Display font:** Libre Baskerville 300–400 (light weight signals restraint)
- **Body font:** Libre Baskerville 400
- **Weight range:** 300–400 (intentionally narrow — weight is drama, and this style refuses drama)
- **Tracking:** 0.04em body (open tracking for breath)
- **Leading:** 1.9 body (maximum breath between lines — the space is the content)

## Colors
- **Background:** #FAFAF8 (almost white — not clinical, not warm, just present) or #1A1A18 (dark mode)
- **Primary action:** #1A1A18 (dark) or #FAFAF8 (light)
- **Accent:** none — accent colors introduce desire; zen has no desire
- **Elevation model:** none — z-index is ego; zen has no ego

## Motion
- **Tier:** Subtle (near-invisible)
- **Spring tokens:** stiffness: 80, damping: 35, mass: 2.0 (slowest possible spring)
- **Enter animation:** opacity 0→1 over 1200ms — disappear and appear, no positional movement
- **Forbidden:** bounce, scale animations, fast anything, color changes on interaction

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px or 2px — minimal, not designed

## Code Pattern
```css
.zen-section {
  padding: 120px 0;
  max-width: 680px;
  margin: 0 auto;
}

.zen-body {
  font-family: 'Libre Baskerville', 'Georgia', serif;
  font-size: 1.125rem;
  font-weight: 400;
  line-height: 1.9;
  letter-spacing: 0.04em;
  color: rgba(26, 26, 24, 0.75);
}

.zen-headline {
  font-family: 'Libre Baskerville', 'Georgia', serif;
  font-size: 2rem;
  font-weight: 300;
  line-height: 1.3;
  letter-spacing: 0.04em;
  margin-bottom: 48px;
}

.zen-divider {
  width: 32px;
  height: 1px;
  background: currentColor;
  opacity: 0.2;
  margin: 64px auto;
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
- Reducing section padding below 80px; the whitespace IS the content — a compressed zen layout reads as unfinished, not restrained
- Adding any interactive hover effect beyond a barely-visible opacity shift; zen has no reward for seeking
