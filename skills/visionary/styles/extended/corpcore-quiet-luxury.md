---
id: corpcore-quiet-luxury
category: extended
motion_tier: Subtle
density: sparse
locale_fit: [all]
palette_tags: [neon, editorial]
keywords: [corpcore, quiet, luxury, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Corpcore Quiet Luxury

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Cormorant weight 300/400 — understated elegance, old money restraint
- **Body font:** Cormorant Regular 400
- **Tracking:** 0.02em | **Leading:** 1.6

## Colors
- **Background:** #F2EDE7 (greige)
- **Primary action:** #A69F96 (stone)
- **Accent:** #C4A35A (discrete gold — not gaudy)
- **Elevation model:** ultra-subtle — 0 1px 8px rgba(0,0,0,0.04); wealth does not announce itself

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 160, damping: 30 }` — slow, deliberate, never urgent
- **Enter animation:** fade 300ms ease-out; 2px drift; no rush
- **Forbidden:** bold weights, bright saturated color, bounce, fast transitions

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 4–8px; refined but not ostentatious

## Code Pattern
```css
.quiet-luxury-card {
  background: #F7F4EF;
  border: 1px solid rgba(166, 159, 150, 0.2);
  border-radius: 6px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
  padding: 40px;
}

.quiet-luxury-heading {
  font-family: 'Cormorant', 'Cormorant Garamond', Georgia, serif;
  font-weight: 300;
  color: #3A3530;
  letter-spacing: 0.02em;
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
- Weight 300 is mandatory for display headings — weight 500+ collapses "quiet luxury" into generic premium; the restraint IS the luxury signal
- Gold accent (#C4A35A) must appear in ≤ 1 element per view; multiple gold elements reads as nouveau riche rather than understated wealth
