---
id: synthwave
category: internet
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, neon, pastel]
keywords: [synthwave, internet]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Synthwave

**Category:** internet
**Motion tier:** Kinetic

## Typography
- **Display font:** Azonix (first priority), fallback Orbitron 700 — Azonix has geometric letterforms with slightly wider strokes and distinct A/V cuts that read as authentic 1980s sci-fi titling; Orbitron alone is widely overused to the point of becoming a cliché shorthand; specifying Azonix first signals informed aesthetic intent vs. generic synthwave pastiche
- **Body font:** Share Tech Mono — terminal monospace that complements the grid-and-horizon visual language; Courier is too antiquarian, regular sans too neutral; Share Tech Mono carries digital-instrument energy
- **Tracking:** 0.12em (wide, neon sign letter-spacing) | **Leading:** 1.5 (tight enough for intensity, loose enough for readability against dark backgrounds)

## Colors
- **Background:** #0D0221 — THE canonical synthwave purple-black; not pure black (#000000, too flat), not dark purple (#1A0033, too saturated); this specific hex sits at the exact point where purple-black reads as night sky with atmosphere rather than void or grape
- **Primary action:** hot pink #FF00A0 — pure magenta-shifted pink; the color of neon bar signs on wet asphalt; not coral (too warm), not rose (too soft), not magenta (#FF00FF, too pure/RGB-synthetic); #FF00A0 has the slight warm-shift that makes it feel like neon gas rather than screen pixel
- **Accent:** #00F0FF — electric cyan; near-pure cyan shifted slightly warm to prevent pure RGB feeling; pairs with hot pink on the complementary axis; reads as CRT phosphor glow
- **Elevation model:** glows only — no box-shadows with dark offsets; depth is created entirely through neon bloom/glow via `text-shadow`, `box-shadow: 0 0 Npx color` (light radiating outward); the further from viewer, the less glow intensity — glow is the synthwave z-axis

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `--spring-horizon: cubic-bezier(0.16, 1.0, 0.3, 1.0) 500ms` (fast deceleration, like cresting a hill), `--spring-neon-flicker: steps(1) 80ms` (instant on/off for neon sign stutter effect)
- **Enter animation:** `horizon-rise` — elements translate from `translateY(48px) perspective(800px) rotateX(8deg)` to final position, flattening perspective as they arrive; simulates driving toward an object on the horizon grid; combined with opacity 0→1 over 500ms; the perspective flatten is what distinguishes this from generic slide-up
- **Forbidden:** any easing slower than 500ms (lethargy kills synthwave energy), blur-based transitions (blur is vaporwave's tool — synthwave is sharp and fast), ease-in (decelerating from nothing — synthwave always arrives with momentum), any shadow that isn't a glow

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** cards: 0px (hard chrome edges, machine-cut); buttons: 2px (minimal bevel suggestion); inputs: 0px (terminal style); the sun/horizon decorative elements: 50% (the sun is the only circle); headings: never rounded; synthwave geometry is angular — roundness breaks the chrome-and-neon aesthetic

## Code Pattern
```css
/* Synthwave background with radial atmospheric glow */
.synthwave-bg {
  background:
    radial-gradient(ellipse 80% 50% at 50% 90%, rgba(255, 0, 160, 0.18) 0%, transparent 70%),
    radial-gradient(ellipse 60% 40% at 50% 90%, rgba(0, 240, 255, 0.10) 0%, transparent 60%),
    #0D0221;
  min-height: 100vh;
  overflow: hidden;
  position: relative;
}

/* Perspective grid floor */
.synthwave-grid {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) perspective(400px) rotateX(70deg);
  width: 200%;
  height: 60%;
  background-image:
    linear-gradient(to right, rgba(255, 0, 160, 0.4) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 0, 160, 0.4) 1px, transparent 1px);
  background-size: 60px 40px;
  transform-origin: bottom center;
}

/* Retro sun with stripe gradient */
.synthwave-sun {
  width: 280px;
  height: 140px;
  border-radius: 140px 140px 0 0;
  background: linear-gradient(
    to bottom,
    #FF00A0 0%,
    #FF00A0 20%,
    #0D0221 20%,
    #0D0221 26%,
    #FF00A0 26%,
    #FF00A0 38%,
    #0D0221 38%,
    #0D0221 46%,
    #FF00A0 46%,
    #FF00A0 56%,
    #0D0221 56%,
    #0D0221 62%,
    #FF00A0 62%,
    #FF00A0 100%
  );
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* Neon heading with layered text-shadow bloom */
.synthwave-heading {
  font-family: "Azonix", "Orbitron", sans-serif;
  font-weight: 700;
  color: #00F0FF;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-shadow:
    0 0 7px  #00F0FF,
    0 0 14px #00F0FF,
    0 0 30px rgba(0, 240, 255, 0.6),
    0 0 60px rgba(0, 240, 255, 0.3),
    0 0 4px  #FF00A0;
}

/* Horizon-rise entrance animation */
@keyframes horizon-rise {
  from {
    opacity: 0;
    transform: translateY(48px) perspective(800px) rotateX(8deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) perspective(800px) rotateX(0deg);
  }
}

.synthwave-enter {
  animation: horizon-rise 500ms cubic-bezier(0.16, 1.0, 0.3, 1.0) both;
}

/* Glow-only elevation for cards */
.synthwave-card {
  background: rgba(13, 2, 33, 0.85);
  border: 1px solid rgba(255, 0, 160, 0.5);
  box-shadow:
    0 0 12px rgba(255, 0, 160, 0.25),
    0 0 40px rgba(255, 0, 160, 0.10),
    inset 0 0 20px rgba(0, 240, 255, 0.04);
  padding: 24px;
}
```

## Accessibility

### Contrast
Body text must clear 4.5:1 (WCAG 2.2 AA) AND APCA Lc ≥ 75. Large text / UI labels: 3:1 and Lc ≥ 60. Run axe-core + apca-w3 during the critique loop.

### Focus
Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.

### Motion
This style exposes motion that can run longer than 5 seconds. Ship a visible pause/stop control bound to `animation-play-state` (CSS) or the JS equivalent — required by WCAG 2.2.2 (Level A). Also degrade to opacity-only transitions under `prefers-reduced-motion: reduce`.

### Touch target
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
- **Confusing synthwave with vaporwave or outrun:** These are three distinct aesthetics. Vaporwave (#FF71CE, #01CDFE, #05FFA1) is pastel, glitchy, and consumerist-ironic. Outrun (#FF6B35, #F7931E) is orange-dominated and speed-obsessed. Synthwave is the purple-black night-drive palette with pink/cyan neon. Applying vaporwave pastels to a synthwave layout produces neither aesthetic and reveals unfamiliarity with the source material.
- **Using blur or glow-blur transitions (e.g., `filter: blur()` transitions) instead of crisp neon glow:** Synthwave glow is achieved via `text-shadow` and `box-shadow` with zero blur on the inner layer and radiating softness on outer layers. CSS `filter: blur()` creates a photographic soft-focus that reads as dream or haze — vaporwave or dreamcore territory. Synthwave neon is sharp at center, bleeding outward — not uniformly blurred.
