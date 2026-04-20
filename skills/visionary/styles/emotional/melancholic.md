---
id: melancholic
category: emotional
motion_tier: Subtle
density: sparse
locale_fit: [all]
palette_tags: [dark, light, neon, pastel]
keywords: [melancholic, emotional]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Melancholic

**Category:** emotional
**Motion tier:** Subtle

## Typography
- **Display font:** Libre Baskerville 400 (weight restrained — sadness is not dramatic)
- **Body font:** Libre Baskerville 400
- **Weight range:** 300–500 (no bold — melancholy doesn't shout)
- **Tracking:** 0.03em (slightly open — wistful breathing room)
- **Leading:** 1.8 body (slow, deliberate reading pace)

## Colors
- **Background:** #1C1C1E (deep grey, not black — melancholy has texture)
- **Primary action:** #7A8A9A (muted blue-grey — faded, not vibrant)
- **Accent:** #4A5568 (deeper grey for secondary elements)
- **Elevation model:** none — melancholy is flat

## Motion
- **Tier:** Subtle (slow, deliberate)
- **Spring tokens:** stiffness: 80, damping: 30, mass: 2.0
- **Enter animation:** opacity 0→0.85 over 1000ms — elements never reach full opacity in melancholic design
- **Forbidden:** bright saturated colors, bouncy springs, any motion that communicates joy or urgency

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px or 2px — no softening; melancholy doesn't round its edges

## Code Pattern
```css
.melancholic-surface {
  background: #1C1C1E;
  color: rgba(255, 255, 255, 0.7); /* never full opacity */
  padding: 48px;
}

.melancholic-headline {
  font-family: 'Libre Baskerville', 'Georgia', serif;
  font-size: clamp(1.75rem, 4vw, 3.5rem);
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: 0.03em;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 32px;
}

.melancholic-body {
  font-family: 'Libre Baskerville', 'Georgia', serif;
  font-size: 1rem;
  line-height: 1.8;
  letter-spacing: 0.03em;
  color: rgba(255, 255, 255, 0.55);
  max-width: 62ch;
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
- Setting text to full white opacity — melancholic text should never be at full contrast; the faded opacity IS the emotional signal of incompleteness
- Using a dark background that is pure #000000 black; true melancholy has warmth in its darkness — pure black reads as void or aggressive, not sad
