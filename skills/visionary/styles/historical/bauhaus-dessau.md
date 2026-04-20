---
id: bauhaus-dessau
category: historical
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [light, neon]
keywords: [bauhaus, dessau, moholy-nagy, industrial, 1925, late-bauhaus, new-typography]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Bauhaus Dessau (1925+)

**Category:** historical
**Motion tier:** Expressive

László Moholy-Nagy's Dessau-era Bauhaus — *Die neue Typographie* (Tschichold
1928, based on Moholy-Nagy's Dessau principles), the Herbert Bayer Universal
alphabet, the later functional-industrial phase. Distinct from
`bauhaus-weimar` (the Itten-era expressive 1919 phase) by being **industrial,
sachlich, machine-age**: heavy primary colors, diagonal composition,
photographic elements, geometric sans.

Most "bauhaus" references in product design mean Dessau, not Weimar —
this is the one that looks like "Bauhaus" to modern eyes.

## Typography

- **Display font:** **Universal** (Bayer 1925, reconstructed as *P22 Bayer
  Universal Pro*) or **Futura** (1927, same vocabulary). Lower-case only
  (Bayer's radical move). Geometric shapes — perfect circles for o, straight
  verticals for l
- **Body font:** Futura Regular 15 px
- **Tracking:** display 0; body +0.005em
- **Feature:** all type set lowercase. Bayer: "why have two alphabets when
  one will do"

## Colors

- **Background:** `#F0ECE4` (warm industrial off-white — the color of
  Dessau-era printed pamphlets)
- **Primary:** the three Bauhaus primaries — `#DC2626` (red square),
  `#EAB308` (yellow circle), `#2563EB` (blue triangle). USE ALL THREE at
  characteristic geometric shapes
- **Ink:** `#000000`
- **Elevation model:** flat — no shadows; depth via z-layer overlap at
  diagonal angles

## Motion

- **Tier:** Expressive
- **Spring tokens:** `{ bounce: 0.1, visualDuration: 0.4 }` — precise,
  mechanical
- **Enter animation:** geometric forms rotate 15° as they enter (the
  diagonal-composition signature). 400 ms, cubic-bezier(0.34, 1.56, 0.64, 1)
- **Micro-interactions:** hover rotates the form 3° — hints at the machine-
  age kinesis

## Spacing

- **Base grid:** 8 px, but composition prioritizes diagonal axes over
  orthogonal alignment
- **Border-radius:** 0 on rectangles, 999px on circles. Pure geometric
  vocabulary

## Code Pattern

```css
:root {
  --bd-bg: #F0ECE4;
  --bd-red: #DC2626;
  --bd-yellow: #EAB308;
  --bd-blue: #2563EB;
  --bd-ink: #000;
}

.bd-canvas {
  background: var(--bd-bg);
  color: var(--bd-ink);
  font-family: 'Futura', 'Futura PT', 'Century Gothic', sans-serif;
  font-size: 15px;
  line-height: 1.5;
  text-transform: lowercase;
  padding: 48px;
  position: relative;
  min-block-size: 100dvh;
}

.bd-square-red {
  inline-size: 160px;
  block-size: 160px;
  background: var(--bd-red);
  position: absolute;
  transform: rotate(15deg);
}
.bd-circle-yellow {
  inline-size: 200px;
  block-size: 200px;
  background: var(--bd-yellow);
  border-radius: 50%;
  position: absolute;
}
.bd-triangle-blue {
  inline-size: 0;
  block-size: 0;
  border-inline-start: 120px solid transparent;
  border-inline-end: 120px solid transparent;
  border-block-end: 200px solid var(--bd-blue);
  position: absolute;
}

.bd-headline {
  font-size: clamp(3rem, 7vw, 7rem);
  font-weight: 400;
  line-height: 0.95;
  letter-spacing: 0;
  margin: 0;
}
```

## Accessibility

### Contrast
`#000` on `#F0ECE4` = 16.3:1 (AAA). Geometric forms (non-text) pass 3:1
requirement for non-text UI.

### Focus
3 px `#000` outline.

### Motion
15° rotation on entry is below vestibular threshold. Reduced-motion drops
to instant (no rotation).

### Touch target
44×44 default. Triangle forms have asymmetric hit areas — wrap in a square
hit target at 44×44 minimum.

### RTL / Logical properties
Logical properties throughout. The diagonal composition mirrors cleanly —
red square goes to the opposite corner.

## Slop Watch

- Uppercase type = Weimar-era or generic-sans; not Dessau (lowercase only)
- Non-primary colors = breaks the three-primary discipline
- Serif type = wrong century
- All-orthogonal composition = Weimar, not Dessau (diagonal is the signature)
- Shadows / glow = Bauhaus is flat
