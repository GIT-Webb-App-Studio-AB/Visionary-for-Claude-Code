---
id: luxury-aspirational
category: emotional
motion_tier: Expressive
density: sparse
locale_fit: [all]
palette_tags: [dark, light, neon, editorial]
keywords: [luxury, aspirational, emotional]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Luxury Aspirational

**Category:** emotional
**Motion tier:** Expressive

## Typography
- **Display font:** Cormorant Garamond 400–600
- **Body font:** Cormorant 400 (italic variant for pull quotes)
- **Weight range:** 300–600
- **Tracking:** 0.06em display (wide tracking signals exclusivity), 0.02em body
- **Leading:** 1.2 display, 1.7 body (generous reading space)

## Colors
- **Background:** #0D0A08 (warm near-black for evening/editorial) or #F5F0E8 (cream for daytime)
- **Primary action:** #C8A96E (warm gold — never #FFD700 which reads as cheap)
- **Accent:** #FFFFFF (dark mode) or #1A1208 (light mode)
- **Elevation model:** none (dark) or barely-there borders (light): 1px solid rgba(200,169,110,0.15)

## Motion
- **Tier:** Expressive (slow — luxury never rushes)
- **Spring tokens:** stiffness: 120, damping: 30, mass: 1.4
- **Enter animation:** opacity 0→1 over 800ms + translate Y 12px→0 — deliberately unhurried
- **Forbidden:** bounce springs (undignified), scale animations (aggressive), fast snap (impatient), anything that appears in a mass-market consumer context

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px (editorial) or 2px (product) — luxury geometry is sharp

## Code Pattern
```css
.luxury-headline {
  font-family: 'Cormorant Garamond', 'Garamond', serif;
  font-size: clamp(2.5rem, 5vw, 5rem);
  font-weight: 400;
  letter-spacing: 0.06em;
  line-height: 1.2;
  color: #C8A96E;
}

.luxury-body {
  font-family: 'Cormorant', 'Garamond', serif;
  font-size: 1rem;
  line-height: 1.7;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.75);
  max-width: 60ch;
}

.luxury-divider {
  width: 60px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #C8A96E, transparent);
  margin: 40px auto;
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
- Using #FFD700 bright gold — it reads as novelty store, not high jewellery; the warm, slightly desaturated #C8A96E reads as genuine gold
- Speeding up the enter animation to feel "snappy" — luxury products signal that they are worth waiting for; slow motion is the point
