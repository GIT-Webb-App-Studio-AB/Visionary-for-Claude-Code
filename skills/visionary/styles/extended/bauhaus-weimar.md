---
id: bauhaus-weimar
category: extended
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [light, earth, pastel]
keywords: [bauhaus, weimar, itten, 1919, expressionist, early-bauhaus, gropius, feininger]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Bauhaus Weimar (1919–1925)

**Category:** extended
**Motion tier:** Expressive

Johannes Itten's pre-Moholy-Nagy Bauhaus — *Vorkurs* color studies, the
Walter Gropius founding manifesto (1919), Lyonel Feininger's cathedral
woodcut, Oskar Schlemmer's geometric-human studies. Distinct from
`bauhaus-dessau` (post-1925 industrial functionalism) by being
**expressionist, mystical, hand-crafted**. This is the Bauhaus before it
became machine-age.

Use when: the project calls for a crafted-mystical voice (artisan
publishing, wellness products with philosophical depth, expressive editorial).

## Typography

- **Display font:** **IM Fell** (hand-cut feel), **Uncial Antiqua** (for
  ceremonial moments), or **Cooper Black** (expressive blackletter-adjacent).
  The Weimar-era used handset type, not the constructed-geometric Universal
  of Dessau
- **Body font:** **EB Garamond** 16 px — Itten was partial to classical
  serifs for body
- **Tracking:** display 0; body 0.005em
- **Leading:** 1.65 body
- **Feature:** hand-drawn SVG flourishes at section breaks — echoes
  Feininger's woodcut crosshatching

## Colors

- **Background:** `#F4EDDD` (unbleached parchment — the Vorkurs classroom
  walls)
- **Primary:** Itten's color wheel — but muted, not Dessau's saturated
  primaries. Use: `#B85450` (weathered red), `#C9A84C` (aged yellow),
  `#4F6E80` (smoke blue)
- **Ink:** `#2B1F14` (walnut-ink brown — NOT black; Weimar handset printing
  rarely reached true black)
- **Accent:** hand-mixed oxide green `#708260`
- **Elevation:** subtle ink-press texture (8 % opacity grain overlay), no shadows

## Motion

- **Tier:** Expressive
- **Spring tokens:** `{ bounce: 0.2, visualDuration: 0.45 }` — slow, crafted
- **Enter animation:** ink-bloom — opacity 0 → 1 + a slight blur 4 → 0 px
  over 500 ms. Echoes ink spreading on damp paper
- **Micro-interactions:** hover tints the surface 3 % warmer (like held-
  in-hand paper warming)

## Spacing

- **Base grid:** 8 px, but layout tends asymmetric + expressive
- **Border-radius:** 0–3 px; handset composition had no rounded corners
- **Illuminations:** section-opening initials can scale 2.5× body size
  (medieval-book tradition Itten was explicit about respecting)

## Code Pattern

```css
:root {
  --bw-bg: #F4EDDD;
  --bw-ink: #2B1F14;
  --bw-red: #B85450;
  --bw-yellow: #C9A84C;
  --bw-blue: #4F6E80;
  --bw-green: #708260;
}

.bw-page {
  background: var(--bw-bg);
  color: var(--bw-ink);
  font-family: 'EB Garamond', Garamond, 'Times New Roman', serif;
  font-size: 16px;
  line-height: 1.65;
  padding: 48px;
  /* Ink-press grain */
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0.17 0 0 0 0 0.12 0 0 0 0 0.08 0 0 0 0.08 0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");
}

.bw-headline {
  font-family: 'IM Fell English', 'EB Garamond', serif;
  font-size: clamp(2.5rem, 5vw, 5rem);
  font-weight: 400;
  line-height: 1.1;
  color: var(--bw-red);
  margin-block: 1rem;
}

/* Illuminated initial */
.bw-initial {
  float: inline-start;
  font-size: 3.5em;
  line-height: 1;
  padding-inline-end: 0.1em;
  color: var(--bw-blue);
  font-weight: 500;
}

.bw-ornament {
  block-size: 24px;
  margin-block: 2rem;
  background: no-repeat center url("data:image/svg+xml,...");
  opacity: 0.6;
}

@media (prefers-reduced-motion: reduce) {
  .bw-page * { transition: none; animation: none; }
}
```

## Accessibility

### Contrast
`#2B1F14` on `#F4EDDD` = 11.8:1 (AAA). `#B85450` on `#F4EDDD` = 4.7:1 (AA).
APCA Lc ≥ 80 on body.

### Focus
2 px `#B85450` outline, 3 px offset. Matches the ink voice.

### Motion
Ink-bloom (opacity + blur) is below vestibular threshold. Under reduce,
instant fade.

### Touch target
44×44 default. Illuminated initials NEVER function as interactive targets.

### RTL / Logical properties
Fully logical. EB Garamond covers Latin + Cyrillic + Greek; substitute
Amiri for Arabic.

## Slop Watch

- Saturated pure primaries (Dessau palette) = wrong era; this is Weimar
- Geometric-sans display = wrong voice; handset type is the point
- Pure white background = breaks the parchment register
- No grain / texture = too digital
- Lowercase type (Bauer Universal) = Dessau signature, not Weimar
- Symmetrical composition = wrong; expressionism embraces asymmetry
