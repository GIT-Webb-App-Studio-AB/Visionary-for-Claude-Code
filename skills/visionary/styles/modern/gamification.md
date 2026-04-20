---
id: gamification
category: modern
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [neon, earth]
keywords: [gamification, modern]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Gamification

**Category:** modern
**Motion tier:** Kinetic

## Typography
- **Display font:** Nunito ExtraBold — friendly, rounded, energetic
- **Body font:** Fredoka (or Nunito Regular)
- **Tracking:** 0em | **Leading:** 1.3 | **Weight range:** 400/700/900

## Colors
- **Background:** #1A1033
- **Primary action:** #F59E0B (amber — reward, achievement)
- **Accent:** #8B5CF6 (violet — levels, progress)
- **Elevation model:** vivid glows (0 0 20px rgba(245,158,11,0.4)) on achievement states

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `stiffness: 150, damping: 10, mass: 0.7` — bouncy, celebratory
- **Enter animation:** achievement-pop (scale 0 → 1.2 → 1, bounce ease, 400ms) for rewards; progress-fill (width 0 → target, 600ms spring) for bars
- **Forbidden:** subtle motion for achievements (rewards must feel rewarding), negative motion (shrink, fade) for positive outcomes

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 12px standard; 999px for XP bars and pill badges; 16px for cards

## Code Pattern
```css
.xp-bar {
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  overflow: hidden;
}
.xp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #F59E0B, #FBBF24);
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.5);
}
.achievement-badge {
  background: radial-gradient(circle, #F59E0B, #D97706);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.6);
}
```

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
Progress bars must show genuine progress — a bar that fills on page load with no user action feels hollow and manipulative. Gamification works when achievements are tied to real user actions. Never use `animation: spin` on a loading state and call it gamification — engagement mechanics require semantic meaning.
