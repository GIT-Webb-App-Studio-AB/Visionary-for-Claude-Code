---
id: fashion-editorial
category: graphic
motion_tier: Expressive
density: sparse
locale_fit: [all]
palette_tags: [dark, light, neon, monochrome, editorial]
keywords: [fashion, editorial, hybrid]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Fashion Editorial

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Cormorant Garamond — ultra high-contrast, fashion-magazine authority
- **Body font:** Cormorant Garamond Regular
- **Tracking:** 0.08em | **Leading:** 1.4

## Colors
- **Background:** #FFFFFF (stark white) or #0A0A0A (stark black)
- **Primary action:** #000000 or #FFFFFF (inverse of background)
- **Accent:** none — fashion editorial uses monochrome discipline
- **Elevation model:** no shadows; depth through scale and white space only

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 200, damping: 22 }` — confident, not bouncy
- **Enter animation:** gentle fade + 6px upward drift, 400ms ease-out
- **Forbidden:** rounded corners > 4px, gradients, color accents, fast snappy transitions

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–2px; fashion editorial is uncompromisingly geometric

## Code Pattern
```css
.fashion-hero-type {
  font-family: 'Cormorant Garamond', 'Playfair Display', serif;
  font-size: clamp(3rem, 8vw, 8rem);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 0.95;
  font-weight: 300;
}

.fashion-caption {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #888888;
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
- Display font must be loaded at weight 300 — Cormorant at 400+ loses the fragile high-contrast hairline quality that makes fashion editorial distinctive
- Never add a color accent; fashion editorial's power comes from monochrome restraint; a single colored element shatters the register
