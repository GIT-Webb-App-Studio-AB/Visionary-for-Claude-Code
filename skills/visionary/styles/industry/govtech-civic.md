---
id: govtech-civic
category: industry
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, trust]
keywords: [govtech, civic, industry]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Govtech Civic

**Category:** industry
**Motion tier:** Subtle

## Typography
- **Display font:** Source Serif 4 600
- **Body font:** Source Sans 3 400
- **Weight range:** 400–600
- **Tracking:** 0em (accessibility-first — no decorative tracking that reduces legibility)
- **Leading:** 1.6 body (WCAG reading guidance)

## Colors
- **Background:** #FFFFFF
- **Primary action:** #005EA2 (US federal blue / gov.uk blue — trusted, not branded)
- **Accent:** #D83933 (accessible civic red for alerts)
- **Elevation model:** subtle borders (1px solid #DFE1E2) over shadows — cleaner for print-to-screen parity

## Motion
- **Tier:** Subtle
- **Spring tokens:** stiffness: 400, damping: 40, mass: 0.9
- **Enter animation:** opacity 0→1, 200ms — efficient, never decorative
- **Forbidden:** kinetic animation, decorative transitions, anything that increases cognitive load for diverse citizen users

## Spacing
- **Base grid:** 8px (USWDS/GOV.UK compatible)
- **Border-radius vocabulary:** 4px consistent — following government design system standards

## Code Pattern
```css
/* USWDS-compatible patterns */
.civic-alert {
  border-left: 4px solid #005EA2;
  padding: 16px;
  background: #E8F4FD;
  border-radius: 0;
}

.civic-button {
  background: #005EA2;
  color: #FFFFFF;
  border-radius: 4px;
  padding: 10px 20px;
  font-family: 'Source Sans 3', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
}

.civic-button:focus-visible {
  outline: 4px solid #FFBE2E;
  outline-offset: 2px;
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
- Attempting to "modernize" with gradients or bold brand colors — govtech credibility requires restraint; citizens must trust the form before they submit data
- Reducing focus ring visibility for aesthetics; government interfaces require visible focus states for keyboard and assistive technology users
