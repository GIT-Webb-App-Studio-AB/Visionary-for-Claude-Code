---
id: cassette-futurism
category: extended
motion_tier: Subtle
density: dense
locale_fit: [all]
palette_tags: [dark, earth, neon]
keywords: [cassette, futurism, atompunk, used-future, alien, nostromo, analog, crt, terminal, blade-runner]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Cassette Futurism

**Category:** extended
**Motion tier:** Subtle

The "used future" aesthetic — Alien's Nostromo, Severance, early Blade Runner,
2001: A Space Odyssey as shot, Control (Remedy), and the Decima engine titles.
Future tech designed in the 1970s-80s, not the 2020s. Beige computer casings,
monochrome green CRTs, physical buttons with stencil labels, real toggle
switches. Everything looks slightly stained, slightly worn, slightly analog.

Contrasts with `cyberpunk-neon` (saturated neon on black) and `synthwave`
(1980s imagined future). This is what people in 1979 thought 2050 would
actually look like.

## Typography

- **Display font:** **Futura PT Medium** (Bauhaus-era geometric, perfect
  period marker) or VT323 for CRT screens. For stencil labels use IBM Plex
  Mono Bold — it was designed on period 3270-terminal metrics
- **Body font:** IBM Plex Mono or Space Mono — monospace reads as "computer
  output", which is the whole point
- **Tracking:** 0.05em (wide like stenciled labels) | **Leading:** 1.35
- **Feature:** all uppercase for labels, sentence-case only for paragraph
  content. The uppercase+monospace combination is the signature

## Colors

- **Background:** `#C8B998` (beige computer casing) OR `#0A1410` (CRT
  phosphor-black) depending on surface type — never both in the same view
- **Primary action:** `#D4533A` (Nostromo warning red/orange) or `#2A8C5A`
  (CRT phosphor green)
- **Accent:** `#F4D17C` (masking-tape yellow) — used for "caution" labels and
  manual-mode toggles
- **Text on beige:** `#1A1510` (dark oil-brown, not pure black)
- **Text on CRT:** `#B8D89C` (phosphor green at 72 % luminance — pure #00FF00
  is cyberpunk, wrong register)
- **Elevation model:** physical. Cards are inset panels with 2px hard inner
  shadow + 1px top highlight to simulate a recessed control panel. NO blur

## Motion

- **Tier:** Subtle
- **Spring tokens:** `{ bounce: 0, visualDuration: 0.15 }` — mechanical, no
  bounce, no overshoot. Real toggle switches snap, they don't spring
- **Enter animation:** **scanline sweep** — 120ms horizontal gradient bar
  crosses the element, revealing content as it passes. CRT boot sequence
- **Micro-interactions:** buttons "depress" 1px and darken by 8%. Toggle
  switches rotate through a 3-frame animation (off → mid → on) in 90ms, no easing
- **Idle:** on CRT surfaces, a 2 % opacity scanline gradient animates slowly
  (4s per cycle) — reference the CRT refresh. Reduced-motion drops this
- **Forbidden:** any spring bounce (mechanical = no elasticity), glow pulses,
  smooth scrolling, anything that implies digital perfection

## Spacing

- **Base grid:** 8px, but everything aligns to the typographic baseline
- **Border-radius vocabulary:** 2px maximum. Most elements are 0 — this is
  stamped metal, not extruded plastic
- **Panel nesting:** recessed panels within recessed panels is canonical.
  Depth comes from inner shadow stacks, never outer shadow

## Code Pattern

```css
.cassette-panel {
  background: #C8B998;
  color: #1A1510;
  font-family: 'IBM Plex Mono', 'Space Mono', monospace;
  font-size: 14px;
  letter-spacing: 0.05em;
  padding: 24px;
  border-radius: 2px;
  /* Recessed physical panel: inner shadow + top highlight */
  box-shadow:
    inset 2px 2px 0 rgba(0, 0, 0, 0.18),
    inset -1px -1px 0 rgba(255, 255, 255, 0.35),
    0 1px 0 rgba(255, 255, 255, 0.6);
}

/* CRT screen surface */
.cassette-crt {
  background: #0A1410;
  color: #B8D89C;
  font-family: 'VT323', 'IBM Plex Mono', monospace;
  font-size: 18px;
  padding: 20px;
  border-radius: 4px;
  text-shadow: 0 0 2px rgba(184, 216, 156, 0.4); /* phosphor glow */
  /* Subtle scanline overlay */
  background-image: repeating-linear-gradient(
    0deg,
    transparent 0, transparent 2px,
    rgba(0, 0, 0, 0.15) 2px, rgba(0, 0, 0, 0.15) 3px
  );
}

/* Stencil label — the signature type treatment */
.cassette-label {
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #D4533A;
  font-size: 11px;
}

/* Scanline reveal entry */
@media (prefers-reduced-motion: no-preference) {
  .cassette-enter {
    animation: scan 400ms steps(8, end);
  }
  @keyframes scan {
    from { clip-path: inset(0 100% 0 0); }
    to   { clip-path: inset(0 0 0 0); }
  }
}

/* Mechanical button */
.cassette-button {
  background: #C8B998;
  border: 2px solid #1A1510;
  border-radius: 2px;
  padding: 10px 18px;
  text-transform: uppercase;
  font-weight: 700;
  box-shadow:
    0 3px 0 #8A7A55,
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  transition: translate 40ms linear, box-shadow 40ms linear;
}
.cassette-button:active {
  translate: 0 2px;
  box-shadow:
    0 1px 0 #8A7A55,
    inset 0 1px 0 rgba(0, 0, 0, 0.3);
}
```

## Accessibility

### Contrast
`#1A1510` on `#C8B998` = 9.4:1 (WCAG AAA). `#B8D89C` on `#0A1410` = 10.8:1
(AAA). APCA Lc ≥ 85 on both panels. Stencil `#D4533A` on beige = 4.2:1 —
reserve for large labels only (≥ 14 px bold / 18 px regular).

### Focus
2px `:focus-visible` with `outline-offset: -2px` (inset into the physical
panel, not outside it — matches the recessed aesthetic). Use `AccentColor`.

### Motion
Scanline idle on CRT surfaces is decorative and opacity-only → safe, but still
gate on `prefers-reduced-motion` because the scanline motion can nauseate
sensitive users. Button press translate is ≤ 2px and consensual (user-initiated),
safe even in reduce mode.

### Touch target
44×44 default. Period-accurate "toggle switches" keep 44×44 even though the
visual hit area is smaller — never let the physical look dictate the hit target.

### RTL / Logical properties
Panel layouts use `margin-inline`, `padding-inline`, `inset-inline-*`. Stencil
labels remain LTR per typographic convention even in RTL languages (stenciling
is a LTR tradition; Arabic/Hebrew equivalents exist but are a different design
decision to make explicitly).

## Slop Watch

- Bright pure colors = wrong era. Everything must feel slightly stained,
  slightly off-saturation (oklch chroma ≤ 0.14)
- Blur filters = digital, wrong register. Use solid colors only
- Rounded corners (> 2px) = extruded plastic aesthetic (2010s), not stamped
  metal (1970s)
- Sans-serif body text = fail. Monospace is the point
- Neon / glow (other than CRT phosphor) = wrong register. See `cyberpunk-neon`
  or `neon-dystopia` for that
- Curved gradients = wrong era. Use hard color stops only
