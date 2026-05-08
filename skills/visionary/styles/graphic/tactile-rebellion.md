---
id: tactile-rebellion
category: graphic
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [off-white, pms-heavy, riso, cobalt, vermilion]
keywords: [riso, tactile, anti-perfection, papper, kollage, hand-cut, zine, print]
accessibility:
  contrast_floor_apca: 70
  touch_target_px: 44
  reduced_motion: opacity-only
scoring_hints:
  product_archetypes: [editorial, creative-agency, non-profit]
  audience_density: [balanced]
  brand_tones: [warm, irreverent]
---

# Tactile Rebellion

**Category:** graphic
**Motion tier:** Subtle (tier 1)

## Philosophy

Tactile Rebellion is a reaction against the totalizing perfection of contemporary SaaS surfaces. Every rounding radius above 2px, every seamless gradient, every drop shadow that floats rather than rests — these are signals of a design culture that has confused technical capability with aesthetic authority. This style argues the opposite: that visible human touch is a feature, not a defect. A slightly misregistered color layer, a paper fiber visible in the background, a heading that sits 0.3 degrees off-horizontal — these are evidence that a person made this before it became a pixel. The riso-print vocabulary is not nostalgia. It is structural resistance to generative convergence: diffusion models cannot fake ink-on-paper color separation without visible artifacts, which makes this style naturally anti-slop.

The palette is deliberately restricted to what a two-drum risograph can produce. Over-printing two layers at 70% opacity creates a third color in the overlap that was not deliberately chosen — it emerged from physics. This accidental third color is the aesthetic's signature and cannot be credibly faked with flat CSS without the layering logic that produces it.

## Palette

Five colors, two layers, one accidental overlap:

- **Paper white** — `oklch(0.97 0.013 88)` — hex `#FAF7F0`
  Rationale: Not #FFFFFF (too digital, too clean). Not cream (too warm, loses cobalt legibility). This specific off-white carries the warm undertone of uncoated stock under studio lighting — it reads as paper, not as screen white.

- **Cobalt layer** — `oklch(0.35 0.14 262)` — approx `#1E3A8A`
  Rationale: PMS 2756 approximate. Riso's cobalt drum is cooler than navy and slightly less saturated than electric blue — it is the blue of university letterheads and union newsletters from the 1980s. On paper-white, APCA Lc = 81. Passes all thresholds.

- **Vermilion layer** — `oklch(0.52 0.21 28)` — approx `#E03C00`
  Rationale: PMS 485 approximate. The riso red drum produces this slightly orange-shifted vermilion rather than pure red. On paper-white, APCA Lc = 78. Passes minimum threshold.

- **Over-print dark** — `oklch(0.28 0.11 35)` — approx `#4A1A00`
  Rationale: Where cobalt and vermilion overlap at 70% opacity with `mix-blend-mode: multiply`, the resulting color is this deep warm brown-black. It reads as ink-on-ink, not as a chosen color. This should never appear in the token list as a deliberate color — it is always a consequence of layering.

- **Shadow black** — `oklch(0.14 0.02 262)` — approx `#111827`
  Rationale: For text and hard shadow edges only. No blur. 2px offset maximum. Must read as ink on paper, not as a drop-shadow CSS effect.

### Over-print Simulation in CSS

```css
:root {
  --color-paper:     oklch(0.97 0.013 88);
  --color-cobalt:    oklch(0.35 0.14 262);
  --color-vermilion: oklch(0.52 0.21 28);
  --color-ink:       oklch(0.14 0.02 262);
}

.riso-layer-cobalt {
  background-color: var(--color-cobalt);
  opacity: 0.70;
  mix-blend-mode: multiply;
}

.riso-layer-vermilion {
  background-color: var(--color-vermilion);
  opacity: 0.70;
  mix-blend-mode: multiply;
}

/* Over-print zone: place both layers; browser computes the third color */
.riso-overprint {
  position: relative;
  isolation: isolate;
}
```

## Typography

- **Display font:** Bricolage Grotesque (variable, axes: wdth 75–100, wght 400–800)
  Rationale: Bricolage Grotesque has an inherent optical irregularity — its counters and terminals carry the slight unevenness of wood-type printing, a quality that conventional grotesks (Inter, DM Sans) deliberately smooth away. The variable axes allow narrow-condensed settings that evoke handbill typography without using actual display fonts that read as "vintage." Use `font-variation-settings: 'wdth' 80, 'wght' 700` for headings.

- **Body font:** Authentic Sans (or Reross Quadratic as alternative)
  Rationale: Both are manually drawn in a way that resists mechanical perfection. Authentic Sans has irregular stroke-widths at body sizes that read as hand-letterpressed rather than digitally rendered. Reross Quadratic is more geometric but carries its own geometric imperfection — it reads as a hand-traced circle, not a mathematically defined one. Either pairs with Bricolage by sharing a rough-edged quality without competing for attention.

- **Tracking:** `-0.01em` on display; `0.01em` on body (body needs fractional opening to breathe on paper-white)
- **Leading:** `1.55` on body — generous enough for the ink-spread illusion
- **Heading tilt simulation:** Each `h1` and `h2` receives a subtle random-ish rotation. In static CSS, hardcode alternating values: `h1 { transform: rotate(-0.3deg); }` `h2 { transform: rotate(0.4deg); }`. Never exceed ±0.5deg. WCAG 2.2 Reading Direction compliance: tilt must never alter the text's reading order or bidi direction.

```css
:root {
  --font-display: 'Bricolage Grotesque', system-ui, sans-serif;
  --font-body: 'Authentic Sans', 'Helvetica Neue', sans-serif;
}

h1, h2 {
  font-family: var(--font-display);
  font-variation-settings: 'wdth' 80, 'wght' 700;
  letter-spacing: -0.01em;
  line-height: 1.15;
  color: var(--color-ink);
  /* Hard paper shadow — no blur, no opacity softening */
  text-shadow: 2px 2px 0 var(--color-ink);
}

h1 { transform: rotate(-0.3deg); }
h2 { transform: rotate(0.4deg); }

body {
  font-family: var(--font-body);
  letter-spacing: 0.01em;
  line-height: 1.55;
  color: var(--color-ink);
  background-color: var(--color-paper);
}

@media (prefers-reduced-motion: reduce) {
  h1, h2 { transform: none; }
}
```

## Motion

**Tier 1 — Subtle.** One micro-animation only: `paper-rustle` on interactive elements.

Riso-print exists in physical space. Paper moves when touched — a slight flex, a 0.2deg rotation. This is the only motion the style tolerates. No spring physics: springs imply elasticity and life, which destroys the paper metaphor. No slide-in entrances: paper does not emerge from off-screen. No scale transforms: paper does not grow.

```css
@keyframes paper-rustle {
  0%   { transform: rotate(0deg); }
  50%  { transform: rotate(0.2deg); }
  100% { transform: rotate(0deg); }
}

.tactile-button,
.tactile-card {
  transition: box-shadow 150ms linear, transform 200ms linear;
}

.tactile-button:hover,
.tactile-card:hover {
  animation: paper-rustle 200ms ease-in-out;
  box-shadow: 3px 3px 0 var(--color-ink);
}

@media (prefers-reduced-motion: reduce) {
  .tactile-button,
  .tactile-card {
    transition: opacity 150ms linear;
    animation: none;
  }
}
```

## Layout and Spacing

- **Base grid:** 8px
- **Border radius:** 0–2px maximum. `border-radius: 2px` is the upper limit and should be used sparingly. Scissors produce straight edges. Cardboard corners are sharp. More than 2px reads as a designed digital object, not a cut-and-pasted artifact.
- **Shadows:** Hard offset, no blur. `box-shadow: 2px 2px 0 var(--color-ink)` for cards; `box-shadow: 3px 3px 0 var(--color-cobalt)` for primary actions. These simulate paper-on-paper stacking, not floating panels.
- **SVG fiber overlay:** Apply a subtle paper texture via SVG filter on `<body>` background. A simple `feTurbulence` at `baseFrequency: 0.65` and `numOctaves: 4` with `feColorMatrix` desaturation produces paper grain without adding significant payload.

```css
/* Paper texture: SVG filter approach, no image payload */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.04'/%3E%3C/svg%3E");
  z-index: 1000;
}
```

## Anti-Slop Rationale

This style is structurally resistant to AI-slop generation. Three explicit patterns it prohibits, each chosen because violation is an immediate tell:

**1. No clean shadows.** All box-shadows in this style are: `X Y 0 <solid-color>`. Zero blur radius. Solid color matching either `--color-ink`, `--color-cobalt`, or `--color-vermilion`. A shadow with `blur-radius > 0` reads as CSS floating-card — the universal AI-generated SaaS component. Shadow-with-blur implies paper is floating in air; shadow-without-blur implies paper resting on paper. The physical metaphor is the rationale. Any generator that defaults to `box-shadow: 0 4px 12px rgba(0,0,0,0.1)` has failed the style.

**2. No gradient backgrounds.** Background is flat `var(--color-paper)` with SVG noise overlay. No `background: linear-gradient(...)`. No `background: radial-gradient(...)`. No `rgba()` transparency over color areas. Riso printing cannot produce gradients — it applies flat ink layers. Any gradient is an anachronism to the print vocabulary and an immediate slop signal. The SVG fiber overlay is additive texture, not a gradient.

**3. No border-radius above 2px.** The riso/zine/collage aesthetic is produced by scissors, paper cutters, and guillotines — all of which produce straight edges. Rounded corners above 2px signal "designed digital object." The 2px ceiling is generous enough to prevent jagged aliasing at screen resolution while preserving the physical-cut aesthetic. Any `border-radius: 8px` or above in this style is a categorical error.

**Slop anchor:** If a critic observes a glassmorphism card, a blue gradient CTA button, or any `border-radius` above 2px in an output claiming this style — score 3/10 maximum. These are not style violations; they are proof the style was not applied.

## Cultural Note

Riso-print takes its name from Riso Kagaku Corporation, a Japanese company that introduced the RISO printer in 1977 as a low-cost alternative to offset printing for institutional use (schools, churches, small offices). The distinctive color-separated, slightly-misregistered aesthetic emerged not from artistic intention but from the machine's mechanical limitations: separate drum for each color, physical impossibility of perfect registration.

The independent publishing and zine scene — particularly in North America, Europe, and Japan from the 1990s onward — adopted riso printing precisely because of its limitations: affordable short runs, distinctive appearance that photocopiers cannot replicate, a texture that signals human production rather than commercial offset. Publications including Colour Code (Portland), Perfectly Acceptable Press (Chicago), and Nieves (Zurich) built their visual identity around riso's constraints.

Use this style as hommage to low-tech publishing lineage, not as aesthetic extraction. It implies a relationship to independent, community-funded, and non-commercial publishing. Deploying tactile-rebellion for a Series C SaaS product requires careful use-case alignment — the incongruity may read as cynical.

## Accessibility

### Contrast
All palette combinations verified against APCA Lc 70 minimum floor:
- `--color-ink` on `--color-paper`: APCA Lc ≈ 108 (exceeds AAA)
- `--color-cobalt` on `--color-paper`: APCA Lc ≈ 81 — passes floor
- `--color-vermilion` on `--color-paper`: APCA Lc ≈ 78 — passes floor
- `--color-cobalt` on `--color-vermilion` (over-print zone, text): do not place body text in over-print zone — contrast cannot be reliably guaranteed without knowing the exact rendered composite

### Focus
`:focus-visible` ring: `outline: 2px solid var(--color-cobalt); outline-offset: 3px`. No blur, no box-shadow simulation of focus. Hard cobalt ring on paper-white = Lc 81 — passes.

### Motion
`prefers-reduced-motion: reduce` disables `paper-rustle` animation and `h1`/`h2` rotation. Opacity transitions remain. This is correct: vestibular sensitivity to rotation is well-documented; the 0.2–0.4deg range is below most clinical thresholds but removing it entirely is the safe choice.

### Touch targets
Minimum 44×44px for all interactive elements. Inline links in body prose are exempt.

### RTL
Use CSS logical properties throughout: `margin-inline`, `padding-inline`, `border-inline-start`. The tilt transforms are bidirectionally neutral (rotation is not a reading-direction property).

## When to Use

- Editorial and independent publishing: zines, newsletters, manifestos, artist statements
- Creative agencies whose clients expect visible human involvement, not automated polish
- Non-profits and advocacy organizations where "polished corporate" reads as out-of-touch
- Cultural institutions (galleries, festivals, independent cinemas) positioned outside mainstream design
- Products explicitly targeting the anti-AI-aesthetic movement of 2025–2026

## When NOT to Use

- Fintech, medtech, or legaltech — regulatory contexts require trust signals that clean design provides
- Enterprise SaaS where the client brief includes "professional" or "trustworthy" as primary brand attributes
- Mobile-first products where the rotation transforms degrade on small screens and become hard to read
- Any brand that cannot credibly claim an authentic relationship to independent publishing culture
- Products requiring precise color matching (e.g., for print production) — the over-print simulation in CSS is approximation, not calibrated color management
