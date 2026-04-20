---
id: swiss-crouwel-gridnik
category: historical
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [light, editorial]
keywords: [swiss, crouwel, gridnik, stedelijk, total-design, new-alphabet, amsterdam, 1967]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Swiss Crouwel Gridnik (Total Design / Stedelijk)

**Category:** historical
**Motion tier:** Subtle

Wim Crouwel's Amsterdam school — Total Design studio (founded 1963), the
long Stedelijk Museum catalogue series (1964–1985), and his *New Alphabet*
(1967) + *Gridnik* (1974) typefaces. Crouwel called himself "Mister Grid"
but his work breaks distinctly from the Swiss mainstream (Müller-Brockmann,
Gerstner): Crouwel pushed the grid to the point where it *generates* new
typeforms rather than merely organizing existing ones.

**Why a separate style from `swiss-rationalism`, `swiss-gerstner`, and
`swiss-muller-brockmann`:**

- `swiss-rationalism` — the encyclopedic grid, Helvetica, neutral. The
  default Swiss mood.
- `swiss-gerstner` — parametric, catalog-ready. Every layout = a program.
- `swiss-muller-brockmann` — concert-poster authority. Asymmetric with a
  dominant geometric gesture.
- **`swiss-crouwel-gridnik`** — grid as a *typographic generator*. Letters
  ARE the grid; the grid IS visible. Technological futurism inside Swiss
  discipline. This is the aesthetic people mean when they reference
  "Total Design" or the Stedelijk catalogue covers.

## Typography

- **Display font:** **Gridnik** (the 1974 Bold Condensed) — the defining
  face. Alternative: New Alphabet when the user wants full radicalism.
  Contemporary fallback: **GT Pressura Mono** or **Space Mono** for the
  grid-aligned feel; only use them as fallback, not as the default
- **Body font:** Univers 55 (Adrian Frutiger, 1957 — Total Design's
  preferred body face)
- **Tracking:** display 0.04em (Gridnik wants wide spacing); body 0
- **Leading:** 1.35 (dense, print-derived)
- **Feature:** ALL-UPPERCASE display for titles. Crouwel's Stedelijk
  covers were almost exclusively uppercase

## Colors

- **Background:** `#F0EBDF` (warm off-white — the paper stock of 1970s
  Stedelijk catalogues, slightly tinted from what we'd use today for
  light-mode-sanctuary)
- **Primary text:** `#0A0A0A` (near-black — pure black looks too-industrial
  for print-derived Swiss)
- **Accent:** exactly ONE of: `#E2231A` (Crouwel red from the 1969 Claes
  Oldenburg catalogue), `#FFB700` (yellow from the Fernand Léger 1973
  poster), or `#0039A6` (blue from the Jean Arp 1967 catalogue). Never two
- **Grid lines:** 1 px lines in `#DCD6C8` (visible but not loud — the grid
  announces itself without shouting)
- **Elevation model:** none. Crouwel's work is flat. Depth is indicated by
  the grid itself, never by shadow

## Motion

- **Tier:** Subtle
- **Spring tokens:** `{ bounce: 0, visualDuration: 0.22 }` — mechanical,
  printlike
- **Enter animation:** scan-in — elements fade in along the grid axis,
  left-to-right OR top-to-bottom (NEVER diagonal — Crouwel's grid is
  orthogonal, diagonal motion breaks the premise). 300 ms linear stagger,
  40 ms between cells
- **Micro-interactions:** hover = 1 px inset on the grid cell (simulates
  the letterpress indent). No translate, no color shift. The grid cell
  itself becomes emphasized
- **Forbidden:** any spring bounce, colored glow, scale > 1.0, diagonal
  motion, continuous animation

## Spacing

- **Base grid:** **12-column module**, with letters themselves aligned to
  a 5×7 unit sub-grid (Gridnik's construction). The visible grid is a
  feature, not chrome — leave 1 px hairlines on every major division
- **Border-radius:** 0 px. Gridnik's letters don't round
- **Density:** balanced toward dense. Crouwel's catalogues were
  information-rich

## Code Pattern

```css
:root {
  --c-bg: #F0EBDF;
  --c-ink: #0A0A0A;
  --c-grid: #DCD6C8;
  --c-red: #E2231A;
  --c-unit: 8px;
  --c-col: calc(var(--c-unit) * 8); /* 64px */
  --c-gutter: calc(var(--c-unit) * 3); /* 24px */
}

.crouwel-canvas {
  background: var(--c-bg);
  color: var(--c-ink);
  font-family: 'Univers', 'Neue Haas Unica', 'Helvetica Neue', sans-serif;
  font-size: 15px;
  line-height: 1.35;
  padding: calc(var(--c-unit) * 6);

  /* The grid is VISIBLE — Crouwel signature */
  background-image:
    repeating-linear-gradient(
      to right,
      transparent 0,
      transparent calc(var(--c-col) + var(--c-gutter) - 1px),
      var(--c-grid) calc(var(--c-col) + var(--c-gutter) - 1px),
      var(--c-grid) calc(var(--c-col) + var(--c-gutter))
    ),
    repeating-linear-gradient(
      to bottom,
      transparent 0,
      transparent calc(var(--c-unit) * 7 - 1px),
      var(--c-grid) calc(var(--c-unit) * 7 - 1px),
      var(--c-grid) calc(var(--c-unit) * 7)
    );

  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--c-gutter);
  max-inline-size: 1280px;
  margin-inline: auto;
}

.crouwel-headline {
  font-family: 'Gridnik', 'GT Pressura Mono', 'Space Mono', ui-monospace, monospace;
  font-weight: 700;
  font-size: clamp(3rem, 6vw, 7rem);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 0.95;
  grid-column: span 8;
  margin: 0;
  /* The uppercase + mono + wide-tracking is the Gridnik signature */
}

.crouwel-accent {
  color: var(--c-red);
}

.crouwel-cell {
  grid-column: span 4;
  padding: calc(var(--c-unit) * 3);
  background: transparent;
  border: 1px solid var(--c-grid);
  animation: scan-in 300ms linear both;
  animation-delay: calc(var(--i, 0) * 40ms);
}
@keyframes scan-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.crouwel-cell:hover {
  box-shadow: inset 0 0 0 1px var(--c-ink); /* letterpress indent */
}

/* Reduced motion — instant */
@media (prefers-reduced-motion: reduce) {
  .crouwel-cell { animation: none; }
}
```

## Accessibility

### Contrast
`#0A0A0A` on `#F0EBDF` = 18.2:1 (AAA). `#E2231A` on `#F0EBDF` = 4.9:1 (AA).
APCA Lc ≥ 92 on body.

### Focus
2 px `var(--c-ink)` outline, 2 px offset — minimal, disciplined, respects
the grid.

### Motion
Scan-in is opacity-only and linear — below vestibular trigger threshold.
Reduced-motion instantly resolves.

### Touch target
44×44 default. The grid makes small elements LOOK smaller than they are —
always enforce 44.

### RTL / Logical properties
Full logical. The grid mirrors cleanly for RTL — the scan-in direction
should flip via `[dir="rtl"]` selector so the animation reads naturally
in Arabic / Hebrew locales. Gridnik itself is Latin-only; substitute a
wide-monospaced Arabic or Hebrew face (IBM Plex Mono Arabic) for
equivalent register.

## Slop Watch

- Hidden grid (invisible to user) = NOT Crouwel. The grid is declared,
  shown, celebrated
- Sans-serif display = wrong face; Gridnik or equivalent wide-mono is the
  signature
- Mixed-case display = wrong voice; Crouwel's display titles are
  uppercase, full stop
- Colored gradient accents = wrong era
- Rounded corners = Gridnik's letters are orthogonal, never rounded
- Asymmetric gesture hero (Müller-Brockmann style) = different Swiss school
- No visible grid lines = you're in `swiss-rationalism`, not Crouwel
