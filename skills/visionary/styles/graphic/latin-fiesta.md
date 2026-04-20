---
id: latin-fiesta
category: graphic
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [light, neon, pastel, earth, editorial, organic]
keywords: [latin, fiesta, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Latin Fiesta

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Lato ExtraBold — warmth at high weight; Latin-adjacent origin (Łukasz Dziedzic, Warsaw)
- **Body font:** Lato Regular
- **Tracking:** 0.02em | **Leading:** 1.55

## Colors
- **Background:** #FFF8F0 (warm cream)
- **Primary action:** #D4380D (terracotta orange-red)
- **Accent:** #1A7A4A (Mexican jade green)
- **Elevation model:** warm drop shadows with hue; no cold greys

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 240, damping: 16 }` — celebratory bounce
- **Enter animation:** scale 0.9 → 1.04 → 1, 320ms; fiesta energy
- **Forbidden:** cold palettes, understated motion, muted desaturation

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8–20px; warm and approachable

## Code Pattern
```css
.fiesta-card {
  background: #FFF8F0;
  border-radius: 16px;
  border: 2px solid #D4380D;
  box-shadow: 4px 4px 0 #1A7A4A;
  transition: transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 280ms ease;
}

.fiesta-card:hover {
  transform: translate(-2px, -2px) rotate(0.5deg);
  box-shadow: 6px 6px 0 #1A7A4A;
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
- The complementary colored shadow (border red + shadow green) is the signature move; a grey shadow reads as generic card design
- The 0.5deg rotation on hover is optional but effective; beyond 1deg it reads as broken layout
- Never name CSS classes or tokens using country-stereotype shorthand ("mexican-red", "sombrero-shadow", "fiesta-pattern") — the result reads as cultural caricature

## Cultural Note
**CRITICAL — READ BEFORE DEPLOYING:**

"Latin Fiesta" is a flattening shorthand for hundreds of distinct Latin American and Iberian design traditions (Mexican muralism, Chilean Constructivism, Brazilian Tropicália, Argentine editorial, Caribbean print culture, Andean textile grammar, Portuguese azulejo, and more). This template provides only a warm-palette foundation — it is not a substitute for culture-specific design work.

**Mandatory requirements before client deployment:**
1. Collaborate with designers and cultural advisors from the specific region or community being represented
2. Replace the generic palette with references grounded in a particular tradition (e.g. Oaxaca textile colorways vs. Rio carnival print vs. Lisbon tile)
3. Avoid composite "pan-Latin" symbol sets — piñata/sombrero/maracas clusters are caricature, not design
4. Verify that typographic choices don't inadvertently reproduce racist 20th-century "Mexican font" tropes (e.g. wood-type mimics of Aztec glyphs)

**Do not:**
- Market this as "Hispanic" or "Latino" design — those labels erase distinct national and Indigenous traditions
- Use Day-of-the-Dead (Día de Muertos) iconography outside explicit commemorative contexts
- Use Indigenous Mesoamerican symbols (Aztec, Mayan, Mixtec patterns) without permission from communities of origin — they are not decorative resources
- Use ANY Indigenous cultural elements — see `indigenous-first-nations.md` for mandatory consultation framework

**Do:**
- Use the warm-palette foundation as a neutral starting point for region-specific collaborative work
- Credit specific traditions and cultural collaborators in design documentation
- Prefer type from Latin American foundries (e.g. Sudtipos, Tipo, Fundición Tipográfica Latinoamericana) over stock Google Fonts where possible

**References for ethical Latin American design:** Sudtipos (Argentina), Letras Latinas, Design in Public (Latinx design community), local design councils in each target country.
