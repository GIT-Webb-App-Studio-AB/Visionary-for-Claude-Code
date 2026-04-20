---
id: developer-tools
category: industry
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [developer, tools, industry]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 24
---

# Developer Tools

**Category:** industry
**Motion tier:** Subtle

## Typography
- **Display font:** Space Grotesk 600 or Geist 600
- **Body font:** IBM Plex Sans 400
- **Mono font:** Monaspace Neon (code blocks)
- **Weight range:** 400–700
- **Tracking:** -0.01em display, 0em body, 0.02em mono
- **Leading:** 1.3 display, 1.55 body, 1.6 mono

## Colors
- **Background:** #0D1117 (dark) or #FFFFFF (light)
- **Primary action:** #7C3AED (developer violet)
- **Accent:** #06B6D4 (cyan for syntax highlights)
- **Elevation model:** subtle borders (1px solid #30363D dark / #E2E8F0 light)

## Motion
- **Tier:** Subtle
- **Spring tokens:** stiffness: 500, damping: 38, mass: 0.6
- **Enter animation:** opacity 0→1, 150ms — developer tools must feel instant
- **Forbidden:** slow decorative transitions, animations that delay workflow, anything over 300ms in UI

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 6px inputs and cards, 4px code blocks, 8px dialogs — functional, consistent

## Code Pattern
```css
.devtools-code-block {
  font-family: 'Monaspace Neon', 'JetBrains Mono', monospace;
  background: #161B22;
  border: 1px solid #30363D;
  border-radius: 4px;
  padding: 16px 20px;
  font-size: 0.875rem;
  line-height: 1.6;
  overflow-x: auto;
  color: #E6EDF3;
}

.devtools-badge {
  font-family: 'Monaspace Neon', monospace;
  font-size: 0.75rem;
  background: rgba(124, 58, 237, 0.15);
  color: #7C3AED;
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 6px;
  padding: 2px 8px;
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
- Using a proportional font for code blocks — any non-monospace font in a code context signals that the designer doesn't use developer tools
- Animating the sidebar collapse with a slow ease — developers notice latency; every transition in a dev tool must feel faster than in consumer apps
