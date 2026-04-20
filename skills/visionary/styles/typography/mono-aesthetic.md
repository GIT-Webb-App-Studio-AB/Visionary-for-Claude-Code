---
id: mono-aesthetic
category: typography
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, neon, earth, organic]
keywords: [mono, aesthetic, typography, led]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Mono Aesthetic

**Category:** typography
**Motion tier:** Subtle

## Typography
- **Display font:** JetBrains Mono
- **Body font:** JetBrains Mono
- **Weight range:** 400–700
- **Tracking:** 0.02em on all text
- **Leading:** 1.5–1.7 (generous, respects the mono grid)

## Colors
- **Background:** #0D0D0D
- **Primary action:** #00FF41 (green terminal) or #FFB000 (amber terminal)
- **Accent:** #444444
- **Elevation model:** glows (box-shadow: 0 0 20px rgba(0, 255, 65, 0.3))

## Motion
- **Tier:** Subtle
- **Spring tokens:** stiffness: 500, damping: 35, mass: 0.5
- **Enter animation:** cursor-blink reveal — text appears character by character at 30ms intervals
- **Forbidden:** rounded corners, serif fonts as accents, gradient backgrounds

## Spacing
- **Base grid:** 8px (character-cell aligned)
- **Border-radius vocabulary:** 0px everywhere — terminals have no curves

## Code Pattern
```css
.mono-terminal {
  font-family: 'JetBrains Mono', monospace;
  background: #0D0D0D;
  color: #00FF41;
  padding: 24px;
  border-radius: 0;
  border: 1px solid #1A1A1A;
}

.mono-cursor::after {
  content: '█';
  animation: blink 1s step-end infinite;
  color: #00FF41;
}

@keyframes blink {
  50% { opacity: 0; }
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
- Using a geometric sans for body text alongside mono display — defeats the entire aesthetic commitment
- Choosing green AND amber without picking one; the single-color terminal palette is the identity
