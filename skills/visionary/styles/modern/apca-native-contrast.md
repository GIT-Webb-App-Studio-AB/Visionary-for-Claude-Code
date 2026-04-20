---
id: apca-native-contrast
category: modern
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light]
keywords: [apca, contrast, accessibility, dark-mode, perceptual, wcag3, lc]
accessibility:
  contrast_floor: 7.0
  reduced_motion: opacity-only
  touch_target: 48
---

# APCA Native Contrast

**Category:** modern
**Motion tier:** Subtle

A style engineered from the APCA Lc spec outwards, not retrofitted to meet
WCAG 2.x after the fact. Body text hits Lc 75+, headlines Lc 90+, non-text
UI Lc 45+. Sits next to `high-contrast-a11y` (WCAG AAA) as a sibling — both
are accessibility-first, but APCA is perceptually-uniform in dark mode
where WCAG 2.x contrast-math breaks.

Use when: dark mode is the default, the audience skews older (55+), or the
product ships to EU markets where EAA enforcement is active.

## Typography

- **Display font:** **Atkinson Hyperlegible** or **Literata** — both
  perceptually-tested against low-vision readers
- **Body font:** same family, 17 px minimum
- **Tracking:** 0.01em (slight extra for long-read comfort)
- **Leading:** 1.7 body, 1.15 display
- **Feature:** explicit font-optical-size — at 24 px+, use `opsz: 48` if
  the font supports it (Literata does)

## Colors

**Light mode (Lc values shown):**
- **Background:** `#FFFFFF`
- **Body text:** `#111111` (Lc ≈ 105 against bg — AAA+)
- **Large text:** `#333333` (Lc ≈ 82)
- **Muted text:** `#555555` (Lc ≈ 60 — UI label only, never body)
- **Primary:** `#0052CC` (Lc ≈ 72 for white-on-primary CTA text)
- **Accent:** `#B83200` (Lc ≈ 72 against white)

**Dark mode (Lc values shown):**
- **Background:** `#0A0A0A`
- **Body text:** `#F5F5F5` (Lc ≈ -96 against bg — AAA+)
- **Large text:** `#D1D1D1` (Lc ≈ -78)
- **Primary:** `#4D9AFF` (Lc ≈ -72 for body-text-on-primary)
- **Accent:** `#FFB366` (Lc ≈ -75)

Never `#666666` on `#FFFFFF` (Lc 57 — below our floor even though WCAG
2.x passes it at 5.4:1). WCAG fails APCA users.

## Motion

- **Tier:** Subtle
- **Spring tokens:** `{ bounce: 0, visualDuration: 0.2 }` — no overshoot
- **Enter animation:** opacity 0 → 1, 180 ms, no translate
- **Micro-interactions:** color shift only

## Spacing

- **Base grid:** 8 px, but text sizes anchor to 17/20/24/32/48 px — the
  type scale IS the grid
- **Border-radius:** 8–12 px
- **Density:** balanced; favors clarity over density

## Code Pattern

```css
:root {
  color-scheme: light dark;
  --bg: oklch(1 0 0);
  --text: oklch(0.12 0 0);        /* Lc ≈ 105 vs white */
  --text-large: oklch(0.25 0 0);  /* Lc ≈ 82 */
  --muted: oklch(0.42 0 0);       /* Lc ≈ 60 */
  --primary: oklch(0.48 0.18 258);
  --primary-fg: oklch(1 0 0);
  --accent: oklch(0.52 0.2 40);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: oklch(0.09 0 0);
    --text: oklch(0.97 0 0);
    --text-large: oklch(0.85 0 0);
    --muted: oklch(0.65 0 0);
    --primary: oklch(0.72 0.15 258);
    --primary-fg: oklch(0.12 0 0);
    --accent: oklch(0.82 0.15 55);
  }
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Atkinson Hyperlegible', 'Literata', system-ui, sans-serif;
  font-size: 17px;
  line-height: 1.7;
  letter-spacing: 0.01em;
}

.apca-body-on-primary-button {
  background: var(--primary);
  color: var(--primary-fg);
  padding: 14px 24px;
  border-radius: 10px;
  min-block-size: 48px;
}
```

## Accessibility

### Contrast
**APCA-native**: body Lc ≥ 75, large Lc ≥ 60, UI Lc ≥ 45. WCAG 2.x: body
≥ 7:1 (AAA), large ≥ 4.5:1. Verified by `scripts/apca-validator.mjs
--strict`.

### Focus
4 px `AccentColor` outline, 3 px offset — deliberately thicker than the
3 px default because this style's audience relies on focus indicators more.

### Motion
All animation opacity-only. Reduced-motion drops to instant.

### Touch target
48×48 px (not the 44 default) — older users and motor-disability users
benefit from the extra margin.

### RTL / Logical properties
Full logical. Atkinson Hyperlegible covers Latin + Cyrillic + Greek;
substitute for Arabic/Hebrew.

## Slop Watch

- Using `#666` / `#999` greys = WCAG-passing, APCA-failing; both floors
  must pass
- Accent colors at oklch chroma > 0.22 = saturated enough to appear bright,
  but perceptual Lc often drops — always measure
- Body text < 17 px = breaks the perceptual assumption this style makes
- Motion with translate/scale = defeats the older/low-vision audience
- "High contrast" without APCA verification = marketing claim, not
  engineering
