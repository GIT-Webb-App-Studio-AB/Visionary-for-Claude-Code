---
id: white-futurism
category: graphic
motion_tier: Subtle
density: sparse
locale_fit: [all]
palette_tags: [light, editorial]
keywords: [white, futurism, apple, jony-ive, minimalism, clean, precision, product]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# White Futurism

**Category:** graphic
**Motion tier:** Subtle

The Jony-Ive-era Apple product page aesthetic, now widely imitated but rarely
executed well. References: apple.com product pages, Linear marketing, Vercel
product marketing, Arc browser landing, Raycast product site.

The aesthetic trap this style avoids: "white background + some blue + rounded
cards" — which is AI-slop territory and scores 2/10 on distinctiveness. Real
white-futurism is an exercise in restraint — a three-color palette, a single
display face, 1 px hairlines, and a *precise* motion language. When every
decoration is banished, the remaining elements must be perfect.

Compare with `dark-mode-first` (OLED-optimized inverse of this), `light-mode-
sanctuary` (warm cream, softer, wellness-adjacent), `dieter-rams` (ten
principles, beige not white, grey CTAs). White Futurism is *cold* restraint
with *one* hot accent.

## Typography

- **Display font:** **Geist** (Vercel, variable, technical-warm geometric) OR
  SF Pro Display (system fallback on Apple stack). Geist is preferred on web
  because SF Pro is licensing-restricted; Geist was designed to cover the same
  emotional register (precise, confident, warm enough to not feel cold)
- **Body font:** Geist Regular 16 px. Never paired with a second family —
  the single-voice restraint is load-bearing
- **Tracking:** display -0.02em (tight as Apple's headlines); body -0.005em
- **Leading:** display 1.05; body 1.5
- **Feature:** fluid `clamp()` type scale — headings breathe from 2 rem at
  375 px to 6 rem at 1440 px, but the character remains identical across
  breakpoints

## Colors

- **Background:** `#FFFFFF` (pure white — the non-negotiable). Secondary
  surfaces may use `#FAFAFA` but never `#F5F5F5` (too-grey) or `#FFF9F0`
  (too-warm; that's `light-mode-sanctuary`)
- **Primary text:** `#000000` (absolute black — the cold-restraint register
  justifies pure black here; contrast is aesthetic, not just accessibility)
- **Primary action:** `#0066FF` (one single clean electric blue — not Apple's
  `#0A84FF` which is cobalt, not Tailwind's `#3B82F6` which is generic.
  `#0066FF` is saturated but not neon, clean-UI blue). If the brand already
  has a non-blue primary, substitute that ONE color; never two accent colors
- **Elevation model:** 1px hairline borders + micro drop shadows:
  `box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)`.
  Two-layer shadow is load-bearing — a single shadow reads as Material Design
- **Forbidden:** gradients (any, including `color-mix` subtle ones), textures,
  glows, colored shadows, a second accent color, warm whites, off-blacks

## Motion

- **Tier:** Subtle
- **Spring tokens:** `{ bounce: 0, visualDuration: 0.22 }` — crisp, no overshoot.
  Any bounce reads as "playful", wrong register
- **Enter animation:** `@starting-style` with opacity 0 → 1 + 2 px translate-Y,
  200 ms cubic-bezier(0.16, 1, 0.3, 1). The 2 px (not 8, not 16) is the
  signature — anything more reads "slide-in", wrong aesthetic
- **Micro-interactions:** hover shifts background from `#FFFFFF` to `#FAFAFA`,
  lifts 1 px, borders darken from rgba(0,0,0,0.08) → rgba(0,0,0,0.12). Total
  effect is ~5 % perceived change — subliminal precision
- **Scroll-driven reveals:** use `animation-timeline: view()` with a 2 px
  translate + opacity ramp. Never parallax (that's `photography-portfolio` or
  `spatial-ar`)
- **Forbidden:** bounce, overshoot, colored glow on hover, scale > 1.02, any
  motion > 300 ms

## Spacing

- **Base grid:** 8 px — but every page-level margin is a multiple of 32.
  The large outer margin is what distinguishes this from generic AI-UI
- **Border-radius vocabulary:** 8–12 px on cards, 999px on pills, 6px on
  inputs. Consistency across the product is more important than any
  specific value
- **Whitespace:** 48 px+ between major sections. White Futurism breathes

## Code Pattern

```css
:root {
  --wf-bg: #FFFFFF;
  --wf-bg-2: #FAFAFA;
  --wf-text: #000000;
  --wf-border: oklch(0 0 0 / 0.08);
  --wf-border-hover: oklch(0 0 0 / 0.12);
  --wf-primary: #0066FF;
}

body {
  background: var(--wf-bg);
  color: var(--wf-text);
  font-family: 'Geist', ui-sans-serif, system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: -0.005em;
}

.wf-h1 {
  font-size: clamp(2rem, 2vw + 1.5rem, 6rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  font-weight: 500;
}

.wf-card {
  background: var(--wf-bg);
  border: 1px solid var(--wf-border);
  border-radius: 12px;
  padding: 32px;
  /* Two-layer shadow is load-bearing — don't simplify to one */
  box-shadow:
    0 1px 4px rgba(0, 0, 0, 0.06),
    0 4px 16px rgba(0, 0, 0, 0.04);
  transition:
    background 200ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 200ms ease,
    translate 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.wf-card:hover {
  background: var(--wf-bg-2);
  border-color: var(--wf-border-hover);
  translate: 0 -1px;
}

.wf-cta {
  background: var(--wf-primary);
  color: #FFFFFF;
  padding: 12px 28px;
  border-radius: 8px;
  font-weight: 500;
  letter-spacing: -0.005em;
  transition: filter 120ms linear;
}
.wf-cta:hover { filter: brightness(1.08); }

/* @starting-style entry — 2px translate, not 8 */
.wf-enter {
  transition: opacity 220ms ease-out, translate 220ms cubic-bezier(0.16, 1, 0.3, 1);
  opacity: 1; translate: 0 0;
}
@starting-style {
  .wf-enter { opacity: 0; translate: 0 2px; }
}

@media (prefers-reduced-motion: reduce) {
  .wf-card { transition: background 120ms linear, border-color 120ms linear; }
  .wf-card:hover { translate: 0; }
  @starting-style { .wf-enter { opacity: 0; translate: 0 0; } }
}
```

## Accessibility

### Contrast
`#000000` on `#FFFFFF` = 21:1 (AAA max). `#0066FF` on white = 4.7:1 (AA for
body-size; safe for large/CTA). Pair primary action with white text (21:1 on
blue). APCA Lc ≥ 95 on body.

### Focus
`:focus-visible` as 3 px `#0066FF` outline, 3 px offset. Honors
`forced-colors` by falling back to `AccentColor`. The single-accent palette
makes the focus ring immediately recognizable.

### Motion
2 px translate is below the vestibular-trigger threshold, but still honors
`prefers-reduced-motion: reduce` by dropping to zero. Two-layer shadow never
animates (would require compositor repaint).

### Touch target
44×44 default. The large `clamp()` type keeps buttons comfortable at all
viewport sizes.

### RTL / Logical properties
Full logical (`inset-inline`, `margin-inline`, etc). Geist covers Latin +
Cyrillic + Greek; for CJK substitute Noto Sans JP/KR/SC; for Arabic
substitute Noto Kufi Arabic to match the geometric-modernist voice.

## Slop Watch

- A second accent color breaks the monastic restraint — if the brief needs
  two accents, this isn't the right style; consider `bauhaus` or
  `dieter-rams`
- Any gradient, even 2-stop subtle ones, reads as AI-slop — banned
- Warm whites (`#FAFAF0`, `#FFFDF5`) break the cold-restraint; that's
  `light-mode-sanctuary`
- Drop shadow with colored tint = wrong register; grey micro-shadow only
- Poppins or Inter as display = immediate fail; Geist / SF Pro only
- Scale > 1.02 on hover = bouncy; that's `neobank-consumer` not this style
- Glow effects on primary action = fail; color shift + 1 px lift only
- 8px micro-margins instead of 32+ outer margins = tight layout, wrong style
