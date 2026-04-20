---
id: african-design
category: graphic
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, earth, editorial]
keywords: [african, design, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# African Design

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Nunito ExtraBold — rhythm and warmth at high weight
- **Body font:** Nunito Regular
- **Tracking:** 0.02em | **Leading:** 1.6

## Colors
- **Background:** #1A0A00 (dark earth)
- **Primary action:** #E8621A (kente orange)
- **Accent:** #F5C842 (gold thread)
- **Elevation model:** warm ambient glow; depth through pattern layering, not shadows

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 200, damping: 16 }`
- **Enter animation:** slide up 16px + fade, 300ms ease-out; rhythmic sequential stagger 60ms
- **Forbidden:** cold desaturation, minimalist restraint that erases pattern richness, single-color backgrounds without pattern

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–8px; kente weave is rectilinear

## Code Pattern
```css
/* Geometric kente-inspired pattern — abstract, not appropriated specific cloth */
.kente-pattern {
  background-color: #1A0A00;
  background-image:
    repeating-linear-gradient(
      90deg,
      rgba(232, 98, 26, 0.15) 0px,
      rgba(232, 98, 26, 0.15) 8px,
      transparent 8px,
      transparent 16px
    ),
    repeating-linear-gradient(
      0deg,
      rgba(245, 200, 66, 0.1) 0px,
      rgba(245, 200, 66, 0.1) 4px,
      transparent 4px,
      transparent 16px
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
- Pattern opacity must stay ≤ 0.15 for the horizontal bands; heavier patterns compete with content and read as wallpaper
- Never reduce this style to "earthy tones on white" — the geometric pattern layer and dark earth background are what carry the register

## Cultural Note
**Vast diversity warning:** Africa comprises 54 countries, 2,000+ languages, and thousands of distinct visual traditions. This style draws abstractly from West African textile geometry (Kente, Kuba cloth, Bogolan) — it does NOT represent African design broadly.

**Do not:**
- Label this style as generically "African" in UI copy
- Use specific sacred or ceremonial symbols without cultural consultation
- Apply to contexts requiring authentic representation of specific cultures (use a cultural consultant)
- Mix visual motifs from different regions as if interchangeable

**Do:**
- Use as a celebration of West African geometric design tradition
- Credit inspiration sources in design documentation
- Consult with African designers from the relevant region for client-facing work
- Recognize this as one of thousands of distinct African visual languages
