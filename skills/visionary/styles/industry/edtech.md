---
id: edtech
category: industry
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, pastel]
keywords: [edtech, industry]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# EdTech

**Category:** industry
**Motion tier:** Expressive

## Typography
- **Display font:** Nunito 700–800
- **Body font:** Plus Jakarta Sans 400
- **Weight range:** 400–800
- **Tracking:** -0.01em display, 0em body
- **Leading:** 1.15 display, 1.65 body (generous for reading comprehension)

## Colors
- **Background:** #FFFFFF or #F8F7FF (very light lavender)
- **Primary action:** #6C47FF (educational purple)
- **Accent:** #FF6B35 (energetic orange for achievements/streaks)
- **Elevation model:** soft shadows (0 2px 16px rgba(108, 71, 255, 0.1))

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 250, damping: 20, mass: 1.0
- **Enter animation:** scale 0.92→1 + opacity 0→1 on lesson cards, confetti burst on achievement
- **Forbidden:** intimidating snap animations near quiz results, motion near countdown timers that creates anxiety

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 16px lesson cards, 12px inputs, 999px progress pills and achievement badges

## Code Pattern
```css
.edtech-progress-ring {
  width: 80px;
  height: 80px;
}

.edtech-progress-ring circle {
  stroke-width: 6;
  fill: transparent;
  stroke: #6C47FF;
  stroke-dasharray: 220;
  stroke-dashoffset: calc(220 - (220 * var(--progress)) / 100);
  stroke-linecap: round;
  transition: stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: center;
  transform: rotate(-90deg);
}

.edtech-lesson-card {
  border-radius: 16px;
  padding: 24px;
  background: white;
  box-shadow: 0 2px 16px rgba(108, 71, 255, 0.1);
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.edtech-lesson-card:hover {
  transform: translateY(-4px) scale(1.01);
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
- Making the interface look like consumer entertainment (Netflix-dark) — edtech must feel purposeful and structured, not passive
- Using red for incorrect answers without pairing it with a constructive explanation; edtech must motivate, not punish
