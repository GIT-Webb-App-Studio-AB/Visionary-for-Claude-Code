---
id: anxiety-urgency
category: emotional
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [light, neon, earth]
keywords: [anxiety, urgency, emotional]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Anxiety Urgency

**Category:** emotional
**Motion tier:** Kinetic

## Typography
- **Display font:** Helvetica Neue 700 or Inter 700 (familiar, everyday — anxiety uses known, not exotic)
- **Body font:** Inter 400
- **Weight range:** 400–700
- **Tracking:** 0em body, 0.05em uppercase labels (urgency labels must be clear)
- **Leading:** 1.3 (tight — urgency compresses space)

## Colors
- **Background:** #FFFFFF or #FFF5F5 (barely-there warning tint)
- **Primary action:** #EF4444 (urgent red)
- **Accent:** #F97316 (warning amber for secondary urgency)
- **Elevation model:** hard prominent shadows (0 4px 12px rgba(239, 68, 68, 0.25))

## Motion
- **Tier:** Kinetic (purposeful, not decorative)
- **Spring tokens:** stiffness: 600, damping: 25, mass: 0.6
- **Enter animation:** notifications slide in from top with bounce, timers pulse at critical thresholds
- **Forbidden:** slow transitions that delay urgent information, gentle easing on countdown timers

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 4px indicators, 8px alerts, 999px countdown badges

## Code Pattern
```css
@keyframes urgent-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}

.urgency-indicator {
  background: #EF4444;
  color: white;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  animation: urgent-pulse 1.5s ease-in-out infinite;
}

.urgency-countdown {
  font-size: 2.5rem;
  font-weight: 700;
  font-feature-settings: 'tnum' 1;
  color: #EF4444;
  line-height: 1;
}
```

**Blocked contexts:** Healthcare, Children's products, Mental health apps

## Accessibility

### Contrast
Body text must clear 4.5:1 (WCAG 2.2 AA) AND APCA Lc ≥ 75. Large text / UI labels: 3:1 and Lc ≥ 60. Run axe-core + apca-w3 during the critique loop.

### Focus
Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.

### Motion
This style exposes motion that can run longer than 5 seconds. Ship a visible pause/stop control bound to `animation-play-state` (CSS) or the JS equivalent — required by WCAG 2.2.2 (Level A). Also degrade to opacity-only transitions under `prefers-reduced-motion: reduce`.

### Touch target
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
- Using urgency animation indiscriminately — anxiety/urgency is the style for scarcity-driven commerce; it is actively harmful in healthcare or mental health contexts
- Pulsing elements that are not genuinely time-sensitive; false urgency is immediately recognized and destroys credibility
