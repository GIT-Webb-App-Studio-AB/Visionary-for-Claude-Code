---
id: calm-focus-mode
category: emotional
motion_tier: Subtle
density: sparse
locale_fit: [all]
palette_tags: [light, pastel, earth, editorial]
keywords: [calm, focus, neurodivergent, adhd, autism, dyslexia, reduced-stimulation, accessibility]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Calm / Focus Mode

**Category:** emotional
**Motion tier:** Subtle

Designed for the ~15 % of users who are neurodivergent (ADHD, autism spectrum,
dyslexia, anxiety disorders, post-concussion, migraine-prone). Most AI-generated
UI assumes a neurotypical attention budget and saturates the screen. This style
is the inverse: reduced chrome, dampened palette, no motion parallax, single
point of focus per screen. Not "boring" — deliberately quiet.

Research basis: NIH 2024 calm-tech survey, UK NHS Digital accessibility guidance
2025, Nielsen Norman "attention budget" research.

## Typography

- **Display font:** Atkinson Hyperlegible — Braille Institute's typeface, designed
  specifically for readers with low vision and reading disorders. Avoids the
  mirror-ambiguity that OpenDyslexic solves by different means
- **Body font:** Atkinson Hyperlegible Regular, **17px minimum** (neurodivergent
  users over-read at 16 because of stress; 17 reclaims that margin)
- **Tracking:** 0.01em | **Leading:** 1.7 (denser leading increases re-read loops)
- **Feature:** NEVER justify body text — `text-align: justify` creates uneven
  word spacing that breaks dyslexic reading. Always `text-align: start`

## Colors

- **Background:** `#F7F5F0` (warm cream — stark white at high contrast triggers
  migraine in ~8 % of users; cream is the accessibility-research-backed compromise)
- **Primary text:** `#2A2A2A` (not black — pure black on cream creates the same
  glare problem as black on white, just less severely)
- **Primary action:** `#5B6F4C` (muted sage — avoids saturated blue/red/green
  which are the three colors most often flagged as "attention-stealing" in
  survey data)
- **Accent:** `#8C7A5C` (warm taupe) — used sparingly, one accent per view
- **Forbidden:** bright saturated colors, gradients, rainbow palettes, red (reserved
  for error states only), pure black, pure white, neon of any kind
- **Elevation model:** minimal. Single 1px hairline, never a shadow. Depth is
  communicated by whitespace, not chroma

## Motion

- **Tier:** Subtle (but honoring reduced-motion completely — this is the one style
  that should detect the preference and drop motion to zero even for decorative
  transitions, not just vestibular triggers)
- **Spring tokens:** `{ bounce: 0, visualDuration: 0.25 }` — no overshoot, no bounce
- **Enter animation:** opacity 0 → 1 over 200ms linear. No translate, no scale, no blur
- **Micro-interactions:** only color shift on hover (50ms), no scale, no lift.
  Hover must not produce "jumpy" layout shifts — neurodivergent users report
  these as the single most distracting UI pattern
- **Forbidden:** bounce, spring overshoot, parallax, auto-playing media, carousels,
  anything that moves without a user trigger, "fun" celebration animations, any
  motion > 5 s duration (WCAG 2.2.2 also requires pause, but calm-mode just skips
  such content entirely)

## Spacing

- **Base grid:** 12px (larger than the standard 8 — breathing room reduces
  cognitive load)
- **Border-radius vocabulary:** 6px or 12px, consistently. Avoid mixing radii —
  inconsistency forces micro-decisions about "are these elements related?"
- **Density:** sparse. One primary action per view. Secondary content collapsed
  behind progressive disclosure by default
- **Padding:** generous (32px+ on cards). Whitespace IS the design

## Code Pattern

```css
.calm-surface {
  background: #F7F5F0;
  color: #2A2A2A;
  font-family: 'Atkinson Hyperlegible', system-ui, sans-serif;
  font-size: 17px;
  line-height: 1.7;
  letter-spacing: 0.01em;
  padding: 32px;
}

/* No justified text — breaks dyslexic reading */
.calm-text {
  text-align: start; /* logical property; works in RTL */
  max-inline-size: 66ch; /* Baymard: optimal line length 50-75 chars */
}

/* Muted hairline, never a shadow */
.calm-card {
  background: #FBF9F4;
  border: 1px solid #E8E4DB;
  border-radius: 12px;
  padding: 40px;
}

/* Hover: color shift only, no movement */
.calm-button {
  background: #5B6F4C;
  color: #F7F5F0;
  padding: 14px 24px;
  border-radius: 12px;
  transition: background 120ms linear; /* no transform */
}
.calm-button:hover,
.calm-button:focus-visible {
  background: #4A5D3D;
}

/* Reduced motion: zero motion, not just "safe" motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

## Accessibility

### Contrast
Body text #2A2A2A on #F7F5F0 = 13.3:1 (WCAG AAA). Primary action #5B6F4C on
#F7F5F0 = 4.8:1 (AA large-text, need white text for body-size use). Explicit
targets: Lc ≥ 90 on body (AAA equivalent), Lc ≥ 60 on large.

### Focus
3px `:focus-visible` ring in `AccentColor` (system), 3px offset. Never suppress
the ring — neurodivergent keyboard users rely on it far more than neurotypical.

### Motion
All motion gated on `prefers-reduced-motion: no-preference`. The reduce branch
kills animation entirely (not just transforms — the calm-mode audience includes
users where any motion is problematic).

### Touch target
48×48 px default (larger than the 44 default — calm-mode is also used by users
with motor-control differences where larger targets meaningfully help).

### RTL / Logical properties
Fully logical (`margin-inline`, `padding-inline`, `text-align: start`). No
physical left/right anywhere. Arabic, Hebrew, Persian locales just work.

## Slop Watch

- Any gradient, shadow, or glow = immediate fail; calm-mode is anti-decoration
- Saturated colors leak the attention budget — if the palette has any chroma
  above 0.12 in oklch, you're no longer in calm-mode
- Multiple CTAs on screen = fail. One primary per view, full stop
- Carousels, marquees, auto-advancing anything = fail. Content must be stable
- Emoji or colorful icons = fail. Use flat single-color SVG glyphs only
- This style is NOT compatible with dashboard / data-dense layouts — propose
  `saas-b2b-dashboard` with `reduced-ui-density` modifier instead
