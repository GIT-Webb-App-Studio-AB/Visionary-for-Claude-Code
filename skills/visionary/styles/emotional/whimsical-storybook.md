---
id: whimsical-storybook
category: emotional
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [light, neon, pastel, editorial, trust]
keywords: [whimsical, storybook, emotional]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Whimsical Storybook

**Category:** emotional
**Motion tier:** Expressive

## Typography
- **Display font:** Playfair Display 700 (fairy-tale editorial) or Lora 700
- **Body font:** Lora 400 (italic body for narrative sections)
- **Weight range:** 400–700
- **Tracking:** 0em display, 0.01em body
- **Leading:** 1.2 display, 1.75 body (story-reading rhythm)

## Colors
- **Background:** #FFF8F0 (warm parchment)
- **Primary action:** #6B4CA0 (storybook purple)
- **Accent:** #E8B84B (fairy-tale gold)
- **Elevation model:** soft warm shadows (0 4px 20px rgba(107, 76, 160, 0.1))

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 180, damping: 22, mass: 1.2
- **Enter animation:** elements drift in with a slight float arc (translate Y 20px + rotate 1deg → 0), 500ms
- **Forbidden:** clinical precision, sharp geometric animation paths, anything that reads as tech or digital-native

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** organic variation — 12px, 20px, and fully rounded mixed to suggest hand-crafted elements

## Code Pattern
```css
@keyframes storybook-float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(0.5deg); }
}

.storybook-illustration {
  animation: storybook-float 4s ease-in-out infinite;
}

.storybook-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(107, 76, 160, 0.1),
              0 0 0 1px rgba(232, 184, 75, 0.15);
  position: relative;
}

.storybook-card::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 20px;
  right: 20px;
  height: 4px;
  background: linear-gradient(90deg, #6B4CA0, #E8B84B);
  border-radius: 999px;
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
- Using a geometric sans for any text element; storybook aesthetic is entirely serif and script — even UI labels should use the serif if possible
- Making the float animation fast; whimsy is slow and dreamy, not quick and snappy
