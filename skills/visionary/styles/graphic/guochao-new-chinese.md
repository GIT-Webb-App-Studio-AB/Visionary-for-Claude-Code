---
id: guochao-new-chinese
category: graphic
motion_tier: Expressive
density: balanced
locale_fit: [ja, zh, ko]
palette_tags: [light, editorial]
keywords: [guochao, new, chinese, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Guochao New Chinese

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Noto Serif SC (or Source Han Serif) — traditional stroke authority for display
- **Body font:** Noto Sans SC
- **Tracking:** 0.05em | **Leading:** 1.75

## Colors
- **Background:** #FAF0E6 (rice paper)
- **Primary action:** #C0222B (imperial red)
- **Accent:** #C9A84C (imperial gold)
- **Elevation model:** warm ink-wash shadow; no cold greys

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 200, damping: 20 }`
- **Enter animation:** scroll-reveal — slide from right 20px + fade, 280ms ease-out
- **Forbidden:** cold blues, mechanical easing, Western minimalism signals

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–4px; traditional + contemporary hybrid

## Code Pattern
```css
.guochao-display {
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  writing-mode: horizontal-tb; /* or vertical-rl for traditional vertical layout */
  color: #C0222B;
}

.guochao-vertical-text {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-family: 'Noto Serif SC', serif;
  letter-spacing: 0.1em;
}

.guochao-divider {
  border-top: 3px solid #C0222B;
  position: relative;
}

.guochao-divider::after {
  content: '';
  display: block;
  height: 1px;
  background: #C9A84C;
  margin-top: 4px;
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
- Vertical text layout requires `writing-mode: vertical-rl` — `text-orientation: upright` vs `mixed` changes whether Latin characters rotate; choose intentionally
- Never use this style without loading Noto Serif SC; all CJK content will render as boxes on systems without the font installed

## Cultural Note
**Guochao (国潮):** See chinese-guochao.md for full cultural context. This extended variant emphasizes contemporary brand applications and vertical typography layouts traditional to Chinese publishing.
