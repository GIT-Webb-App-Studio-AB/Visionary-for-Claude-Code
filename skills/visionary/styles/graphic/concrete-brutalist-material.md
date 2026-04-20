---
id: concrete-brutalist-material
category: graphic
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [light, earth]
keywords: [concrete, brutalist, material, beton-brut, corbusier, aggregate, formwork, mass-timber]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Concrete Brutalist Material

**Category:** graphic
**Motion tier:** Subtle

Not to be confused with `architectural-brutalism` (the typography-heavy
propaganda-poster register) or `brutalist-web` (the 2015–2019 "unstyled HTML"
anti-aesthetic). This style is about **concrete as material** — cast-in-place
surfaces, exposed aggregate, board-formed texture, the color of raw béton
brut. References: Le Corbusier's Unité d'Habitation, Peter Zumthor's Therme
Vals, Tadao Ando's churches, Paul Rudolph's Yale Art and Architecture
Building, Barbican Estate.

**Why this variant exists:** the other two brutalists are *ideological*
(heavy type, anti-aesthetic rhetoric). This one is *material* — quiet,
textural, closer in spirit to concrete-poetry book covers than to propaganda
posters. The test: can the surface still feel like concrete even if the
content is gentle (wellness copy, a recipe, a resume)? If yes, this style
fits; if not, you want one of the others.

## Typography

- **Display font:** **Space Grotesk Bold** — industrial geometric with enough
  ink-trap detail to echo formwork seams. Preferred over Inter (too-tech) and
  over Helvetica (too-neutral; Helvetica is for `swiss-rationalism`). Over
  Archivo because Archivo's condensed feel fights the slab-mass character
- **Body font:** Space Grotesk Regular 16 px. Monospaced for data/metrics
  only (IBM Plex Mono) — the monospace reads as construction-drawing
  annotation and lands correctly in this material context
- **Tracking:** +0.02em (wide like stenciled cement-bag markings)
- **Leading:** 1.4 on body (tight — concrete is heavy, type reads dense)
- **Feature:** uppercase for section labels (stencils are uppercase); never
  italic (concrete has no italic — it has scored lines instead)

## Colors

- **Background:** `#C8C8C8` (wet-cured concrete grey). Alternative `#A8A6A1`
  for aged cast concrete. Never pure `#CCCCCC` web-grey (reads digital,
  wrong register) and never cold blue-grey `#BFC3C7` (that's `clinical-cold`)
- **Primary action / text:** `#1C1C1C` (formwork black — the color of
  plywood-form shadow residue after the forms are stripped). Not pure
  `#000000` — pure black reads industrial-paint, not cast-concrete
- **Accent:** `#6B7280` (aggregate grey — the sparkle of exposed stone in
  cast concrete). NOT yellow or red — that's construction-signage, wrong
  register
- **Board-form detail:** thin (1–2 px) horizontal lines in `#9A9A9A` spaced
  at 32–48 px intervals to simulate board-form seams (the wood-grain
  imprint left behind when cast against plywood formwork)
- **Elevation model:** **no shadows whatsoever**. Depth comes from:
  (a) offset outlines where one panel meets another
  (b) hairline grooves (1 px `inset` borders) simulating expansion joints
  (c) color-shift hierarchy — lighter surfaces read forward, darker back

## Motion

- **Tier:** Subtle
- **Spring tokens:** `{ bounce: 0, visualDuration: 0.15 }` — concrete does
  not spring. Concrete cures and cracks, it does not bounce
- **Enter animation:** opacity 0 → 1 + translate-Y 4 → 0 px over 120 ms
  **linear**. The linearity is load-bearing — eased curves imply
  acceleration, concrete moves without acceleration (it is moved)
- **Micro-interactions:** on hover, background darkens 4 % (the color of
  concrete when water hits it). No scale, no lift, no glow. On press, the
  element's inset outline darkens from `#9A9A9A` to `#6B7280` (the seam
  becomes more visible under force — the physical metaphor of stressed
  concrete)
- **Forbidden:** any spring, any bounce, colored shadow, glow, soft easing,
  border-radius > 0, border-radius transitions

## Spacing

- **Base grid:** 8 px
- **Border-radius vocabulary:** **0 px everywhere, ideological**. Even a
  single pixel of radius reads as plastic/rubber extrusion, not cast
  concrete. The one exception: images can have `border-radius: 0` with
  `clip-path` cut corners (at 45° angles) to echo chamfered precast panels
- **Panel joints:** 32–48 px grid. Big panels, few of them. Small panels
  within a big grid read as cladding, wrong register

## Code Pattern

```css
.concrete-surface {
  background: #C8C8C8;
  color: #1C1C1C;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.02em;
  padding: 32px;
  border-radius: 0; /* ideological */

  /* Board-form seams — the signature texture */
  background-image: repeating-linear-gradient(
    0deg,
    transparent 0, transparent 32px,
    rgba(0, 0, 0, 0.06) 32px, rgba(0, 0, 0, 0.06) 33px
  );
}

/* Expansion-joint panel */
.concrete-panel {
  background: #A8A6A1;
  border: 1px solid #1C1C1C;
  outline: 1px solid #9A9A9A;
  outline-offset: -4px; /* inset seam */
  padding: 24px;
  /* Hard offset, no blur — this is not a card that floats */
  box-shadow: 6px 6px 0 #1C1C1C;
}

/* Stenciled section label */
.concrete-label {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
  font-weight: 700;
  color: #1C1C1C;
}

/* Construction-drawing annotation */
.concrete-annotation {
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 13px;
  color: #6B7280;
  letter-spacing: 0;
}

/* Hover: the "water on concrete" shift */
.concrete-panel:hover {
  background: #A09E99;
  transition: background 200ms linear; /* linear, not eased */
}

.concrete-panel:focus-visible {
  outline: 2px solid #1C1C1C;
  outline-offset: -2px; /* inset ring — stays in the material */
}

@media (prefers-reduced-motion: reduce) {
  .concrete-panel { transition: none; }
}
```

## Accessibility

### Contrast
`#1C1C1C` on `#C8C8C8` = 12.3:1 (WCAG AAA). `#6B7280` on `#C8C8C8` = 3.4:1
(AA large-text only — use for ≥ 18 px or ≥ 14 px bold). APCA Lc ≥ 85 on body.

### Focus
2 px `#1C1C1C` outline inset into the panel (`outline-offset: -2px`). Stays
within the material — an outer glow would float. Falls back to `AccentColor`
in forced-colors mode.

### Motion
Hover darken is 200ms linear — no transform, no vestibular trigger. The
linear curve and ≤ 4 px translate-Y on entry are both safe, but still gated
on `prefers-reduced-motion: no-preference`.

### Touch target
44×44 default. The hard 0-radius geometry makes small targets feel smaller
than they are — don't reduce below 44 even when the visible element looks
smaller.

### RTL / Logical properties
Full logical (`margin-inline`, `padding-inline`, `border-inline-start`,
`outline-offset`). The board-form seam texture is horizontal and reads
identically in RTL. Space Grotesk covers Latin + Cyrillic + Vietnamese;
substitute a concrete-weighted Arabic display face (e.g. Readex Pro Black)
for Arabic/Hebrew locales.

## Slop Watch

- Any `border-radius` above 0 = immediate fail; concrete does not round
- Drop shadows = fail; concrete does not float
- Cold blue-greys = reads as data-visualization or clinical, not material
- Playful colored accents (red CTA, green check) = construction-site signage
  aesthetic, which is `architectural-brutalism`, not this style
- "Poppy" Space Grotesk Light instead of Bold = too-delicate; always Bold
  500+ weight
- Concrete-*texture-photography* as backdrop = literal, wrong register. The
  CSS board-form seams ARE the concrete reference
- Mixing with neon glow or gradients = two-style-mashup, wrong register (see
  `recombinant-hybrid` if that's the intent)
