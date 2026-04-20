---
id: claymorphism
category: morphisms
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, pastel]
keywords: [claymorphism, morphisms]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Claymorphism

**Category:** morphisms
**Motion tier:** Expressive

## Typography
- **Display font:** Nunito 700 — rounded terminals echo the inflated 3D form language
- **Body font:** Nunito 400
- **Tracking:** -0.01em | **Leading:** 1.5

## Colors
- **Background:** #F5E6FF — lavender pastel that reads as "soft plastic"
- **Primary action:** #7C3AED — saturated violet with white text
- **Accent:** #FB923C — warm orange for contrast without aggression
- **Elevation model:** thick drop shadow + inner highlight — creates inflated 3D blob illusion

## Motion
- **Tier:** Expressive
- **Spring tokens:** bounce (card hover), snappy (button press), layout (list reorder)
- **Enter animation:** scale from 0.85 + slight overshoot (spring with damping 0.6)
- **Forbidden:** sharp transforms, linear easing, anything with 0 bounce — kills the inflated material feel

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 24px minimum on all elements, 32px cards, 999px pills — nothing below 20px

## Code Pattern
```css
.clay-card {
  background: linear-gradient(145deg, #f0e6ff, #e8d5fa);
  border-radius: 28px;
  box-shadow:
    0 20px 60px rgba(124, 58, 237, 0.25),
    0 8px 20px rgba(124, 58, 237, 0.15),
    inset 0 2px 4px rgba(255,255,255,0.7);
  border: 1px solid rgba(255,255,255,0.5);
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
- **Thin shadows:** A 2px drop shadow on a claymorphism card looks like a bug — shadows need to be deep and diffuse (20px+ blur)
- **Dark color palette:** Claymorphism needs pastels; dark clay becomes murky and loses the inflated 3D read
