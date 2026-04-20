---
id: zine-diy
category: hybrid
motion_tier: Static
density: balanced
locale_fit: [all]
palette_tags: [light, neon]
keywords: [zine, diy, xerox, photocopy, cut-and-paste, punk, fanzine, self-publish, riot-grrrl]
accessibility:
  contrast_floor: 4.5
  reduced_motion: static
  touch_target: 44
---

# Zine DIY

**Category:** hybrid
**Motion tier:** Static

Low-budget photocopied-fanzine aesthetic — cut-and-paste collage, xerox-black
printing, hand-lettered titles over typewritten body copy, stapled gutters.
References: Sniffin' Glue (1976 punk zine), Riot Grrrl zines (1990s), Kinko's
cut-and-paste DIY publishing, Shannon Ebner + Zak Kyes book design, Åbäke's
print work, early Princess Nokia merchandise.

Intentionally post-digital: this style looks *good* when it looks like
something photocopied 4 generations deep. Crispness is the enemy. The style
carries an ideology — DIY is accessible, anti-corporate, anti-polish — and
that ideology must show in the output, not be hidden under a Figma-grid layer.

Contrasts with `brutalist-web` (anti-aesthetic web, not print), with
`risograph-screen-print` (high-craft limited-palette print, not low-fi), and
with `post-internet-maximalism` (digital chaos, not cut-and-paste). Zine-DIY
is the *physicality* of Kinko's at 3 AM.

## Typography

- **Display font:** deliberately mixed — 3+ faces per view, no single
  family carries the voice. Canonical set: **Courier New** (typewriter
  body), **Impact** or **Inktrap** (hand-cut headline), **VT323** (collaged
  machine-output), **a handwritten SVG** or `Caveat` (felt-tip annotation).
  The collage IS the typography — a single unified face breaks the aesthetic
- **Body font:** Courier New at 14 px with ~5 % opacity noise overlay
  (simulates toner imperfection)
- **Tracking:** varies per element. Intentionally inconsistent
- **Leading:** 1.4 on body; headlines set with negative leading (-0.1em
  letter-spacing, lines overlap by 2–3 px — echoes cut-paper headlines
  stacked on top of each other)
- **Feature:** at least one element per view uses `transform: rotate(-1deg
  to 2deg)` — rotation is the signature, misregistration is the voice.
  More than 2 deg reads as "broken layout" not "pasted crooked"; keep it under

## Colors

- **Background:** `#1A1A1A` (xerox black) OR unbleached `#F8F5ED` (paper).
  Never both in the same view. Xerox-black for punk/hardcore, paper for
  craft/personal
- **Primary action:** `#1A1A1A` on paper, `#F8F5ED` on xerox (high-contrast
  inversion)
- **Signature accent:** **one** of `#FF2D78` (hot pink — Riot Grrrl), `#E8FF00`
  (neon yellow — Kinko's highlighter), `#00E4D0` (teal — 1990s photocopy
  accent). NEVER two accents — the whole aesthetic depends on one loud
  color against black/white
- **Texture:** 5–10 % opacity grain overlay (SVG filter or noise texture).
  Zero grain = digital-perfect = wrong register
- **Elevation model:** none. Zines are flat. Depth comes from:
  (a) physical rotation (transform: rotate)
  (b) layered collage (z-index + slight translate)
  (c) xerox-line artifacts (1 px black outlines drawn deliberately off-axis)

## Motion

- **Tier:** Static
- **Spring tokens:** none. Zines are printed objects. If you must animate,
  a 60 ms opacity cut is the only acceptable transition
- **Enter animation:** **cut** — elements appear instantly, no fade, no
  translate. The one exception: a single page-turn ripple if explicitly
  framing the zine as "flipping through pages"
- **Micro-interactions:** hover = 50ms opacity shift from 1.0 → 0.85 → 1.0
  (simulates a hand-lifting-corner of a page). No transform, no color change
- **Active state:** a 2 px inverted "highlighter" box draws briefly around
  focused items — simulates a felt-tip pen marking a zine
- **Forbidden:** any spring, any curve animation, fade transitions, parallax,
  anything implying software-native motion. Zines don't animate

## Spacing

- **Base grid:** **intentionally broken**. Use 8 px grid for layout SAFETY
  (targets / hit areas) but break visual alignment by ±2–4 px per element —
  cut-and-paste is imperfect, perfect alignment reads as InDesign-generated
- **Border-radius vocabulary:** 0 px everywhere. Paper cuts have straight
  edges. The one exception: images with hand-traced `clip-path` borders
- **Z-index / overlapping:** encouraged. Elements can overlap 2–8 px at
  edges, simulating layers of tape-stacked cutouts. This is the ONLY style
  in the catalogue where overlapping is a signature, not a bug

## Code Pattern

```css
@import url('https://fonts.googleapis.com/css2?family=VT323&family=Caveat:wght@700&display=swap');

.zine-page {
  background: #1A1A1A;
  color: #F8F5ED;
  font-family: 'Courier New', ui-monospace, monospace;
  font-size: 14px;
  line-height: 1.4;
  min-block-size: 100dvh;
  padding: 32px;
  position: relative;
  /* Grain overlay — toner imperfection */
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.09 0'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* Cut-paper headline — one of 3 possible faces */
.zine-headline {
  font-family: 'Impact', 'Helvetica Neue Condensed', sans-serif;
  font-size: clamp(2.5rem, 5vw, 5rem);
  font-weight: 900;
  line-height: 0.9; /* negative-ish leading */
  letter-spacing: -0.03em;
  text-transform: uppercase;
  color: #FF2D78; /* choose one accent per view */
  transform: rotate(-1.2deg);
  /* Crop lines simulate cut-paper edge */
  padding-block: 4px;
  border-block: 2px solid #FF2D78;
  display: inline-block;
  margin-block: 0.2em;
}

/* Typewriter paragraph — slightly offset on tape */
.zine-paragraph {
  font-family: 'Courier New', monospace;
  color: #F8F5ED;
  text-shadow: 1px 0 0 rgba(248, 245, 237, 0.15); /* slight misregistration */
  background: rgba(248, 245, 237, 0.08);
  padding: 12px 16px;
  transform: rotate(0.3deg);
  box-shadow: -2px 2px 0 rgba(248, 245, 237, 0.1); /* tape shadow */
}

/* Felt-tip annotation — hand-written callout */
.zine-annotation {
  font-family: 'Caveat', cursive;
  font-weight: 700;
  font-size: 22px;
  color: #E8FF00;
  transform: rotate(-3deg);
  display: inline-block;
  padding: 0 6px;
  /* Highlighter-like underline */
  background: linear-gradient(180deg, transparent 60%, #E8FF00 60%, #E8FF00 90%, transparent 90%);
  background-size: 100% 0.8em;
  background-repeat: no-repeat;
  background-position: 0 100%;
}

/* Stapled card — the physical zine-spread */
.zine-spread {
  background: #F8F5ED;
  color: #1A1A1A;
  padding: 40px 32px;
  /* Staple bumps — pseudo-elements could draw actual staples */
  position: relative;
  box-shadow: -4px 4px 0 #1A1A1A;
  transform: rotate(0.8deg);
}
.zine-spread::before {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 16px;
  inline-size: 2px;
  block-size: 12px;
  background: #1A1A1A;
  transform: translateX(-50%) rotate(-15deg);
}

/* Focus: highlighter-box, no transform */
.zine-interactive:focus-visible {
  outline: 3px dashed #E8FF00;
  outline-offset: 2px;
}

/* Static style — reduced-motion already honored because there is nothing to reduce */
@media (prefers-reduced-motion: reduce) {
  .zine-headline,
  .zine-paragraph,
  .zine-spread { transform: none; }
}
```

## Accessibility

### Contrast
`#F8F5ED` on `#1A1A1A` = 17.1:1 (AAA max). `#FF2D78` on `#1A1A1A` = 5.1:1
(AA). `#E8FF00` on `#1A1A1A` = 15.2:1 (AAA). APCA Lc ≥ 90 on body.

### Focus
3 px dashed outline in the active accent color (not always yellow — match
the view's dominant accent). Dashed reads as "highlighter trace", stays in
the aesthetic. `forced-colors` falls back to `AccentColor`.

### Motion
Transform rotations (signature) are visual, not animated, so they're safe
under `prefers-reduced-motion`. The explicit `reduce` branch unrotates for
users who get nauseous from even static tilt (rare but documented in
vestibular-disorder literature).

### Touch target
44×44 default. The rotated layout means buttons visually *look* smaller —
always pad to 44 regardless of visible size.

### RTL / Logical properties
Full logical properties despite the deliberately-imperfect aesthetic —
RTL readers should get a correctly-mirrored zine, not an LTR zine with
mirrored type. The rotation direction flips in RTL
(`transform: rotate(calc(-1 * var(--tilt)))` with a CSS variable) so the
cut-paper "lean" remains natural. Arabic/Hebrew zines are a rich tradition
— substitute Arabic Linotype or Frank Ruhl Libre for the typewriter face.

## Slop Watch

- Perfect alignment on all elements = NOT zine. At least one element must
  be rotated ±0.3–2 deg
- No grain / texture = digital-perfect = wrong register. 5 %+ grain
  opacity is non-negotiable
- Two accent colors in the same view = over-designed. One loud color per
  spread, always
- Glass blur, gradients, drop-shadow-with-blur = software-native aesthetic.
  Zines only have hard offset shadows (tape reference)
- Sans-serif body (Inter, Helvetica) = reads as *about* zines, not *as* a
  zine. Must be Courier New / VT323 / equivalent
- Crisp, clean typography = everything needs slight opacity variation or
  text-shadow misregistration
- More than 3 typefaces per view = chaos, not collage. Cap at 3
- "Zine-inspired" polished output = worst of both worlds. Either commit to
  the aesthetic or use a different style
