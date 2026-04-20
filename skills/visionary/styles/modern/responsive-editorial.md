---
id: responsive-editorial
category: modern
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [light, neon, editorial]
keywords: [responsive, editorial, modern]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Responsive Editorial

**Category:** modern
**Motion tier:** Expressive

## Typography
- **Display font:** Source Serif 4 — editorial authority, optical sizing support
- **Body font:** Source Serif 4 Regular (optical-size: auto)
- **Tracking:** 0em | **Leading:** 1.7 | **Weight range:** 300/400/700/900

## Colors
- **Background:** #FFFFFF
- **Primary action:** #1A1A1A
- **Accent:** #C41E3A (editorial red — link, pullquote, highlight)
- **Elevation model:** none — white space and type hierarchy create depth

## Motion
- **Tier:** Expressive
- **Spring tokens:** `stiffness: 160, damping: 18`
- **Enter animation:** reading-direction fade (opacity + translateY(12px) → 0, stagger per block, 80ms apart)
- **Forbidden:** bounce, scale transforms on text, horizontal slides that fight reading direction

## Spacing
- **Base grid:** 8px; text column max-width: 680px; wide media breakout: 110% of column
- **Border-radius vocabulary:** 0px for editorial elements; 4px only for UI affordances (buttons, tags)

## Code Pattern
```css
.editorial-column {
  max-width: 680px;
  margin: 0 auto;
  padding: 0 24px;
}
.editorial-breakout {
  width: 110%;
  margin-left: -5%;
}
.editorial-pullquote {
  border-left: 4px solid #C41E3A;
  padding-left: 24px;
  font-size: 1.25rem;
  font-style: italic;
  color: #C41E3A;
}
.editorial-dropcap::first-letter {
  float: left;
  font-size: 4.5rem;
  line-height: 0.8;
  padding-right: 8px;
  font-weight: 700;
  color: #C41E3A;
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
Alternating max-width columns are a pattern, not a trick — use them when content has genuine visual rhythm (image → text → quote → image). Mechanical alternation of every single element reads as template-think, not editorial judgment.
