---
id: medtech-clinical
category: industry
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, organic, trust]
keywords: [medtech, clinical, industry]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Medtech Clinical

**Category:** industry
**Motion tier:** Subtle

## Typography
- **Display font:** IBM Plex Sans 500–600
- **Body font:** IBM Plex Sans 400
- **Weight range:** 400–600
- **Tracking:** 0em (clinical precision — no decorative tracking)
- **Leading:** 1.5 body, 1.25 display

## Colors
- **Background:** #F8F9FA
- **Primary action:** #007AFF (clinical blue — unambiguous, universally recognized)
- **Accent:** #34C759 (positive status green)
- **Elevation model:** subtle shadows (0 1px 3px rgba(0,0,0,0.08))

## Motion
- **Tier:** Subtle
- **Spring tokens:** stiffness: 500, damping: 40, mass: 0.7
- **Enter animation:** opacity 0→1 over 200ms — fast, clinical, no distraction
- **Forbidden:** bounce, kinetic animation, anything that could distract a clinician during a procedure

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 4px everywhere — consistent, not designed, just functional

## Code Pattern
```css
.clinical-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 4px;
  border-left: 4px solid #FF3B30;
  background: #FFF5F5;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1A1A1A;
}

.clinical-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #6B7280;
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
- Using playful rounded corners (12px+) near patient data; clinical interfaces must signal precision, not approachability
- Adding animation to status indicators; clinical status must update in place without motion that could be mistaken for a system action

**WCAG AAA required for all text in patient-facing views.**
