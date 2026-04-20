---
id: indigenous-first-nations
category: graphic
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, earth]
keywords: [indigenous, first, nations, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Indigenous First Nations

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** Clean system sans-serif (Helvetica Neue, Segoe UI) — deliberately neutral; avoid any font that mimics or references specific Indigenous scripts or symbols
- **Body font:** System sans-serif stack
- **Tracking:** 0.02em | **Leading:** 1.65

## Colors
- **Background:** #F5EDD8 (earth ochre)
- **Primary action:** #5C3D11 (dark earth)
- **Accent:** #8B4513 (red ochre — widely used across many traditions)
- **Elevation model:** none; flat, earth-grounded

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 180, damping: 28 }`
- **Enter animation:** fade 220ms ease-out; grounded, unhurried
- **Forbidden:** dreamcatcher imagery, feather iconography, totem references, ANY specific cultural symbols without explicit permission from that Nation

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 4–8px; natural, not engineered

## Code Pattern
```css
/* Deliberately minimal — the restraint IS the pattern */
.earth-grounded {
  background: #F5EDD8;
  border-left: 4px solid #8B4513;
  padding: 24px 28px;
  color: #5C3D11;
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
- This style is intentionally restrained in its pattern vocabulary — adding "tribal patterns" without specific cultural authorization is appropriation, not design
- Never use "aztec", "tribal", "totem", or "spirit" as CSS class names or design tokens in this style; the terminology is disrespectful and colonial

## Cultural Note
**CRITICAL — READ BEFORE DEPLOYING:**

This style template provides ONLY a safe, neutral starting point using earth tones. It does not represent any specific Indigenous nation, and it must not be used as a substitute for genuine cultural collaboration.

**Mandatory requirements before client deployment:**
1. Engage with cultural representatives from the specific Nation or community being represented
2. Obtain explicit permission for any specific visual elements, symbols, or motifs
3. Compensate cultural advisors appropriately — not as a favor, as a professional engagement
4. Review with Indigenous design practitioners (e.g., designers from Eighth Generation, Signal Arts, or Nation-affiliated studios)

**Do not:**
- Use generic "tribal" or "Native American" patterns — these homogenize thousands of distinct Nations
- Reproduce sacred symbols, ceremonial designs, or regalia imagery under any circumstances
- Use this template as a substitute for genuine cultural consultation on projects where authentic Indigenous representation is required

**Do:**
- Use this earth-tone foundation as a neutral starting point for collaborative development
- Treat this as a baseline requiring cultural expertise to complete, not a finished style
- Credit the specific Nation and cultural collaborators in design documentation

**References for ethical Indigenous design:** First Nations Technology Council (Canada), IllumiNative (USA), Animikii Indigenous Technology & Design.
