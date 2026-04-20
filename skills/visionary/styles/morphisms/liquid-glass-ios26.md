---
id: liquid-glass-ios26
category: morphisms
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [light, pastel, editorial]
keywords: [liquid-glass, ios26, apple, glass, morphism, translucency, adaptive]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Liquid Glass iOS 26

**Category:** morphisms
**Motion tier:** Expressive

This is the Apple iOS 26 / iPadOS 26 / macOS Tahoe system glass. Not a CSS
approximation of frosted backdrop — it behaves like a single continuous sheet
that refracts the content beneath it, deforms on touch, and tints itself
against the underlying color so contrast stays legible. iOS 27 makes the
scroll-reactive tab-bar behavior mandatory for App Store submissions.

## Typography

- **Display font:** SF Pro Display (iOS native) or Geist as system fallback — the
  glass refraction reads most clearly against a humanist-grotesque like SF, because
  sharper typeface choices (Inter, Plus Jakarta) compete with the refraction layer
- **Body font:** SF Pro Text / Geist Regular — 16px minimum; glass halves apparent
  contrast, so body type cannot sit below 4.5:1 even on paper
- **Tracking:** -0.01em | **Leading:** 1.5
- **Feature:** Apple's SF Symbols 7 auto-adapt stroke weight to the glass blur
  level — generated components should use currentColor strokes so the same
  behavior falls out in CSS

## Colors

- **Background:** adaptive — use `color-mix(in oklch, var(--ambient) 85%, white)`
  so the glass re-tints against whatever the underlying content is. Never hardcode
  a glass color — hardcoded glass looks like a 2013 frosted overlay
- **Glass tint:** `oklch(0.98 0.01 240 / 0.72)` (light mode) / `oklch(0.18 0.02 240 / 0.62)` (dark mode)
- **Primary action:** `oklch(0.62 0.18 252)` (Apple system blue in oklch; falls back to #0A84FF)
- **Accent:** single hue, pulled from the underlying content via color-mix
- **Elevation model:** **no drop shadows**. Glass recedes — it does not emit.
  Use `backdrop-filter: blur(24px) saturate(180%)` plus `border: 1px solid oklch(1 0 0 / 0.18)`

## Motion

- **Tier:** Expressive
- **Spring tokens:** `{ bounce: 0.25, visualDuration: 0.38 }` (Motion v12) — iOS
  native spring is closer to 0.3 bounce / 0.4 visualDuration; we keep ours tighter
  for the web where touch feedback is less precise
- **Enter animation:** the glass material should **refract in**, not fade in.
  Animate `backdrop-filter: blur(0) → blur(24px)` over 340 ms with a
  `cubic-bezier(0.16, 1, 0.3, 1)` curve. The content underneath should NOT move
- **Micro-interactions:** on press, scale 1 → 0.97 + brighten the glass tint by
  4 % (`color-mix` bump); on release, snap back via `spring.micro`
- **Scroll-reactive tab bar:** on scroll-down, tab bar should translate-Y out and
  shrink its `--glass-tint-alpha` from 0.72 → 0.55; on scroll-up, spring back in.
  iOS 27 rejects apps that don't implement this in App Store review
- **Forbidden:** translate bounce, colored glows, shadow puffs

## Spacing

- **Base grid:** 8px, but Apple uses 4px inside glass pills — follow 4px for
  controls that sit on top of the glass
- **Border-radius vocabulary:** 16–28px on surfaces (the "iPhone corner" radius),
  999px on glass pills and tab-bar items
- **Rules:** never nest one glass surface inside another more than two levels
  deep — the blur stacks and legibility collapses. iOS enforces this via
  `UIGlassBackgroundEffectView` inheritance limits

## Code Pattern

```css
.glass-panel {
  /* Apple's adaptive glass tint — re-tints against whatever is behind */
  background: color-mix(in oklch, var(--ambient, white) 22%, transparent);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid oklch(1 0 0 / 0.18);
  border-radius: 24px;
  /* No box-shadow — glass recedes, it does not emit */
  isolation: isolate; /* keep the blur stacking-context local */
}

/* Scroll-reactive tab bar (iOS 27 required pattern) */
.tab-bar {
  background: color-mix(in oklch, var(--ambient) 28%, transparent);
  backdrop-filter: blur(32px) saturate(160%);
  transition: translate 240ms cubic-bezier(0.16, 1, 0.3, 1),
              background 200ms linear;
}
.tab-bar[data-scroll="down"] {
  translate: 0 calc(100% - 48px);
  background: color-mix(in oklch, var(--ambient) 18%, transparent);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .glass-panel {
    background: color-mix(in oklch, var(--ambient, black) 42%, transparent);
    border-color: oklch(1 0 0 / 0.08);
  }
}

/* Reduced motion — glass still tints, but does not refract-in */
@media (prefers-reduced-motion: reduce) {
  .glass-panel { transition: none; }
}
```

## Accessibility

### Contrast
Body text must clear 4.5:1 **after** the glass tint is applied, not just against
the ambient. Run `axe-core` with the element rendered over its real parent —
axe's color-contrast rule accounts for `backdrop-filter`. APCA Lc ≥ 75.

### Focus
`:focus-visible` ring must NOT use the glass — the ring should be a solid
`AccentColor` outline so Windows High Contrast and forced-colors mode still
render it. Glass rings disappear in forced-colors.

### Motion
Under `prefers-reduced-motion: reduce`, skip the refract-in animation and render
the blur immediately. The scroll-reactive tab bar should degrade to a static
pinned bar — translate-Y is vestibular.

### Touch target
44×44 px default. Glass pills go 44 high × ≥ 88 wide. Never shrink a glass
control below 44 — the reduced contrast of glass amplifies mis-taps.

### RTL / Logical properties
Use `margin-inline`, `padding-inline`, and `border-inline-*` throughout. The
scroll-reactive tab bar must flip its shrink direction in RTL locales.

## Slop Watch

- Solid backgrounds under glass destroy the effect — glass needs something
  visually interesting underneath (photo, gradient, animated mesh)
- `backdrop-filter` without `saturate(180%)` reads dull and grey — Apple's
  saturation boost is what makes the tint feel "alive"
- Stacking 3+ glass surfaces = unreadable; cap at 2
- Hardcoding `rgba(255,255,255,0.7)` instead of `color-mix(... in oklch)` is the
  #1 Liquid Glass tell in generated code
- Drop shadows on glass = immediate fail. Glass recedes
