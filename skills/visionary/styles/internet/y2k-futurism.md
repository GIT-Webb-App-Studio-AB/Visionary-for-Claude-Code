---
id: y2k-futurism
category: internet
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [y2k, futurism, internet]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Y2K Futurism

**Category:** internet
**Motion tier:** Kinetic

## Typography
- **Display font:** Syncopate 700 — wide-tracked, futuristic, very 2000s
- **Body font:** Rajdhani or Exo 2 for body, monospace for data
- **Tracking:** 0.2em on headers, 0.05em body | **Leading:** 1.3

## Colors
- **Background:** #050A14 — near-black with blue tint
- **Primary action:** #C0C0C0 — chrome silver as the primary surface/button material
- **Accent:** #00F5FF — electric cyan for interactive highlights
- **Elevation model:** reflections — chrome elements have specular gradient highlights, not shadows

## Motion
- **Tier:** Kinetic
- **Spring tokens:** snappy (UI transitions), layout (data updates), bounce (element arrival)
- **Enter animation:** scan-in — elements appear with a horizontal scan line passing top-to-bottom
- **Forbidden:** organic curves in animation, warm color temperature, serif fonts

## Spacing
- **Base grid:** 4px
- **Border-radius vocabulary:** 0px for hard metal elements, 2px for "precision machined" edges, 999px for circular elements only

## Code Pattern
```css
.y2k-chrome {
  background: linear-gradient(
    180deg,
    #e8e8e8 0%,
    #ffffff 25%,
    #c0c0c0 50%,
    #a0a0a0 75%,
    #d0d0d0 100%
  );
  border: 1px solid #888;
  color: #000;
}

.y2k-panel {
  background: linear-gradient(135deg, #1a1a2e, #0f0f23);
  border: 1px solid rgba(0,245,255,0.3);
  box-shadow:
    0 0 15px rgba(0,245,255,0.1),
    inset 0 1px 0 rgba(0,245,255,0.1);
}

.y2k-text {
  font-family: 'Syncopate', sans-serif;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #00F5FF;
  text-shadow: 0 0 8px rgba(0,245,255,0.5);
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
- **Generic "futuristic" font:** Using Orbitron for Y2K reads as Cyberpunk — Syncopate and Exo have the specific 2000s corporate-futurism energy
- **No chrome:** Y2K without metallic gradient elements is just generic dark UI — the chrome/silver material is definitional
