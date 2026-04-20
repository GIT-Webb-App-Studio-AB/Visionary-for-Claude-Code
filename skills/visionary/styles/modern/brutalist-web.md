---
id: brutalist-web
category: modern
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [brutalist, web, modern]
accessibility:
  contrast_floor: 4.5
  reduced_motion: static
  touch_target: 44
---

# Brutalist Web

**Category:** modern
**Motion tier:** Subtle

## Typography
- **Display font:** Times New Roman (intentional — the browser default, used as statement)
- **Body font:** Times New Roman Regular
- **Tracking:** 0em | **Leading:** 1.5 | **Weight range:** 400/700 (browser defaults)

## Colors
- **Background:** #FFFFFF
- **Primary action:** #0000EE (unvisited link blue — raw browser default)
- **Accent:** #551A8B (visited link purple — raw browser default)
- **Elevation model:** none — the browser's native rendering is the design

## Motion
- **Tier:** Subtle
- **Spring tokens:** none — instant state changes
- **Enter animation:** none — page appears; that IS the animation
- **Forbidden:** CSS transitions, JavaScript-driven motion, custom cursors, scroll-jacking

## Spacing
- **Base grid:** none enforced — content-driven spacing
- **Border-radius vocabulary:** 0px; or browser native input default

## Code Pattern
```css
/* Brutalist web: resist the urge to style */
body {
  font-family: Times New Roman, Times, serif;
  max-width: 65ch;
  margin: 0 auto;
  padding: 1em;
  /* That's it. Let the browser decide the rest. */
}
a { color: #0000EE; }
a:visited { color: #551A8B; }
/* Absolute maximum additional CSS — structural only */
table { border-collapse: collapse; width: 100%; }
td, th { border: 1px solid black; padding: 4px 8px; }
```

## Accessibility

### Contrast
Body text must clear 4.5:1 (WCAG 2.2 AA) AND APCA Lc ≥ 75. Large text / UI labels: 3:1 and Lc ≥ 60. Run axe-core + apca-w3 during the critique loop.

### Focus
Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.

### Motion
No animation by default; static entry and state changes. `prefers-reduced-motion` is already honored because there is nothing to reduce.

### Touch target
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
Brutalist web is not an excuse for inaccessibility — semantic HTML and proper heading hierarchy are required. The "raw HTML" aesthetic must be intentional and complete, not lazy. Unfinished work looks like unfinished work; committed minimalism looks like a choice.
