---
id: constructivism
category: historical
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, pastel]
keywords: [constructivism, historical]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Constructivism

**Category:** historical
**Motion tier:** Expressive

## Typography
- **Display font:** Syne Bold — angular, forceful letterforms
- **Body font:** Space Grotesk
- **Tracking:** 0.05em | **Leading:** 1.15 | **Weight range:** 700/900

## Colors
- **Background:** #FFFFFF
- **Primary action:** #CC0000
- **Accent:** #000000
- **Elevation model:** none — layered flat planes create depth

## Motion
- **Tier:** Expressive
- **Spring tokens:** `stiffness: 200, damping: 20` — deliberate, weighty
- **Enter animation:** slide-diagonal (translateX(-20px) + translateY(-10px) → 0, 300ms)
- **Forbidden:** soft eases, pastel palettes, symmetrical layouts

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px — structural rigidity; diagonal lines as decorative element

## Code Pattern
```css
.constructivist-hero {
  position: relative;
  background: #CC0000;
  clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);
  padding: 64px 48px;
}
.constructivist-diagonal {
  transform: rotate(-3deg);
  display: inline-block;
  color: #CC0000;
  font-weight: 900;
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
Diagonal energy must feel intentional, not accidental. Do not apply random rotations — diagonals should cut decisively across a clear grid structure. Avoid symmetry; the movement celebrated dynamic tension.
