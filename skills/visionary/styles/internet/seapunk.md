---
id: seapunk
category: internet
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, neon, pastel, editorial, organic]
keywords: [seapunk, internet]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Seapunk

**Category:** internet
**Motion tier:** Expressive

## Typography
- **Display font:** Courier New Bold — typewriter meets early internet; the monospace grid of Courier New evokes dial-up terminal screens, and Bold weight keeps legibility on deep teal-black without requiring glow. It is the font of pre-aestheticized internet, before taste was imported.
- **Body font:** Courier New (regular weight, lowercase enforced) — subcultural authenticity demands a single typeface family; Press Start 2P is acceptable for accent labels only when 8-bit pixel rendering is intentional.
- **Tracking:** 0.08em (loose, hand-typed feeling) | **Leading:** 1.7 (aquatic drift, text breathes like water)

## Colors
- **Background:** #0D3B4A — deep teal-black ocean floor; not pure black (too goth) and not navy (too corporate); this specific hex carries the bioluminescent darkness of deep water
- **Primary action:** dark turquoise #00CED1 — the color of shallow reef water under overcast sky; saturated enough to read as color, dark enough to avoid neon-vaporwave drift
- **Accent:** #FF6B8A — coral pink; the organic warmth of sea life against cold ocean; direct complement to the teal axis without being hot pink (which would tip into synthwave territory)
- **Elevation model:** none — flat with aquatic color layering; depth is expressed through rgba teal overlays of increasing opacity, not drop shadows; shadows imply air and gravity; seapunk is underwater

## Motion
- **Tier:** Expressive
- **Spring tokens:** `--spring-tide-in: cubic-bezier(0.22, 1.0, 0.36, 1.0) 600ms` (slow deceleration like water drag), `--spring-bob: cubic-bezier(0.34, 1.56, 0.64, 1.0) 400ms` (slight overshoot, buoyancy)
- **Enter animation:** `tide-in` — elements translate from `translateY(32px)` to `translateY(0)` with simultaneous opacity 0→1 over 600ms using `--spring-tide-in`; evokes washing ashore, not falling; the upward drift from below is non-negotiable
- **Forbidden:** drop-shadows (implies air/gravity), bounce easing with >20% overshoot (too energetic for tidal rhythm), translateX entrance (lateral is wrong — seapunk arrives from below the surface), any easing faster than 350ms

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** cards: 0px (flat, rough like sea glass edges); buttons: 2px (minimal, not softened); inputs: 0px; modals: 0px; image frames: 0px — seapunk is pre-border-radius-era internet; roundness is a post-2012 refinement that betrays subcultural roughness

## Code Pattern
```css
/* Seapunk base surface */
.seapunk-surface {
  background: linear-gradient(
    180deg,
    #0D3B4A 0%,
    #0A2E3A 40%,
    #061E26 100%
  );
  min-height: 100vh;
  font-family: "Courier New", Courier, monospace;
  color: #00CED1;
}

/* Enforce lowercase — seapunk is lowercase-native */
.seapunk-surface h1,
.seapunk-surface h2,
.seapunk-surface h3,
.seapunk-surface h4 {
  text-transform: lowercase;
  font-weight: 700;
  letter-spacing: 0.08em;
}

/* Aquatic card with teal rgba border */
.seapunk-card {
  background: rgba(0, 206, 209, 0.06);
  border: 1px solid rgba(0, 206, 209, 0.30);
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.seapunk-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(0, 206, 209, 0.04) 0%,
    transparent 60%
  );
  pointer-events: none;
}

/* Aquatic shimmer keyframe */
@keyframes aquatic-shimmer {
  0%   { opacity: 0.4; transform: translateX(-100%) skewX(-15deg); }
  100% { opacity: 0;   transform: translateX(200%) skewX(-15deg); }
}

.seapunk-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 206, 209, 0.12) 50%,
    transparent 100%
  );
  animation: aquatic-shimmer 4s cubic-bezier(0.22, 1.0, 0.36, 1.0) infinite;
}

/* Tide-in entrance */
@keyframes tide-in {
  from {
    opacity: 0;
    transform: translateY(32px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.seapunk-enter {
  animation: tide-in 600ms cubic-bezier(0.22, 1.0, 0.36, 1.0) both;
}

/* Coral accent */
.seapunk-accent {
  color: #FF6B8A;
}

/* Links — stay in palette */
.seapunk-surface a {
  color: #00CED1;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.seapunk-surface a:hover {
  color: #FF6B8A;
  transition: color 200ms ease;
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
- **Using seafoam green (#98FF98 or similar) instead of dark turquoise:** Seafoam green reads as pastel spring; seapunk's teal-cyan palette derives from deep ocean water and bioluminescence, not garden color. #00CED1 carries visual weight; seafoam floats and destroys the oceanic darkness the entire aesthetic depends on.
- **Adding border-radius or polish to smooth subcultural roughness:** Seapunk emerged on Tumblr in 2011 before CSS border-radius was standard practice in subcultures. Rounded corners signal post-2015 design taste and Material Design influence. The aesthetic requires raw, slightly broken-looking geometry — its roughness is the authenticity signal, not a bug to fix.
