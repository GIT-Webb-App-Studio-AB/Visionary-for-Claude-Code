---
id: swiss-muller-brockmann
category: historical
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [light, editorial]
keywords: [swiss, muller-brockmann, pedagogical, concert-poster, zurich, grid-systems]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Swiss Müller-Brockmann (Pedagogical)

**Category:** historical
**Motion tier:** Subtle

Josef Müller-Brockmann's *Grid Systems in Graphic Design* (1981), the
Tonhalle Zürich concert-poster series, his Olivetti work. Differs from
`swiss-gerstner` (parametric, catalog-ready) by being **expressive within
constraint** — Müller-Brockmann used the same grid as Gerstner but allowed
a visual gesture to dominate. The concert posters are the reference: pure
geometric form at massive scale, supported by the grid.

Use when: a hero element wants to carry the page, but the rest should stay
Swiss-disciplined. Concert/event posters, book covers, single-landing-page
product reveals.

## Typography

- **Display font:** **Helvetica** (Müller-Brockmann was a Helvetica partisan
  early) — 9xl size, tight tracking. OR set the headline as a pure
  geometric form (black circle, diagonal bar) and skip display type entirely
- **Body font:** Helvetica Regular 15 px
- **Tracking:** display -0.03em; body 0
- **Feature:** asymmetric layout — body text anchored to left gutter,
  hero form occupying 60–70 % of the canvas

## Colors

- **Background:** `#FFFFFF` (pure — concert posters are pure white)
- **Primary text:** `#000000` (pure)
- **Hero form:** one saturated color — `#D71920` (Tonhalle red), `#FFD400`
  (Olivetti yellow), or `#0033A0` (deep blue). ONE per poster
- **No gradients, no tints, no secondary accents**. The gesture is the
  design

## Motion

- **Tier:** Subtle
- **Spring tokens:** `{ bounce: 0, visualDuration: 0.3 }`
- **Enter animation:** the hero form enters via scale 0 → 1 with
  `cubic-bezier(0.16, 1, 0.3, 1)` over 600 ms — the geometric reveal is
  the only motion allowed
- **Micro-interactions:** body text has zero motion; hero form has zero
  motion after entry. This is a poster, not a webpage

## Spacing

- **Base grid:** 6-column grid, 32 px gutter (Müller-Brockmann's preferred
  poster proportion)
- **Border-radius:** 0 px or 999 px (perfect geometric forms only)
- **Hero scale:** the hero element occupies 3–4 columns and 60%+ of the
  vertical space; body columns sit in the remaining space

## Code Pattern

```css
.mb-canvas {
  background: #FFFFFF;
  color: #000;
  font-family: 'Helvetica Neue', Helvetica, sans-serif;
  font-size: 15px;
  line-height: 1.4;
  padding: 64px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 32px;
  min-block-size: 100dvh;
}

.mb-hero {
  grid-column: span 4;
  background: #D71920;
  aspect-ratio: 1 / 1;
  border-radius: 999px; /* perfect circle — the Tonhalle gesture */
  animation: reveal 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes reveal {
  from { scale: 0; }
  to   { scale: 1; }
}

.mb-headline {
  grid-column: span 4;
  font-size: clamp(3rem, 8vw, 9rem);
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: -0.03em;
  margin: 0;
}

.mb-body {
  grid-column: span 2;
  font-size: 15px;
  line-height: 1.5;
}

@media (prefers-reduced-motion: reduce) {
  .mb-hero { animation: none; }
}
```

## Accessibility

### Contrast
Pure black on pure white = 21:1 (AAA max). Hero form colors must hold 4.5:1
against white when used behind text (rare in this style — hero is usually
separate from text).

### Focus
2 px black outline with 4 px offset — minimal but visible on pure white.

### Motion
Scale-reveal is the signature but MUST be reduced-motion-gated. Under
reduce, the hero appears at final scale immediately.

### Touch target
44×44 default.

### RTL / Logical properties
Full logical. The asymmetric layout flips naturally — hero form moves to
the right, body text anchors to the right gutter in RTL.

## Slop Watch

- Multi-color palette = violates the one-gesture premise
- Non-geometric hero forms (irregular shapes) = breaks the Müller-Brockmann
  vocabulary
- Centered layout = wrong; Swiss asymmetry is load-bearing
- Typography scale > 3 steps = visual noise
- Serif fonts = wrong era/voice
- Hero form + multiple text hierarchies = overdesigned; the gesture
  carries the page
