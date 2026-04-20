---
id: glassmorphism
category: morphisms
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, pastel]
keywords: [glassmorphism, morphisms]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Glassmorphism

**Category:** morphisms
**Motion tier:** Expressive

## Typography
- **Display font:** Space Grotesk — geometric warmth reads well over blurred backgrounds without competing
- **Body font:** Inter
- **Tracking:** -0.01em | **Leading:** 1.55

## Colors
- **Background:** #0f0f1a — deep near-black that saturates the blur effect
- **Primary action:** rgba(255,255,255,0.9) text on #6366f1 pill button
- **Accent:** #a78bfa — violet that vibrates against dark glass
- **Elevation model:** glows — inset box-shadow + outer diffuse glow, no hard drop shadows

## Motion
- **Tier:** Expressive
- **Spring tokens:** snappy (panel open), ui (hover lift), gentle (backdrop reveal)
- **Enter animation:** fade-up with blur-in (filter: blur(8px)→blur(0) + translateY(12px)→0)
- **Forbidden:** opacity-only fades (flat), scale-bounce on panels (kills glass illusion)

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 20px panels, 12px inputs, 999px pills — generous rounding reinforces softness

## Code Pattern
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.05) inset,
    0 8px 32px rgba(0,0,0,0.4);
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
- **Too much blur:** backdrop-filter: blur(60px) turns panels into smears — 20-28px is the sweet spot
- **White overlay abuse:** rgba(255,255,255,0.3) looks like a broken opacity, not glass — keep alpha ≤ 0.12
