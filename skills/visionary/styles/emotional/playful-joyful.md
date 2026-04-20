---
id: playful-joyful
category: emotional
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, pastel, trust]
keywords: [playful, joyful, emotional]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Playful Joyful

**Category:** emotional
**Motion tier:** Expressive

## Typography
- **Display font:** Nunito 800 (rounded letterforms reinforce play)
- **Body font:** Nunito 500
- **Weight range:** 500–800
- **Tracking:** -0.01em display, 0em body
- **Leading:** 1.15 display, 1.65 body

## Colors
- **Background:** #FFFBF0 (warm cream — not clinical white)
- **Primary action:** #FF6B35 (playful orange)
- **Accent:** #4ECDC4 (friendly teal)
- **Elevation model:** soft colored shadows (0 4px 16px rgba(255, 107, 53, 0.2))

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 260, damping: 20, mass: 1.0
- **Enter animation:** elements bounce in from below, icons wiggle on hover (rotate -5deg → 5deg → 0)
- **Forbidden:** sharp snap animations, dark themes, anything that creates tension or urgency

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 16px cards, 12px inputs, 999px buttons — consistently generous

## Code Pattern
```css
@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-8deg); }
  75% { transform: rotate(8deg); }
}

.playful-icon:hover {
  animation: wiggle 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

.playful-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(255, 107, 53, 0.12);
  border: 2px solid transparent;
  transition: border-color 0.2s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.playful-card:hover {
  border-color: rgba(255, 107, 53, 0.3);
  transform: translateY(-4px) rotate(0.5deg);
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
- Using the wiggle animation on every interactive element; playful motion must be surprising, not constant — overuse creates fatigue
- Pairing Nunito with a sharp geometric sans as body; the rounded letterforms must carry through to body text for tonal consistency
