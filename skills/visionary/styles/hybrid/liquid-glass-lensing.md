---
id: liquid-glass-lensing
category: hybrid
motion_tier: Expressive
density: sparse
locale_fit: [all]
palette_tags: [cool, frosted, premium, ice-blue, displacement]
keywords: [glass, lensing, refraction, displacement, premium, optical, svg-filter, web-native]
accessibility:
  contrast_floor_apca: 60
  touch_target_px: 44
  reduced_motion: no-displacement
scoring_hints:
  product_archetypes: [luxury, consumer-app, creative-agency]
  audience_density: [sparse]
  brand_tones: [bold, neutral]
---

# Liquid Glass Lensing

**Category:** hybrid
**Motion tier:** Expressive (tier 2)

## Distinction from `liquid-glass` and `liquid-glass-ios26`

This style is categorically distinct from the Apple-derived glass styles already in the catalog. The distinction is not subtle — it is architectural.

**`liquid-glass` / `liquid-glass-ios26` (iOS 26 adaptive glass):**
- Mechanism: `backdrop-filter: blur() + saturate()` with system-adaptive tinting
- Effect: Content behind panels is blurred and tinted — it becomes indistinct
- What moves: Nothing physically moves; the panel is a static tinted window
- Platform origin: Apple system UI (UIKit vibrancy, SwiftUI materials)
- Web analog: `backdrop-filter: blur(20px) saturate(1.4)` — diffusion, not refraction

**`liquid-glass-lensing` (this style):**
- Mechanism: SVG `<feDisplacementMap>` displaces source pixel positions using a turbulence field, then `backdrop-filter` adds secondary atmospheric depth
- Effect: Content behind panels is *geometrically distorted* — it bends, warps, shifts position. This is optical refraction, not blurring
- What moves: The displacement field can animate its `scale` property, causing the lens to breathe, ripple, or shimmer. The distortion pattern itself moves.
- Platform origin: Web-native — this effect cannot be replicated in iOS UIKit or SwiftUI materials. It is exclusive to SVG filter pipelines in browsers.
- Web analog: `filter: url(#lens-filter)` + `backdrop-filter` in combination

The two styles can coexist in the catalog and in a single product. They solve different problems: `liquid-glass` creates atmosphere and surface hierarchy through blur; `liquid-glass-lensing` creates optical presence through displacement. A hero navigation bar using lensing displacement over a video background and a secondary panel using standard blur+tint is a coherent combination.

## The Physics Distinction

Glass refracts light. A flat pane of glass, seen edge-on, shows no refraction because its two surfaces are parallel. A lens — a curved or variable-thickness glass element — refracts light differently at different points, bending rays toward a focal point or away from it. The `feDisplacementMap` filter approximates the second behavior: it uses a grayscale map to offset pixel positions, creating the impression of variable-thickness glass that bends the image beneath it.

`backdrop-filter: blur()` simulates the scattering that occurs when light passes through frosted or etched glass — obscuring rather than bending. It is a different physical phenomenon that produces a different visual result. Calling `backdrop-filter: blur()` "glass" is technically imprecise; it is frosted glass or ground glass. Lensing is a different material — optical glass, water lens, crystal.

## Palette

Derived from the optical associations of glass and ice: cold, clear, with warm depth at the edges.

- **Background content:** Variable — lensing only works over rich visual content. The displacement map needs something to displace. A flat-color background renders as nothing. Recommended backgrounds: photography, video, gradient meshes with high color variation. The panel itself adds the coolness.

- **Panel ice-blue:** `oklch(0.92 0.04 240)` — hex approx `#D6E8F7`
  Rationale: A very light, slightly saturated blue-white. At high opacity this reads as opaque panel; at 60–70% opacity over a rich background, it reads as tinted glass with blue cast — the color of ice viewed from within. The color itself is secondary to the displacement effect it frames.

- **Frosted grey (secondary panels, depth):** `oklch(0.85 0.02 240)` — hex approx `#CDDAE6`
  Rationale: Slightly more saturated and darker than ice-blue — used for panels at a perceived second depth layer. The relationship between ice-blue and frosted-grey creates a subtle atmospheric perspective: lighter panels read as closer, darker as further back.

- **Accent warm (for depth contrast):** `oklch(0.62 0.18 30)` — hex approx `#C45A1A`
  Rationale: A warm amber-orange that is perceptually far from the cool palette. Used sparingly as the single high-contrast anchor in an otherwise low-saturation surface. At this luminosity and chroma, it reads as a "hot point" — the warm light visible through cold glass. APCA Lc on `--color-panel-ice` ≈ 65: passes the relaxed 60 floor for large display text.

- **Text on glass:** `oklch(0.98 0 0)` — near-white `#FAFAFA` over rich backgrounds with displacement; `oklch(0.14 0 0)` — near-black over light content
  Rationale: The displacement effect changes the effective background color unpredictably. Text on a lensing panel must use either near-white (over dark/rich content) or `text-shadow: 0 1px 3px rgba(0,0,0,0.7)` to maintain legibility across the variable displaced background.

```css
:root {
  --color-panel-ice:    oklch(0.92 0.04 240);
  --color-panel-frost:  oklch(0.85 0.02 240);
  --color-accent-warm:  oklch(0.62 0.18  30);
  --color-text-light:   oklch(0.98 0     0);
  --color-text-dark:    oklch(0.14 0     0);
}
```

## Technical Implementation: SVG Displacement

The lens effect requires an SVG filter element present in the DOM. This filter is referenced by CSS, not embedded inline per-element.

```html
<!-- Place once in <body>, hidden with CSS -->
<svg width="0" height="0" style="position: absolute; overflow: hidden;">
  <defs>
    <filter id="lens-subtle" x="-10%" y="-10%" width="120%" height="120%"
            color-interpolation-filters="sRGB">
      <!-- Turbulence generates the displacement map -->
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.018 0.022"
        numOctaves="3"
        seed="7"
        result="noise" />
      <!-- Displacement map uses noise to offset source pixels -->
      <feDisplacementMap
        in="SourceGraphic"
        in2="noise"
        scale="8"
        xChannelSelector="R"
        yChannelSelector="G"
        result="displaced" />
      <!-- Composite back to avoid rendering outside bounds -->
      <feComposite
        in="displaced"
        in2="SourceGraphic"
        operator="in" />
    </filter>

    <!-- Stronger variant for hero panels -->
    <filter id="lens-strong" x="-15%" y="-15%" width="130%" height="130%"
            color-interpolation-filters="sRGB">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.015 0.018"
        numOctaves="4"
        seed="7"
        result="noise" />
      <feDisplacementMap
        in="SourceGraphic"
        in2="noise"
        scale="14"
        xChannelSelector="R"
        yChannelSelector="G"
        result="displaced" />
      <feComposite
        in="displaced"
        in2="SourceGraphic"
        operator="in" />
    </filter>
  </defs>
</svg>
```

```css
/* Lensing panel — the primary surface */
.lens-panel {
  backdrop-filter: blur(10px) saturate(1.3);
  background-color: color-mix(in oklch, var(--color-panel-ice) 65%, transparent);
  border: 1px solid color-mix(in oklch, white 35%, transparent);
  border-radius: 16px;
  filter: url(#lens-subtle);
  /* The filter must apply AFTER backdrop-filter computes its composite */
}

/* Hero variant: stronger displacement, more atmospheric */
.lens-panel--hero {
  filter: url(#lens-strong);
  backdrop-filter: blur(14px) saturate(1.5);
  background-color: color-mix(in oklch, var(--color-panel-ice) 55%, transparent);
}

/* Text on glass: shadow ensures legibility over variable displaced bg */
.lens-panel__text {
  color: var(--color-text-light);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.60);
}
```

## Typography

Typography on glass panels serves clarity in adverse contrast conditions. The displacement effect variably darkens and lightens the effective background, which means type must be robust to contrast variation.

- **Display:** SF Pro Display (macOS/iOS-native) or `'Inter Display'` (Google Fonts, 100KB WOFF2) as web fallback. Weight 500 for panel headings — medium weight maintains legibility across displacement artifacts better than light or bold.
- **Code overlays:** SF Mono (system) or JetBrains Mono (web fallback). Code overlays on glass panels are a signature use-case for development tools and creative apps — the monospace + glass combination reads as technical-premium.

```css
:root {
  --font-display: 'SF Pro Display', 'Inter Display', system-ui, sans-serif;
  --font-mono:    'SF Mono', 'JetBrains Mono', 'Cascadia Code', monospace;
}

.lens-panel h2 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  letter-spacing: -0.01em;
  color: var(--color-text-light);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
}

.lens-panel code {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  background: rgba(0, 0, 0, 0.25);
  padding: 0.15em 0.4em;
  border-radius: 3px;
  color: var(--color-text-light);
}
```

## Motion

**Tier 2 — Expressive.** The lensing effect can animate through its `scale` attribute on `feDisplacementMap`. This creates a breathing or shimmering quality — the glass panel appears to breathe slightly, as though filled with a slow-moving fluid.

The animation is a 3–5 second loop. Per WCAG 2.2.2, any moving content that lasts more than 5 seconds requires a pause control. The animation loops indefinitely, so a pause control is mandatory.

```css
/* Animating feDisplacementMap scale requires JavaScript targeting the SVG attribute */
/* CSS cannot animate SVG presentation attributes directly in all browsers */
```

```js
// Refraction shimmer — animates feDisplacementMap[scale] between 6 and 14
// Requires GSAP or Web Animations API for SVG attribute animation
function initLensShimmer(filterEl) {
  const displacementMap = filterEl.querySelector('feDisplacementMap');
  if (!displacementMap) return;

  let paused = false;
  let start = null;
  const duration = 4000; // 4s loop
  const scaleMin = 6;
  const scaleMax = 14;

  function tick(ts) {
    if (paused) return;
    if (!start) start = ts;
    const elapsed = (ts - start) % duration;
    const t = elapsed / duration;
    // Sinusoidal ease between min and max
    const scale = scaleMin + (scaleMax - scaleMin) * (0.5 - 0.5 * Math.cos(t * Math.PI * 2));
    displacementMap.setAttribute('scale', scale.toFixed(2));
    requestAnimationFrame(tick);
  }

  // Pause control — attach to a visible button with aria-label="Pause lens animation"
  const pauseBtn = document.querySelector('[data-lens-pause]');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      paused = !paused;
      if (!paused) requestAnimationFrame(tick);
      pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    });
  }

  // Respect prefers-reduced-motion
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    requestAnimationFrame(tick);
  }
}

initLensShimmer(document.getElementById('lens-subtle'));
```

```html
<!-- Required pause control — visible in panel or page corner -->
<button
  data-lens-pause
  aria-pressed="false"
  aria-label="Pause lens animation"
  class="lens-pause-btn">
  Pause
</button>
```

## Browser Support and Fallback

`feDisplacementMap` is Baseline 2024+ (available in Chrome 88+, Firefox 35+, Safari 13.1+). The `@supports` CSS query cannot directly test SVG filter support, so use a capability check approach:

```css
/* Base styles — work without filter support */
.lens-panel {
  backdrop-filter: blur(20px) saturate(1.4);
  background-color: color-mix(in oklch, var(--color-panel-ice) 70%, transparent);
  border: 1px solid color-mix(in oklch, white 30%, transparent);
  border-radius: 16px;
}

/* Progressive enhancement: add displacement when filter supported */
/* Tested via JS capability check; adds class to <html> */
.lens-capable .lens-panel {
  filter: url(#lens-subtle);
  backdrop-filter: blur(10px) saturate(1.3);
  background-color: color-mix(in oklch, var(--color-panel-ice) 60%, transparent);
}
```

```js
// Lens capability detection — runs once on page load
(function detectLensCapport() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  const displacement = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap');
  filter.appendChild(displacement);
  svg.appendChild(filter);
  // If feDisplacementMap constructor returns HTMLUnknownElement, SVG filters are not supported
  if (displacement.constructor.name !== 'SVGFEDisplacementMapElement') return;
  document.documentElement.classList.add('lens-capable');
})();
```

**Graceful degradation:** In browsers without `feDisplacementMap` support, `.lens-panel` renders as standard glassmorphism: blur + tint + border. This is identical to `liquid-glass` style behavior — a correct and visually coherent fallback. Users without capable browsers receive the established glass aesthetic; users with capable browsers receive the lensing enhancement.

## Anti-Slop Rationale

**1. No pure `backdrop-filter: blur()` labeled as lensing.** Blur-only glass is glassmorphism — a style in the catalog since 2019. Applying blur and calling the result "lensing" or "glass refraction" is technically incorrect and visually indistinguishable from standard glassmorphism. The displacement map is not optional — it is the mechanism that distinguishes this style categorically. Any output that uses only `backdrop-filter` without `feDisplacementMap` is using the wrong style.

**2. No rgba overlays as a "glass" simulation.** A common AI-generated shortcut is `background: rgba(255, 255, 255, 0.2)` presented as glass. This is a translucent surface — it dims the background but does not displace it. Real glass bends light; rgba transparency only reduces it. The aesthetic difference is immediately apparent: rgba overlays produce a fogged-window effect; lensing produces a water-lens or crystal-prism effect where the background geometry visibly shifts position.

**3. No static displacement patterns.** If the `feDisplacementMap` is applied but the `scale` is fixed and never animated, the displacement reads as a texture or a distortion artifact, not as a liquid or optical phenomenon. The "liquid" in "liquid glass lensing" requires temporal variation — the pattern must breathe or shimmer, even subtly. A static `feDisplacementMap` at `scale="8"` with no animation is neither liquid nor glass — it is a warp filter. The animation is architecturally part of the style, not a decorative addition (with the exception of `prefers-reduced-motion: reduce` contexts, where static displacement is the appropriate fallback, not the default behavior).

## Accessibility

**Contrast challenge:** The displaced background creates locally variable contrast that standard APCA measurement cannot predict. The APCA Lc 60 minimum applies to the worst-case estimate — text over the lightest predicted displaced zone.

Practical mitigation: `text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6)` on all text in lens panels. This adds approximately Lc 15–20 of effective contrast to text over any background. Combined with near-white text on displaced backgrounds that include some dark content, APCA Lc 60 is achievable.

**Low-vision override:** `@media (prefers-contrast: more)` disables the lensing effect entirely and switches to a high-contrast solid panel:

```css
@media (prefers-contrast: more) {
  .lens-panel {
    filter: none;
    backdrop-filter: none;
    background-color: oklch(0.14 0 0); /* near-black solid */
    border: 2px solid oklch(0.98 0 0);
  }

  .lens-panel__text {
    color: oklch(0.98 0 0);
    text-shadow: none;
  }

  .lens-capable .lens-panel {
    filter: none; /* Override lens-capable enhancement */
  }
}
```

**Motion: reduced motion disables displacement animation.** The lens shimmer animation is controlled by the JS capability check which also checks `prefers-reduced-motion`. If `reduce` is set, `initLensShimmer()` does not call `requestAnimationFrame()`. The SVG filter remains in the DOM (for the static displacement) but the scale does not animate.

**Touch targets:** Minimum 44×44px. Glass panels often contain large hit areas by design — the lensing panel is typically a navigation bar or card, both of which have generous interactive areas.

**Screen reader:** SVG filter elements are not exposed in the accessibility tree. The `<svg>` element is positioned absolutely with `overflow: hidden` and carries no landmark role — it is treated as a presentational element by assistive technology. No ARIA attributes needed on the SVG itself.

## When to Use

- Premium consumer apps where the visual environment is rich (photography, video, gradient mesh) and the UI must layer without obscuring
- Creative agency portfolios and brand sites where optical sophistication is a differentiator
- Luxury product showcases where the glass-and-light metaphor reinforces brand positioning
- Navigation bars over hero video or photography — the lensing effect is most visible and valuable in this context
- Development tools with a premium design identity (e.g., creative SDKs, design tools, developer-facing products from design-focused companies)

## When NOT to Use

- Flat-color backgrounds — the displacement has nothing to displace; the effect is invisible or reads as a glitch
- Low-power device targets or accessibility-first contexts — `feDisplacementMap` is GPU-composited but still more expensive than `backdrop-filter` alone; test performance on minimum-spec devices before deployment
- Products where content legibility is the primary constraint (documentation, forms, data-heavy pages) — the variable contrast from displacement competes with the need for reliable readability
- Any context where `prefers-reduced-motion` users represent a significant audience segment — the static fallback loses the style's defining quality
- Browsers or contexts where the `@supports` fallback to glassmorphism would be considered visually inconsistent with the design intent
