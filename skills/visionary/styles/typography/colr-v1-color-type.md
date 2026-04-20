---
id: colr-v1-color-type
category: typography
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [light, pastel, neon, editorial]
keywords: [colr-v1, color-fonts, variable-font, multi-color, opentype, font-palette]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# COLR v1 Color Type

**Category:** typography
**Motion tier:** Expressive

A design system built around **COLR v1** color fonts — OpenType fonts that
ship multi-color glyphs with variable-font axes, plus `font-palette` CSS for
runtime recoloring. All browsers shipped support in 2023; by 2026 this is a
first-class typography surface, not a novelty. References: Google Fonts
*Bungee Spice*, *Rocher*, *Nabla*, Mozilla *Gingham*, *Foldit*, Underware's
*Plex Mono Color*.

This style makes the display type THE brand system — palette swap runtime,
variable axes animate, no SVG/PNG glyphs needed.

## Typography

- **Display font:** one of: **Nabla** (variable + color, free), **Rocher**
  (color + gradient), **Bungee Spice** (chromatic), **Foldit** (variable +
  color). All ship with multiple palettes
- **Body font:** Inter or Atkinson Hyperlegible — neutral so the colored
  display carries the voice
- **Feature:** CSS `font-palette` on display headings — swap palette without
  reloading the font

## Colors

- **Background:** `#F8F6F0` (warm neutral that lets the color font breathe)
- **Primary text:** `#1A1A1A`
- **Display font palettes:** use `@font-palette-values` to define named
  palettes per mood:
  - `--fp-sunrise`: warm oranges, coral, cream
  - `--fp-ocean`: teals, deep blue, foam white
  - `--fp-forest`: greens, bark brown, moss
  - `--fp-grape`: purples, pink, lilac
- **Runtime palette swap** via JS/CSS variable reassignment — no font reload

## Motion

- **Tier:** Expressive
- **Spring tokens:** `{ bounce: 0.15, visualDuration: 0.4 }`
- **Palette-swap animation:** `font-palette` transitions are not yet animable
  in CSS, but opacity-cross-fade two copies of the headline (each with a
  different `font-palette`) produces the illusion of a smooth palette morph
- **Variable-axis sweep:** for Nabla/Foldit, animate
  `font-variation-settings` on hover — `wght` or custom axes
- **Forbidden:** overusing palette swaps — 1–2 per page max, else novelty-fatigue

## Spacing

- **Base grid:** 8 px
- **Border-radius:** 0 on display-type containers, 8–12 px elsewhere
- **Density:** sparse — color fonts need room

## Code Pattern

```css
/* 1. Load a COLR v1 font */
@font-face {
  font-family: 'Nabla';
  src: url('https://fonts.gstatic.com/s/nabla/v20/j8_D6-LI0Lvpe7Makw5sAg.woff2') format('woff2-variations');
  font-weight: 1 1000;
  font-display: swap;
}

/* 2. Define named palettes */
@font-palette-values --fp-sunrise {
  font-family: 'Nabla';
  base-palette: 0;
  override-colors:
    0 #FF6B35,   /* layer 0 — warm orange */
    1 #F5A524,   /* layer 1 — gold */
    2 #FFE8B0;   /* layer 2 — cream */
}
@font-palette-values --fp-ocean {
  font-family: 'Nabla';
  base-palette: 0;
  override-colors: 0 #0077B6, 1 #48CAE4, 2 #CAF0F8;
}
@font-palette-values --fp-grape {
  font-family: 'Nabla';
  base-palette: 0;
  override-colors: 0 #6B2D8E, 1 #BC4B51, 2 #F5D5F0;
}

/* 3. Apply */
.colr-headline {
  font-family: 'Nabla', system-ui, sans-serif;
  font-size: clamp(4rem, 10vw, 10rem);
  font-variation-settings: "EDPT" 100, "EHLT" 12;
  font-palette: --fp-sunrise;
  line-height: 1;
  transition: font-variation-settings 400ms cubic-bezier(0.16, 1, 0.3, 1);
}
.colr-headline[data-palette="ocean"]  { font-palette: --fp-ocean; }
.colr-headline[data-palette="grape"]  { font-palette: --fp-grape; }

.colr-headline:hover {
  font-variation-settings: "EDPT" 200, "EHLT" 20;
}

@media (prefers-reduced-motion: reduce) {
  .colr-headline { transition: none; }
}
```

## Accessibility

### Contrast
COLR v1 glyphs have multiple color layers — every layer against the
background must meet 4.5:1 for body-size use, 3:1 for display ≥ 24 px. The
`base-palette` should be checked first (the default palette for fallback
browsers).

### Focus
Standard 3 px `AccentColor` outline on the element containing the color
font. Never rely on color-font color alone to indicate focus.

### Motion
`font-variation-settings` animations are compositor-cheap and don't
trigger layout. Reduced-motion freezes the axis at its resting value.

### Touch target
44×44 default for any interactive element using color-font display.

### RTL / Logical properties
Fully logical. COLR v1 works with any writing system that has glyph
coverage in the chosen font (Nabla: Latin + Latin-ext; substitute with
per-language equivalents for CJK / Arabic / Hebrew).

## Slop Watch

- Color font used for body text = accessibility risk; display-only
- Static glyph (no axis animation, no palette swap) = wastes the format;
  use a regular webfont
- 4+ palettes per view = visual noise; cap at 2–3
- Animating `font-palette` with a CSS transition directly = unsupported;
  use the opacity cross-fade pattern
- "Nabla everywhere" = display fatigue; one hero per view maximum
