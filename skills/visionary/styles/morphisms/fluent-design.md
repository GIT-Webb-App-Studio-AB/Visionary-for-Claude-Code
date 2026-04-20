---
id: fluent-design
category: morphisms
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [fluent, design, morphisms]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Fluent Design

**Category:** morphisms
**Motion tier:** Subtle

## Typography
- **Display font:** Segoe UI Variable (fallback: Segoe UI, system-ui) — Windows platform font
- **Body font:** Segoe UI, system-ui, sans-serif
- **Tracking:** 0em | **Leading:** 1.5 (follows Windows text rendering)

## Colors
- **Background:** #202020 — WinUI dark canvas
- **Primary action:** #60CDFF — Fluent accent blue (light mode: #0078D4)
- **Accent:** #FFFFFF at varying opacities for layering
- **Elevation model:** depth layers — acrylic (blurred background), mica (wallpaper tint), reveals (light following cursor)

## Motion
- **Tier:** Subtle
- **Spring tokens:** ui (panel), micro (reveal hover)
- **Enter animation:** connected animation — UI elements slide along implicit connection lines between states
- **Forbidden:** physics-heavy bounce, arbitrary scale transforms — Fluent motion is directional and purposeful

## Spacing
- **Base grid:** 4px
- **Border-radius vocabulary:** 4px inputs, 8px cards, 4px buttons — restrained compared to iOS equivalents

## Code Pattern
```css
.acrylic-panel {
  background:
    linear-gradient(
      rgba(32, 32, 32, 0.6),
      rgba(32, 32, 32, 0.6)
    );
  backdrop-filter: blur(30px) saturate(125%);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
}

/* Fluent reveal effect requires JS for cursor tracking */
.reveal-hover {
  background: radial-gradient(
    circle at var(--x) var(--y),
    rgba(255,255,255,0.08) 0%,
    transparent 50%
  );
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
- **Calling it "Fluent" but just doing glassmorphism:** Fluent has specific blur amounts, mica integration, and reveal lighting — without cursor-reactive light reveals it is glassmorphism with Segoe UI
- **Ignoring platform context:** Fluent is Windows-native; using it in web contexts without the Windows font stack breaks the coherence
