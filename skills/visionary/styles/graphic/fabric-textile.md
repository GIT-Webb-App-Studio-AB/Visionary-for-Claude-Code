---
id: fabric-textile
category: graphic
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [earth, editorial]
keywords: [fabric, textile, graphic, weave, linen, natural-fibers, tactile]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Fabric Textile

**Category:** graphic
**Motion tier:** Subtle

A style built around the *feel* of natural-fiber fabric — not a photograph of
cloth, but the visual rhythm of a plain-weave grid, the warm off-white of
unbleached linen, the quiet irregularity of a hand-loom. References:
Muji retail design system, Everlane product pages, Aesop packaging, Scandinavian
textile designers (Marimekko's quieter work, not the pattern-heavy range).

The *wrong* direction would be paisley, brocade, or ornamental pattern — those
belong in `south-asian-bollywood`, `latin-fiesta`, or `art-nouveau`. This style
is about the grid of the weave itself, and the way fabric absorbs light rather
than reflecting it.

## Typography

- **Display font:** **Lora** — transitional serif with a calligraphic rhythm
  that echoes weaving tension; chosen over Playfair because Playfair's high
  stroke contrast reads as editorial-cold, whereas Lora's gentler contrast
  reads as warm-hand. Over Source Serif because Source's rigidity fights the
  fabric softness
- **Body font:** Lora Regular at 17px. Paired with itself — a sans-serif body
  fights the textile register
- **Tracking:** +0.005em (very slight — fabric rests naturally)
- **Leading:** 1.7 (generous; the eye moves like thread across cloth)
- **Feature:** italic for quotes and captions. Lora's italic is tension-warm;
  Georgia's italic is mechanical

## Colors

- **Background:** `#F2EBE0` (unbleached linen) — specifically avoid pure
  `#FFFFFF` which reads as bleached-cotton-sheet and breaks the natural-fiber
  register; `#F2EBE0` is the warm-neutral that fabric photography almost always
  uses as its studio backdrop
- **Primary text:** `#3A2F22` (walnut-stain brown, not black — pure black is
  non-fabric; most dye-on-cloth blacks are dark umbers)
- **Primary action:** `#7A5C44` (woven umber — takes the natural-fiber palette
  onto interactive elements)
- **Accent:** `#C4956A` (natural-dye terracotta — the color that madder root
  or henna produces; never pure `#FF4500` orange which reads synthetic)
- **Elevation model:** texture, not shadow. The background carries an SVG
  weave pattern at 6–8 % opacity. Cards are defined by slight color shift +
  hairline, not by drop shadow (fabric doesn't levitate)

## Motion

- **Tier:** Subtle
- **Spring tokens:** `{ bounce: 0, visualDuration: 0.3 }` — fabric settles; it
  does not spring
- **Enter animation:** opacity 0 → 1 over 280ms cubic-bezier(0.16, 1, 0.3, 1)
  with a **3px upward translate**. The 3px (not 8px) is deliberate: fabric
  drapes, it does not lift
- **Micro-interactions:** on hover, background shifts from `#F2EBE0` to
  `#F5EFE5` (2 % lighter). No scale, no translate. The shift is almost
  subliminal — the fabric warms under the cursor like a hand on cloth
- **Card press:** 50ms darken-and-hold — simulates the dimple of finger-
  pressure on a fabric surface
- **Forbidden:** scale, bounce spring, brightness flash, metallic sheen,
  anything glossy

## Spacing

- **Base grid:** 8px, but the typographic rhythm dominates. Leave space
  between elements the way thread leaves space between weft lines
- **Border-radius vocabulary:** 4–8px. No 12–24px "modern product" radii —
  fabric doesn't have rounded plastic edges
- **Negative space:** generous. Textile photography breathes because you see
  the weave; crowded UI loses the fabric character

## Code Pattern

```css
.fabric-surface {
  /* Warm unbleached linen — not pure white */
  background-color: #F2EBE0;

  /* Subtle plain-weave SVG at 6% — the signature */
  background-image: url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h2v2H0zm2 2h2v2H2z' fill='%23C4956A' fill-opacity='0.06'/%3E%3C/svg%3E");

  color: #3A2F22;
  font-family: 'Lora', Georgia, serif;
  font-size: 17px;
  line-height: 1.7;
  letter-spacing: 0.005em;
  padding: 40px;
}

.fabric-card {
  /* Defined by color shift + hairline, not shadow */
  background: #F6F0E6;
  border: 1px solid rgba(122, 92, 68, 0.12);
  border-radius: 6px;
  padding: 32px;
  transition: background 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
.fabric-card:hover {
  background: #F8F3EB; /* ~2% warmer */
}

.fabric-button {
  background: #7A5C44;
  color: #F2EBE0;
  padding: 12px 24px;
  border-radius: 6px;
  font-family: 'Lora', serif;
  font-weight: 500;
  letter-spacing: 0.01em;
  transition: background 120ms linear;
}
.fabric-button:hover { background: #5C4530; }

@media (prefers-reduced-motion: reduce) {
  .fabric-card,
  .fabric-button { transition: none; }
}
```

## Accessibility

### Contrast
`#3A2F22` on `#F2EBE0` = 9.2:1 (WCAG AAA). `#7A5C44` on `#F2EBE0` = 4.8:1
(AA; pair with `#F2EBE0` text for body-size use). APCA Lc ≥ 80 on body.

### Focus
2px `AccentColor` outline with 3px offset. Refrain from any sheen/glow effect
on focus — fabric is matte, period.

### Motion
Hover background shift is safe under reduced-motion (color, not transform).
Enter animation's 3px translate is gated on `prefers-reduced-motion: no-preference`
and degrades to opacity-only.

### Touch target
44×44 default. Lora's optical sizing makes 14 px feel small — bump to 16 px
minimum for UI labels to preserve legibility.

### RTL / Logical properties
Full logical properties (`margin-inline`, `padding-inline`). The SVG weave
pattern is symmetrical and renders identically in RTL; Lora covers Latin +
Cyrillic. For Arabic, substitute Amiri; for Hebrew, Frank Ruhl Libre.

## Slop Watch

- Heavy SVG pattern (opacity ≥ 0.15) competes with content — keep at ≤ 0.08
- Playfair Display as display font collapses the warmth Lora provides
- Pure white background (`#FFFFFF`) breaks the natural-fiber register; always use
  a warm off-white in the #F0–F5 range
- Drop shadows on cards = fabric doesn't levitate; use hairlines only
- Saturated accent colors (oklch chroma > 0.18) = synthetic dye, breaks
  natural-fiber tone; keep accents in the naturally-dyed palette (ochres,
  madders, indigos, walnut hulls)
- "Fabric" icons from stock sets (a stitched heart, a needle + thread) =
  decorative cliché; the weave pattern IS the fabric reference
