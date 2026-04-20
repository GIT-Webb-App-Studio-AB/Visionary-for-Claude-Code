---
id: moodboard-collage
category: internet
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light]
keywords: [moodboard, collage, internet]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Moodboard Collage

**Category:** internet
**Motion tier:** Expressive

## Typography
- **Display font:** Multiple display fonts coexist — a bold grotesque (Bebas Neue or Black Han Sans) for one element, a condensed serif (Playfair Display Black) for another, a handwritten script (Caveat or Dancing Script) for a third; the clash references physical clippings from different sources
- **Body font:** Libre Franklin or DM Sans — deliberately neutral; the body text recedes so the collage elements dominate, as captions on a physical moodboard do
- **Tracking:** 0.05em (grotesque clippings), -0.02em (serif clippings), 0.02em (body) | **Leading:** 1.2 (display clippings), 1.6 (body captions)

## Colors
- **Background:** #1A1A1A (dark canvas — collage elements pop against gallery-wall darkness) or #FAFAFA (white mount board variant — both are valid; the background is support surface, not content)
- **Primary action:** Derived from dominant image in the collage — no fixed hex; the CTA color is eyedropped from the hero photograph or key image; this is non-negotiable
- **Accent:** #F5E642 (tape yellow — semi-transparent) used only for the physical tape metaphor element; not a brand color
- **Elevation model:** Realistic drop shadows — elements physically placed on a surface; box-shadow mimics paper weight: `2px 4px 8px rgba(0,0,0,0.25), 4px 8px 24px rgba(0,0,0,0.12)` (sharp near-shadow + diffused far-shadow = paper on board)

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 180, damping: 18, mass: 1.2 — slightly heavy, like a cardstock element finding its resting position
- **Enter animation:** Physical drop — elements fall into position from y: -30px to y: 0 with subtle rotation resolving to final angle (odd elements: -1.5deg, even: +2deg) over 420ms with cubic-bezier(0.22, 1.1, 0.36, 1); each element enters with a 60ms stagger so they land at slightly different times, like dropping clippings
- **Forbidden:** Perfectly aligned grid entrances (breaks the physical-placement illusion), scale-from-center (paper doesn't grow, it arrives), linear easing (no physical analog), simultaneous entry of all elements (they must stagger)

## Spacing
- **Base grid:** 8px (underlying structure) but elements are placed with absolute positioning and rotation, ignoring the grid; grid is the armature that collage overrides
- **Border-radius vocabulary:** 0px (photographs, printed clippings — physical prints are rectangular), 2px (slightly worn edges — paper corners curl slightly), 999px (label stickers only)

## Code Pattern
```css
/* The physical surface — dark canvas or white mount board */
.collage-container {
  position: relative;
  min-height: 600px;
  background: #1A1A1A;
  padding: 40px;
  overflow: hidden;
}

/* Each element is physically placed — absolute position + rotation */
.collage-element {
  position: absolute;
  /* Realistic paper drop shadow: near-sharp + far-diffused */
  box-shadow:
    2px 4px 8px rgba(0, 0, 0, 0.3),
    4px 8px 24px rgba(0, 0, 0, 0.15);
  border-radius: 0;
  max-width: 280px;
  overflow: hidden;
  /* Transition for interactive hover lift */
  transition: transform 300ms cubic-bezier(0.22, 1.1, 0.36, 1),
              box-shadow 300ms ease;
}

/* Alternating rotations — physical placement is never square */
.collage-element:nth-child(odd) {
  transform: rotate(-1.5deg);
}

.collage-element:nth-child(even) {
  transform: rotate(2deg);
}

/* Hover: element lifts slightly from the surface */
.collage-element:hover {
  transform: rotate(0deg) translateY(-4px) scale(1.02);
  box-shadow:
    4px 8px 20px rgba(0, 0, 0, 0.4),
    8px 16px 48px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

/* Physical tape metaphor — translucent yellow rectangle */
.tape {
  position: absolute;
  width: 48px;
  height: 16px;
  background: rgba(245, 230, 66, 0.55);
  border-radius: 1px;
  /* Tape is slightly rotated to feel hand-applied */
  transform: rotate(-2deg);
  /* Tape sits on top of element, so z-index above parent */
  z-index: 5;
}

/* Top-center tape placement — most common physical position */
.tape--top {
  top: -8px;
  left: 50%;
  margin-left: -24px;
}

/* Drop-in entrance animation */
@keyframes collage-drop {
  from {
    opacity: 0;
    transform: rotate(var(--final-rotation, -1.5deg)) translateY(-30px);
  }
  to {
    opacity: 1;
    transform: rotate(var(--final-rotation, -1.5deg)) translateY(0);
  }
}

/* Elements enter with stagger — each has a CSS custom property for its delay */
.collage-element[data-animate] {
  animation: collage-drop 420ms cubic-bezier(0.22, 1.1, 0.36, 1) both;
  animation-delay: calc(var(--collage-index, 0) * 60ms);
}

/* Image fills element — photographic not digital */
.collage-element img {
  display: block;
  width: 100%;
  height: auto;
  /* Slight desaturation mimics printed photograph aging */
  filter: saturate(0.9) contrast(1.05);
}

/* Caption label — small, neutral, recedes from collage */
.collage-caption {
  font-family: 'DM Sans', 'Libre Franklin', system-ui, sans-serif;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #CCCCCC;
  padding: 8px 12px;
  background: rgba(26, 26, 26, 0.85);
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
- **Perfectly aligned or square-to-grid elements:** If all elements are axis-aligned and grid-placed, the result is a masonry layout — a grid with images — not a collage. The 1-3 degree rotation on every element is not decorative flourish; it is the load-bearing structural property that distinguishes physical arrangement from digital layout. Remove the rotation and you have Pinterest, not a moodboard.
- **Digital-looking icons or vector illustrations substituting for photographic/print references:** Physical moodboards are assembled from printed matter — magazine clippings, Polaroids, printed swatches, hand-lettered elements. Digital SVG icons, flat-color illustrations, and system UI iconography read as digital artifacts placed on a surface, not physical objects. The collage illusion requires photographic imagery, textured surfaces, and print-referencing content — the source material must look like it was cut from something real.
