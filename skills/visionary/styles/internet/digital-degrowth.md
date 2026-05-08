---
id: digital-degrowth
category: internet
motion_tier: Static
density: balanced
locale_fit: [all]
palette_tags: [minimal, ethical, high-contrast, monochrome]
keywords: [degrowth, low-tech, carbon, sustainable, static-first, performance, ethical-design]
accessibility:
  contrast_floor_apca: 75
  touch_target_px: 44
  reduced_motion: no-op
scoring_hints:
  product_archetypes: [non-profit, editorial, developer-tools]
  audience_density: [balanced]
  brand_tones: [neutral, warm]
---

# Digital Degrowth

**Category:** internet
**Motion tier:** Static (tier 0) by default; tier 1 at explicit opt-in

## Ethical Position

Digital Degrowth is not a moodboard aesthetic. It is an infrastructure claim made visible through design decisions. The premise is that most web design is a form of resource extraction: custom fonts are served from CDNs that consume power; background videos auto-play for users who did not ask for them; JavaScript bundles initialize analytics scripts before the user has read the first sentence. This style refuses each of those defaults and makes the refusal visible.

The CO₂ badge in the footer is not decorative. It is computed at runtime from the Resource Timing API against the Sustainable Web Design Model v4 (SWDM4) baseline and displayed in a `<footer>` element using monospace system font. The number will be different on every page — it is a measurement, not a marketing claim. When the number goes up because someone added an image without compressing it, the badge changes. This is accountability made typographic.

The style's reference community includes Low-Tech Magazine (Barcelona/online, solar-powered server, publishes uptime as editorial content), Solar Protocol (art/science project documenting when servers run on sunlight), Branch Magazine (quarterly publication on sustainable internet), and the 1MB Club (curated list of websites under 1 megabyte). These are not aesthetic references — they are existence proofs that the constraint is achievable.

## Palette

Maximum three colors total across the entire product. No exceptions. No "just for this component" gradient. No "the brand blue requires this specific opacity." Three.

Default configuration:
- **Background:** `oklch(1.0 0 0)` — pure white `#FFFFFF`
- **Foreground:** `oklch(0.0 0 0)` — pure black `#000000`
- **Single accent:** choose one of:
  - Forest `oklch(0.30 0.09 155)` — approx `#1B4332` — APCA Lc on white ≈ 89
  - Oxblood `oklch(0.28 0.10 23)` — approx `#6B0F1A` — APCA Lc on white ≈ 89
  - Slate `oklch(0.32 0.05 255)` — approx `#2B3A52` — APCA Lc on white ≈ 86

All three accent options clear APCA Lc 75 minimum. APCA Lc 75 is a strong recommendation for body text; Lc 89 is near-AAA territory. The high contrast is a structural consequence of palette discipline, not an additional accessibility effort.

```css
:root {
  --color-bg:      oklch(1.0  0     0);
  --color-fg:      oklch(0.0  0     0);
  --color-accent:  oklch(0.30 0.09 155); /* forest — swap as needed */
}

/* Zero tolerance for rgba transparency over any colored surface */
/* Zero tolerance for gradient of any kind */
```

## Typography

No custom font loading. No `@font-face`. No Google Fonts `<link>`. No variable font with a 200KB WOFF2 payload. The system stack is the entire font specification.

**Body:**
```css
body {
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen,
    Ubuntu,
    Cantarell,
    'Helvetica Neue',
    sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-fg);
  background-color: var(--color-bg);
}
```

Rationale: Every font listed exists natively on the target platform. The download payload for typography is 0 bytes. FOIT (Flash of Invisible Text) and FOUT (Flash of Unstyled Text) are structurally impossible when there is nothing to download. On macOS, this renders in San Francisco. On Windows, Segoe UI. On Linux, the user's configured UI font. The differences are acceptable: visual consistency across platforms is a luxury that costs bandwidth, which costs carbon.

**Metadata and code (monospace):**
```css
code, pre, .meta, .performance-badge, time, .byline {
  font-family:
    ui-monospace,
    'SFMono-Regular',
    'SF Mono',
    Menlo,
    Consolas,
    'Liberation Mono',
    monospace;
  font-size: 0.875rem;
}
```

Rationale: Monospace metadata creates a visual tier between prose and system information. The CO₂ badge, page weight display, publication timestamps, and author bylines use monospace to signal "this is measured data" rather than "this is editorial content."

## Visuals

**Photographs:** If a photograph is unavoidable, it must be:
- Under 50KB file size
- AVIF or WebP format (no JPEG, no PNG for photography)
- Maximum 800px wide source image
- Loaded with `loading="lazy"` and explicit `width`/`height` attributes to prevent layout shift

**Preferred alternative to photography:** Dithered SVG. The Atkinson dithering algorithm (developed by Apple engineer Bill Atkinson for the original Macintosh) converts photographic tonal range to 1-bit black-and-white using an error-diffusion pattern. This produces images that are aesthetically distinctive, structurally simple, and compressible to a fraction of the photographic original. Applied to SVG via `<feComponentTransfer>` + threshold functions, the result requires no image file at all — it is computed CSS.

```css
.atkinson-dither {
  filter:
    grayscale(1)
    contrast(4)
    brightness(0.9);
  image-rendering: pixelated;
}
```

This CSS-only approximation loses some dithering precision compared to server-side Atkinson processing, but produces the correct aesthetic signal at zero payload cost.

## Motion

**Default: Static (tier 0).** No animations. No transitions. No `@keyframes`. No JavaScript animation libraries. No Web Animations API calls.

State changes are instant: checkboxes check, accordions open, modals appear. This is how the web worked before CSS transitions were added in 2009. It is still how the web works on slow connections and low-power devices, which is the majority of global internet access outside of wealthy urban markets.

**Opt-in tier 1:** When `prefers-reduced-motion: no-preference` is detected AND the page has a `.motion-opt-in` class applied by JavaScript after user interaction, the following limited motion is permitted:
- Native `<details>` / `<summary>` toggle (browser-native, no JS)
- Native `<dialog>` show/close (browser-native, no JS)
- `transition: opacity 200ms linear` on interactive state changes

No spring physics. No scroll animations. No intersection observer-triggered entries. No `.animate()` API calls.

```css
/* Motion only when user has not requested reduction AND page has opt-in */
@media (prefers-reduced-motion: no-preference) {
  .motion-opt-in details[open] summary ~ * {
    animation: reveal 200ms linear;
  }

  @keyframes reveal {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
}

/* Default: instant, always */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Performance Claims

The CO₂ badge is not optional in this style. It is required in `<footer>` and must display two values:

1. **Page weight** — computed from `window.performance.getEntriesByType('resource')` summing `transferSize` across all resources
2. **CO₂ per visit estimate** — computed using SWDM4: `transferSize_bytes / 1024 / 1024 * 0.553` grams CO₂e (0.553 g/MB is the SWDM4 system-level constant for 2025 grid intensity)

Target values for a canonical digital-degrowth page:
- **Page weight:** under 50 KB total (HTML + CSS + zero custom fonts + minimal images)
- **CO₂ per visit:** under 0.03 g CO₂e per page view

The Low-Tech Magazine website (solar.lowtechmagazine.com) achieves 0.024 g CO₂ per visit at approximately 32 KB page weight. That is the reference implementation. It is not aspirational — it is achieved production.

```html
<!-- Required footer element -->
<footer class="performance-footer">
  <span class="performance-badge">
    Page weight: <output id="page-weight">calculating…</output> KB
    · Estimated CO₂: <output id="co2-estimate">calculating…</output> g per visit
  </span>
</footer>
```

```js
// Minimal performance badge — no framework, no library
window.addEventListener('load', () => {
  const entries = performance.getEntriesByType('resource');
  const bytes = entries.reduce((sum, e) => sum + (e.transferSize || 0), 0);
  const kb = (bytes / 1024).toFixed(1);
  const co2 = (bytes / 1024 / 1024 * 0.553).toFixed(3);
  document.getElementById('page-weight').textContent = kb;
  document.getElementById('co2-estimate').textContent = co2;
});
```

## Anti-Slop Rationale

**1. No custom fonts.** Every slop-tool default includes `font-family: 'Inter', sans-serif` with a Google Fonts import. Inter is an excellent typeface. It is also the single most overused typeface in AI-generated web design. Digital Degrowth prohibits all custom font loading categorically — not to avoid Inter specifically, but because any font-fetch is a performance and infrastructure claim the style refuses to make. The system stack result is browser-specific, slightly different across platforms, and impossible to perfectly reproduce in a generative mockup — which is precisely the point.

**2. No gradients or blur.** The two most common tells in AI-generated web design are `background: linear-gradient(135deg, #667eea, #764ba2)` and `backdrop-filter: blur(20px)`. Both are computationally expensive. Both are visually inert at the level of information transmission. Digital Degrowth prohibits both completely. A surface is either the background color or the foreground color. There is no third option. This constraint is so strict that most generative tools cannot comply with it — they have learned from corpora where gradients are ubiquitous.

**3. No loading spinners exceeding 3 frames.** If a page requires a spinner, the page is too heavy for this style. A 47 KB HTML document with system fonts loads in under 100ms on a 4G connection and under 500ms on a 3G connection — no spinner is needed. A spinner is evidence of a performance problem that the style's weight budget prohibits. The 3-frame limit applies to the rare case where server-side computation (search results, form submission) genuinely requires a wait state; even then, the spinner must be CSS-only and stop at the 3-frame keyframe cycle.

## Cultural References

- **Low-Tech Magazine** (lowtechmagazine.com / solar.lowtechmagazine.com) — The solar-powered version of the site publishes its server uptime and battery percentage as editorial content. The aesthetic — dithered images, system fonts, minimal JavaScript — emerged from genuine performance constraint, not from design choice. It is the existence proof of this style's viability.
- **Branch Magazine** (branch.climateaction.tech) — Quarterly magazine about sustainable internet that renders differently depending on the carbon intensity of the user's local grid at access time. A high-carbon grid gets a lower-fidelity version. This is infrastructure-as-design.
- **Solar Protocol** (solarprotocol.net) — Art/science project by Tega Brain, Alex Nathanson, and Benedetta Piantella. A network of solar-powered servers where the "active" server at any moment is whichever has the most solar energy. The homepage renders from whichever server is currently most sustainable.
- **1MB Club** (1mb.club) — Curated collection of websites under 1 megabyte. The bar for this style is lower: under 50KB.

## Accessibility

High contrast is a structural consequence of palette discipline, not an extra effort:

- Pure black on pure white: APCA Lc = 106 — exceeds AAA
- Forest accent on white: APCA Lc ≈ 89 — strong AA+
- Oxblood accent on white: APCA Lc ≈ 89 — strong AA+

`prefers-contrast: more` requires no additional work — the palette already delivers maximum contrast. `forced-colors` mode (Windows High Contrast) requires no override — system colors are semantically applied throughout.

Focus: `:focus-visible` with `outline: 2px solid var(--color-accent); outline-offset: 2px`. No custom focus styles that defeat the browser default.

Touch targets: Minimum 44×44px. The style's sparse layout naturally creates large tap areas — a navigation link spanning full column width, a `<details>` summary spanning full width, form controls with generous padding. Inline prose links are exempt.

RTL: CSS logical properties throughout. The system font stack supports Arabic, Hebrew, and other RTL scripts natively.

## When to Use

- Non-profits whose primary audience includes people in emerging markets with slow or metered connections
- Editorial publications that make their environmental position a brand attribute
- Developer tools targeting an audience that values performance transparency
- Personal websites, blogs, and portfolios where the author explicitly identifies with degrowth or low-tech values
- Protest, advocacy, and movement-building sites where the infrastructure is the message

## When NOT to Use

- E-commerce requiring rich product photography (50KB image budget is incompatible with photography-first retail)
- Consumer products whose brand positioning requires visual richness or premium surface treatment
- Products requiring animated data visualization or interactive charting (the motion prohibition applies here)
- Platforms where consistent cross-platform typography is a hard requirement (system font variation is a feature of this style, not a bug — if variation is unacceptable, this style is wrong)
- SaaS products competing on visual quality in market categories where design differentiates (this style signals values, not polish)
