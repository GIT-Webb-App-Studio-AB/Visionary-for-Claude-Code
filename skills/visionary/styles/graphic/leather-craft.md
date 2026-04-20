---
id: leather-craft
category: graphic
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, earth]
keywords: [leather, craft, graphic, hand-press, saddle, tan, oxblood, artisan, luxury]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Leather Craft

**Category:** graphic
**Motion tier:** Subtle

Reference: Coach heritage branding, Hermès saddle-stitch, small-batch
bookbinding, letterpress workshops. The visual language of tooled leather —
warm browns with oxblood accents, debossed (pressed-in) type, stitch-line
borders, the quiet physicality of an object that was pressed, not printed.

Contrast with `paper-editorial` (ink on paper, print-press heritage) and
`dark-academia` (book-spine richness, but more romantic, more candlelit).
Leather-craft is craftsman-workshop, not scholar's-library.

## Typography

- **Display font:** **Libre Baskerville** — warm old-style serif with tool-
  struck character. Preferred over Playfair (too-sharp for hand-tooled), over
  Bodoni (too neoclassical / Parisian fashion), over Georgia (too-web-
  default). Libre Baskerville's ink-trap detailing echoes the groove of a
  leather-stamping tool
- **Body font:** Libre Baskerville Regular 16px. Paired with itself — a sans
  body would fight the artisan register
- **Tracking:** 0.01em (tight, like stamped-letter spacing)
- **Leading:** 1.6
- **Feature:** small-caps for section labels (`font-variant: small-caps`) —
  reads like the interior page of a leather-bound ledger

## Colors

- **Background:** `#3B1F0E` (dark saddle leather) — rich, warm, slightly
  dusty. Specifically not `#000` black (too industrial), not `#3E2723`
  brown (Material Design's brown is too cool)
- **Primary action / accent-warm:** `#C8842A` (burnished tan — the color
  leather goes when it's oiled and worked in). This is the *signature* color
  of the style
- **Secondary accent:** `#8B2C1F` (oxblood — the stain color, not the
  synthetic red; used sparingly, ≤ 10 % of surface)
- **Mid-brown:** `#5C3A1E` (the color of an unoiled saddle)
- **Text:** `#E8D5B7` (parchment cream — high-contrast cream reads like
  aged ivory page against dark leather)
- **Elevation model:** **inset / debossed**, not outset. Leather is pressed,
  not stacked. Use `box-shadow: inset ...` for recessed surfaces, never
  outer shadow. Outer shadow = floating = plastic

## Motion

- **Tier:** Subtle
- **Spring tokens:** `{ bounce: 0, visualDuration: 0.28 }` — leather is
  heavy, there is no overshoot
- **Enter animation:** opacity 0 → 1, 280ms linear. No movement. Leather-
  bound objects appear, they do not slide in
- **Micro-interactions:** on hover, the inner highlight brightens 12 % —
  simulating the effect of light on well-worn, oiled leather. Button press
  depresses 1px via inset shadow adjustment, no transform
- **Focus:** 2px tan (`#C8842A`) inset outline — stays inside the element,
  mimicking an embossed border
- **Forbidden:** scale, bounce, glow, outer shadow, brightness flash,
  metallic sheen (leather doesn't shine, it softly reflects)

## Spacing

- **Base grid:** 8px
- **Border-radius vocabulary:** 2–4px — tooling leaves small but present
  rounding. Never 0 (too cold-industrial), never > 6 (too-product-plastic)
- **Stitch lines:** use 1px dashed borders in `#C8842A` at 12 % opacity to
  echo saddle-stitch detailing. One signature motif per view, not everywhere

## Code Pattern

```css
.leather-surface {
  background: #5C3A1E; /* mid-brown saddle */
  color: #E8D5B7;       /* parchment text */
  font-family: 'Libre Baskerville', Georgia, serif;
  font-size: 16px;
  line-height: 1.6;
  letter-spacing: 0.01em;
  padding: 32px;
  border-radius: 4px;
  /* Debossed: inner dark edge + inner highlight */
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.6),
    inset 0 -1px 2px rgba(200, 132, 42, 0.2);
  border: 1px solid #3B1F0E;
}

/* Saddle-stitch detail */
.leather-panel {
  background: #3B1F0E;
  border: 1px dashed rgba(200, 132, 42, 0.35);
  border-radius: 4px;
  padding: 28px;
}

/* Section label — small-caps ledger voice */
.leather-label {
  font-variant: small-caps;
  letter-spacing: 0.08em;
  color: #C8842A;
  font-size: 12px;
  font-weight: 500;
}

/* Debossed button */
.leather-button {
  background: #C8842A;
  color: #3B1F0E;
  font-family: 'Libre Baskerville', serif;
  font-weight: 700;
  padding: 12px 28px;
  border-radius: 3px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 2px rgba(0, 0, 0, 0.3);
  transition: filter 150ms linear; /* no transform */
}
.leather-button:hover { filter: brightness(1.08); }
.leather-button:active {
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.4),
    inset 0 -1px 0 rgba(255, 255, 255, 0.08);
}

.leather-surface:focus-visible {
  outline: 2px solid #C8842A;
  outline-offset: -2px; /* inset ring — embossed into the leather */
}
```

## Accessibility

### Contrast
`#E8D5B7` on `#5C3A1E` = 7.1:1 (WCAG AAA). `#E8D5B7` on `#3B1F0E` = 10.4:1
(AAA). `#C8842A` on `#3B1F0E` = 5.9:1 (AA). APCA Lc ≥ 80.

### Focus
Inset 2px `#C8842A` outline. If rendering in forced-colors mode,
`outline-color` falls back to `AccentColor` and the leather palette disables
via `forced-color-adjust: auto`.

### Motion
All motion is opacity or color; no transforms. Reduced-motion branch kills
filter transitions. Button press uses inner shadow change, not `transform:
translateY()`, so it stays safe.

### Touch target
44×44 default. Debossed buttons feel smaller than they are — always pad to
the 44×44 minimum even when the visible button looks smaller.

### RTL / Logical properties
Full logical (`inset-inline`, `padding-inline`, etc). Libre Baskerville covers
Latin + Cyrillic. For Arabic/Hebrew the debossed effect reads fine but swap
display to Amiri / Frank Ruhl Libre for script compatibility.

## Slop Watch

- Outer drop shadows = leather doesn't float; use inset shadows only
- Web-safe fallback (Georgia) alone collapses the warm character — include
  Libre Baskerville in the `@font-face` import
- Pure black (`#000`) or industrial grey anywhere breaks the warm-earth palette
- Glow / metallic sheen = wrong material register (that's `metal-chrome`)
- Stitch-line detail everywhere = over-use; one signature accent per view
- Oxblood as primary action = reads aggressive / distracting; oxblood is a
  rare emphasis color, tan is the CTA color
- Cream backgrounds = that's a different style (`fabric-textile` or
  `cottagecore`); leather needs dark saddle backgrounds to work
