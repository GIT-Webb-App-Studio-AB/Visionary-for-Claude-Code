---
id: swiss-gerstner
category: historical
motion_tier: Subtle
density: dense
locale_fit: [all]
palette_tags: [light, editorial]
keywords: [swiss, gerstner, karl-gerstner, programmatic, grid, parametric, modular, boutique-magazine]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Swiss Gerstner (Programmatic Grid)

**Category:** historical
**Motion tier:** Subtle

Karl Gerstner's programmatic-design lineage — *Designing Programmes* (1964),
the Bauen + Wohnen grid system, Hoffmann-La Roche corporate identity.
Gerstner's grid isn't the Müller-Brockmann pedagogical kind; it's
parametric, modular, capable of generating thousands of variations from a
few rules.

Differs from `swiss-rationalism` (the encyclopedic grid — Helvetica,
asymmetric) by being **rule-based**: every layout decision must be
expressible as a parameter. Use for data-rich editorial, parametric
product catalogs, generative-art portfolios.

## Typography

- **Display font:** **Akzidenz-Grotesk** (Gerstner's personal face) or
  **Neue Haas Grotesk** as fallback. NOT Helvetica (too neutral — Gerstner
  preferred its predecessor)
- **Body font:** Akzidenz-Grotesk Regular 15 px
- **Tracking:** -0.01em display, 0 body
- **Leading:** 1.4 (tight, dense, like print)
- **Feature:** modular scale locked to `1.125` (major second) — the one
  constraint Gerstner hands down untouched

## Colors

- **Background:** `#F5F3EE` (warm print white — Gerstner rarely used pure
  white, preferring cream-tinted paper stock)
- **Primary text:** `#111111`
- **Accent:** `#B83200` (Gerstner red, from Hoffmann-La Roche) or `#0039A6`
  (Gerstner blue). One accent per program
- **Forbidden:** palette beyond the 3 colors; Gerstner's programs used one
  accent, not a palette

## Motion

- **Tier:** Subtle
- **Spring tokens:** `{ bounce: 0, visualDuration: 0.18 }` — print doesn't spring
- **Enter animation:** fade-in 180 ms; optionally a parametric reveal
  (elements appear in a deterministic order — top-left quadrant first,
  then bottom-right, simulating grid-walk)

## Spacing

- **Base grid:** **8 columns, 16 units per column, 4 px baseline unit**.
  Nothing aligns off-grid. Ever.
- **Border-radius:** 0 px
- **Module heights:** multiples of the baseline (4, 8, 16, 32, 64, 128 px)
- **Gutter:** 24 px (6 baseline units)

## Code Pattern

```css
:root {
  --gerstner-unit: 4px;
  --gerstner-col: calc(var(--gerstner-unit) * 16); /* 64px */
  --gerstner-gutter: calc(var(--gerstner-unit) * 6); /* 24px */
  --gerstner-bg: #F5F3EE;
  --gerstner-ink: #111;
  --gerstner-red: #B83200;
}

.gerstner-grid {
  display: grid;
  grid-template-columns: repeat(8, var(--gerstner-col));
  gap: var(--gerstner-gutter);
  background: var(--gerstner-bg);
  color: var(--gerstner-ink);
  padding: calc(var(--gerstner-unit) * 8);
  font-family: 'Akzidenz-Grotesk', 'Neue Haas Grotesk', 'Helvetica Neue', sans-serif;
  font-size: 15px;
  line-height: 1.4;
  max-inline-size: calc(var(--gerstner-col) * 8 + var(--gerstner-gutter) * 7);
  margin-inline: auto;
}

.gerstner-module {
  background: transparent;
  padding: calc(var(--gerstner-unit) * 4);
  border: 1px solid rgba(0, 0, 0, 0.08);
}
.gerstner-module h2 {
  font-size: calc(15px * 1.125 * 1.125); /* 18.98px — modular scale */
  font-weight: 500;
  margin: 0 0 calc(var(--gerstner-unit) * 2);
}

.gerstner-label {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 11px;
  color: var(--gerstner-red);
}
```

## Accessibility

### Contrast
`#111` on `#F5F3EE` = 17.5:1 (AAA). `#B83200` on `#F5F3EE` = 5.1:1 (AA).
APCA Lc ≥ 90 on body.

### Focus
2 px `#B83200` outline, 2 px offset — minimal, on-grid.

### Motion
Parametric reveal is safe (opacity-only, staggered). No transforms.

### Touch target
44×44 default. Dense modules can shrink to 32 px hit areas IF the style's
frontmatter is updated (dense data context is documented) — but default 44.

### RTL / Logical properties
Full logical. The 8-column grid mirrors cleanly in RTL.

## Slop Watch

- Sans-serif other than Akzidenz / Neue Haas = wrong era/voice
- Off-grid elements = violates the programmatic premise
- Multi-color accents = Gerstner programs use ONE
- Non-modular type scale = break the system, lose the identity
- Serif display font = wrong school entirely (that's `swiss-rationalism`
  only if you count Egyptian slabs in old Swiss work)
