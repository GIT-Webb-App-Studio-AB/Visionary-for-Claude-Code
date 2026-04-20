---
id: terminal-cli
category: modern
motion_tier: Subtle
density: dense
locale_fit: [all]
palette_tags: [dark, neon, earth, organic]
keywords: [terminal, cli, modern]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 24
---

# Terminal / CLI

**Category:** modern
**Motion tier:** Subtle

## Typography
- **Display font:** JetBrains Mono — the reference monospace for developer tooling
- **Body font:** JetBrains Mono Regular
- **Tracking:** 0em | **Leading:** 1.6 | **Weight range:** 400/700 only

## Colors
- **Background:** #0D0D0D
- **Primary action:** #00FF41 (matrix green — canonical terminal)
- **Accent:** #FFB86C (amber — warnings, highlights)
- **Elevation model:** none — flat, 1px borders only

## Motion
- **Tier:** Subtle
- **Spring tokens:** `stiffness: 500, damping: 50` — instant, no elasticity
- **Enter animation:** typewriter (characters appear left-to-right, 30ms per character)
- **Forbidden:** rounded corners, smooth easing, any non-monospace font, any gradient

## Spacing
- **Base grid:** 8px; but character-grid takes precedence (align to ch units)
- **Border-radius vocabulary:** 0px absolute — terminals have no curves

## Code Pattern
```css
.terminal-root {
  background: #0D0D0D;
  color: #00FF41;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  padding: 24px;
}
.terminal-prompt::before {
  content: '$ ';
  color: #00FF41;
  opacity: 0.6;
}
.terminal-cursor {
  display: inline-block;
  width: 0.6ch;
  height: 1em;
  background: #00FF41;
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
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
Touch targets may drop to 24×24 px (WCAG 2.5.8 floor) because this style is information-dense by design. Document the density in the brief so the critic doesn't flag it.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
Typewriter animation on long content is a UX anti-pattern — reserve it for single-line prompts or code snippets maximum 80 characters. Do not use it for paragraphs of text. The blink cursor must use `step-end`, never a smooth opacity transition — terminals blink, they do not fade.
