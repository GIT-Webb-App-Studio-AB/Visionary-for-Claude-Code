---
id: art-deco
category: historical
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, editorial]
keywords: [art, deco, historical]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Art Deco

**Category:** historical
**Motion tier:** Expressive

## Typography
- **Display font:** Cormorant Garamond — aristocratic elegance, high contrast strokes
- **Body font:** Cormorant Garamond Light
- **Tracking:** 0.1em (all-caps headings) | **Leading:** 1.5 | **Weight range:** 300/400/600

## Colors
- **Background:** #0A0A0F
- **Primary action:** #C9A84C
- **Accent:** #F5F0E8
- **Elevation model:** hairline gold borders replace shadows

## Motion
- **Tier:** Expressive
- **Spring tokens:** `stiffness: 150, damping: 18` — sweeping, theatrical
- **Enter animation:** reveal top-to-bottom (clipPath: `inset(0 0 100% 0)` → `inset(0 0 0% 0)`, 500ms ease-out)
- **Forbidden:** rounded corners, casual motion, flat bright colors

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px — geometric angles, chevrons, sunburst patterns

## Code Pattern
```css
.art-deco-heading {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #C9A84C;
}
.art-deco-card {
  border: 1px solid #C9A84C;
  border-top: 4px solid #C9A84C;
  background: #0A0A0F;
  padding: 32px;
}
.art-deco-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #C9A84C;
}
.art-deco-divider::before,
.art-deco-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #C9A84C, transparent);
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
Avoid warm orange or yellow — gold (#C9A84C) is specific and precious, not generic. Never use border-radius. All-caps tracking must be `0.1em` minimum — tighter reads as modern SaaS, not Deco.
