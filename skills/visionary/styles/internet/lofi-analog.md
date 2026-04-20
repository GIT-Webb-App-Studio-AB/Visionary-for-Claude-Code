---
id: lofi-analog
category: internet
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, pastel, earth, editorial]
keywords: [lofi, analog, internet]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Lo-Fi Analog

**Category:** internet
**Motion tier:** Subtle

## Typography
- **Display font:** Special Elite — designed to simulate typewriter ink variance, with letterforms that appear to have been struck with uneven pressure on an aging ribbon; the ink-fill variation is built into the glyph design rather than simulated through CSS, giving it authentic mechanical texture that generic serif fonts cannot replicate
- **Body font:** Courier Prime — the definitive typewriter font for screen rendering; not Courier New (too thin, optimized for print), not American Typewriter (too clean); Courier Prime was specifically redesigned for high legibility at screen resolutions while preserving the typewriter mechanical spacing and ink pooling at stroke terminals; non-negotiable for the aesthetic
- **Tracking:** 0.04em (restrained, like worn typewriter keys not fully rebounding) | **Leading:** 1.8 (cassette liner note spacing, room for the eye to drift between lines)

## Colors
- **Background:** #F5EFE0 — warm cream aged paper; not white (#FFFFFF, too digital clean), not tan (#D2B48C, too saturated); this specific hex sits at the intersection of aged newsprint and ambient room light on cream stationery, carrying analog warmth without simulating sepia directly
- **Primary action:** aged amber #8B6914 — the color of ink that has oxidized over years on stored paper; functions as text and interactive color; not gold (too precious), not brown (too neutral); this amber reads as intentionally aged without being distressed
- **Accent:** #C5473C — faded red film; the specific desaturation of red that has been exposed to UV over decades, like old film posters or 1970s paperback cover art; not tomato red (too fresh), not brick (too architectural)
- **Elevation model:** none — depth from grain texture overlay only; a CSS SVG noise filter or `background-image` SVG grain sits over all surfaces; cards and sections are differentiated by grain density variation rather than shadows or borders; shadows imply clean surfaces, which analog photography and paper never have

## Motion
- **Tier:** Subtle
- **Spring tokens:** `--spring-dissolve: ease 800ms` (no spring physics — analog transitions are film dissolves, not spring-loaded mechanisms), `--spring-slow-fade: ease-in-out 1000ms` (the extra 200ms models light leaking onto film rather than instant toggle)
- **Enter animation:** `film-grain-dissolve` — opacity 0 to 1 over 800ms with simultaneous application of `filter: contrast(0.8) blur(0.3px)` dissolving to `filter: contrast(1) blur(0px)`; the brief contrast-and-blur-reduction mimics film developing; no transform movement whatsoever — analog transitions are chemical, not physical
- **Forbidden:** snappy transitions under 400ms (the speed of digital perfection destroys analog feeling), saturated color fills or gradients (anything over ~40% saturation reads as digital), scale transforms or translate entrances (movement = digital UI; lo-fi dissolves only), box-shadows with dark offsets (implies clean surfaces)

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** cards: 0px (paper has square corners); buttons: 1px (almost square, with the tiniest softening of a rubber stamp edge); inputs: 0px; images: 0px (photo prints have hard corners); blockquotes: 0px; the 1996 web rule applies — roundness is a digital-age design choice that analog refuses

## Code Pattern
```css
/* SVG grain texture as data URI for lo-fi surface */
.lofi-surface {
  background-color: #F5EFE0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23grain)' opacity='0.08'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 200px 200px;
  font-family: "Courier Prime", "Courier New", Courier, monospace;
  color: #8B6914;
  min-height: 100vh;
  position: relative;
}

/* Vignette overlay via pseudo-element */
.lofi-surface::after {
  content: "";
  position: fixed;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 50%,
    rgba(30, 18, 6, 0.45) 100%
  );
  pointer-events: none;
  z-index: 9999;
}

/* Lo-fi card with sepia filter */
.lofi-card {
  background: rgba(245, 239, 224, 0.9);
  border: 1px solid rgba(139, 105, 20, 0.25);
  padding: 24px 28px;
  filter: sepia(0.12) contrast(0.95);
  position: relative;
}

/* Typewriter heading — Special Elite non-negotiable */
.lofi-heading {
  font-family: "Special Elite", "Courier New", monospace;
  font-weight: 400;
  font-size: 1.8rem;
  line-height: 1.4;
  letter-spacing: 0.04em;
  color: #8B6914;
  margin-bottom: 1rem;
}

/* Body copy — Courier Prime */
.lofi-body {
  font-family: "Courier Prime", "Courier New", Courier, monospace;
  font-size: 1rem;
  line-height: 1.8;
  color: #5A4510;
}

/* Film grain dissolve entrance */
@keyframes film-grain-dissolve {
  from {
    opacity: 0;
    filter: contrast(0.8) blur(0.3px);
  }
  to {
    opacity: 1;
    filter: contrast(1) blur(0px);
  }
}

.lofi-enter {
  animation: film-grain-dissolve 800ms ease both;
}

/* Accent — faded red film for highlights */
.lofi-accent {
  color: #C5473C;
}

/* Horizontal rule — typewriter dash row */
.lofi-divider {
  border: none;
  border-top: 1px solid rgba(139, 105, 20, 0.30);
  margin: 2rem 0;
}
```

## Accessibility

### Contrast
Body text must clear 4.5:1 (WCAG 2.2 AA) AND APCA Lc ≥ 75. Large text / UI labels: 3:1 and Lc ≥ 60. Run axe-core + apca-w3 during the critique loop.

### Focus
Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.

### Motion
Under `prefers-reduced-motion: reduce`, keep opacity transitions but drop transform/scale/translate — transform is a vestibular trigger. No autoplay exceeds 5 s without a pause control.

### Touch target
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
- **Using snappy transitions or transforms under 400ms:** The lo-fi aesthetic is built on slowness — slow chemical film processes, slow tape rewind, slow analog warmup. Any transition under 400ms immediately reads as digital UI behavior and breaks the illusion. Snappiness signals precision engineering; lo-fi signals imprecision, drift, and warmth. Even hover states should ease slowly.
- **Using clean vector aesthetics or fully saturated colors:** Lo-fi analog is defined by imperfection — grain, age, fading. Saturated fills (#FF0000, pure CSS colors, gradients at full chroma) read as modern digital design and destroy the aged-media illusion. Colors should be desaturated by at least 30-40% from their pure hue, and any graphic elements should carry the grain texture rather than appearing as clean, crisp shapes.
