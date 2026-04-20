---
id: aurora-mesh
category: morphisms
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, pastel, editorial]
keywords: [aurora, mesh, morphisms]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Aurora Mesh

**Category:** morphisms
**Motion tier:** Expressive

## Typography
- **Display font:** Bricolage Grotesque — variable-width grotesque that feels generative and editorial
- **Body font:** Bricolage Grotesque 400 or Inter
- **Tracking:** -0.02em display, 0em body | **Leading:** 1.4

## Colors
- **Background:** #0A0A1A — deep dark canvas that makes mesh gradients glow
- **Primary action:** #7C3AED — purple anchor in the aurora palette
- **Accent:** #06B6D4 — cyan that recalls polar light
- **Elevation model:** glows — mesh gradients are the depth, individual elements use diffuse glow not shadow

## Motion
- **Tier:** Expressive
- **Spring tokens:** gentle (mesh gradient shift), ui (card enter), layout (scroll-linked parallax)
- **Enter animation:** blur-reveal — elements emerge from blur(12px) to blur(0) as they enter viewport
- **Forbidden:** hard-edged shadows, solid color fills on cards (they destroy the mesh read-through)

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 20px cards, 12px inputs, 999px pills — soft to match the gradient softness

## Code Pattern
```css
.aurora-bg {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(120, 40, 200, 0.4) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(0, 200, 220, 0.3) 0%, transparent 50%),
    radial-gradient(ellipse at 60% 80%, rgba(40, 100, 255, 0.3) 0%, transparent 50%),
    #0A0A1A;
  /* Animate with CSS custom properties for slow drift */
}

@keyframes aurora-drift {
  0%, 100% { --pos-1: 20% 50%; --pos-2: 80% 20%; }
  50% { --pos-1: 30% 40%; --pos-2: 70% 30%; }
}

.aurora-card {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
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
- **Copying the mesh without animating it:** A static mesh gradient looks like a wallpaper, not a living interface — even a very slow 30s CSS animation reads as intentional
- **High contrast text on mesh:** Placing black text over the aurora destroys both — text must be white or very light, the dark canvas is load-bearing
