---
id: kinetic-typography-v2
category: typography
motion_tier: Kinetic
density: sparse
locale_fit: [all]
palette_tags: [light, dark]
keywords: [kinetic, typography, scroll-linked, motion-v12, animation-timeline, variable-font]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Kinetic Typography v2

**Category:** typography
**Motion tier:** Kinetic

The 2026 iteration of kinetic-type — built on Motion v12 scroll-linked
springs AND CSS `animation-timeline: scroll()` / `view()`, not the
IntersectionObserver + `requestAnimationFrame` hacks the v1 style relied
on. References: Apple product pages (WWDC site), Linear changelog, Vercel
blog scroll-effects, Emil Kowalski's Motion tutorials.

Differs from `kinetic-type` (the v1 letters-dance style) by using **scroll
position as the timeline**, not auto-playing animation. User scrolling IS
the animation.

## Typography

- **Display font:** **variable font required** — Inter Tight (wght/wdth axes),
  Roboto Flex, Recursive, or Bricolage Grotesque 2. Non-variable fonts can
  still work but lose the axis-animation signature
- **Body font:** same family, regular weight — single voice
- **Tracking:** animates from 0 → -0.02em as headlines enter viewport
- **Feature:** per-character stagger via `clip-path` or `mask-image` — letters
  reveal from bottom-up as they scroll into view

## Colors

- **Background:** `#FFFFFF` or `#0A0A0A` (pure, no gradient — the type IS the
  star)
- **Foreground:** `#0A0A0A` on white, `#FFFFFF` on black. Contrast is
  load-bearing — kinetic type fails on low-contrast palettes
- **Accent:** single hue, used on one character or word per headline to
  create a focal point during scroll

## Motion

- **Tier:** Kinetic
- **Spring tokens:** `{ bounce: 0.2, visualDuration: 0.4 }` for any JS-driven
  motion
- **Primary motion:** CSS `animation-timeline: view()` — keyframes tied to
  the element's position in the viewport, no JS needed
- **Variable-axis sweep:** as the headline crosses the fold, `wght` axis
  animates from 400 → 900 and `wdth` from 100 → 85. Renders ultra-smooth on
  any browser that supports animation-timeline
- **Pause control MANDATORY:** any autoplay > 5 s requires a visible
  pause/stop control. A small `◼` button in the bottom-right that toggles
  all `animation-play-state` is the convention

## Spacing

- **Base grid:** 8 px
- **Border-radius:** N/A — type has no radius
- **Density:** intentionally sparse. Kinetic typography demands empty space
  for the motion to breathe

## Code Pattern

```css
/* Scroll-timeline kinetic headline — zero JS */
.k-headline {
  font-family: 'Inter Tight', system-ui, sans-serif;
  font-size: clamp(3rem, 8vw, 9rem);
  font-variation-settings: "wght" 400, "wdth" 100;
  line-height: 1;
  letter-spacing: 0;
  color: #0A0A0A;
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 10% cover 50%;
}
@keyframes reveal {
  from {
    font-variation-settings: "wght" 400, "wdth" 100;
    letter-spacing: 0;
    opacity: 0;
  }
  to {
    font-variation-settings: "wght" 900, "wdth" 85;
    letter-spacing: -0.02em;
    opacity: 1;
  }
}

/* Per-character reveal using clip-path */
.k-character {
  display: inline-block;
  clip-path: inset(100% 0 0 0);
  animation: reveal-char linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 30%;
}
@keyframes reveal-char { to { clip-path: inset(0 0 0 0); } }

/* WCAG 2.2.2 — pause control for long-running scroll-timeline animations */
.k-pause-control {
  position: fixed;
  inset-block-end: 24px;
  inset-inline-end: 24px;
  padding: 10px 16px;
  background: #0A0A0A;
  color: #FFFFFF;
  border: 0;
  border-radius: 999px;
  font-size: 12px;
}
body[data-motion-paused="true"] * {
  animation-play-state: paused !important;
}

@media (prefers-reduced-motion: reduce) {
  .k-headline, .k-character {
    animation: none;
    font-variation-settings: "wght" 700;
    opacity: 1;
    clip-path: none;
  }
}
```

## Accessibility

### Contrast
Pure black on pure white (or inverse) = 21:1 AAA. No compromise.

### Focus
3 px `AccentColor` outline — kinetic motion never replaces focus indicators.

### Motion
WCAG 2.2.2 pause control REQUIRED (not optional). Under
`prefers-reduced-motion: reduce`, all animations halt and type settles to
its final state immediately. Scroll-timeline animations are less vestibular-
triggering than auto-playing ones (user drives pacing), but the pause
control is still mandatory for WCAG conformance.

### Touch target
44×44 default including the pause control.

### RTL / Logical properties
Fully logical. Variable-font axis animations work identically in RTL. The
per-character reveal direction flips automatically via `writing-mode`.

## Slop Watch

- Auto-playing kinetic animation = `kinetic-type` v1 register, not v2.
  Scroll-linked is the point
- Gradients behind headlines = breaks the type-as-star premise
- Multi-accent palettes = too busy; one hue maximum
- No pause control = WCAG 2.2.2 violation; non-negotiable
- Fixed-weight font = collapses to `kinetic-type`; variable required for v2
