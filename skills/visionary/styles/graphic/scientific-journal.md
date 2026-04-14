# Scientific Journal

**Category:** hybrid
**Motion tier:** Subtle

## Typography
- **Display font:** STIX Two Text (or Computer Modern via web) — mathematical serif with correct equation support
- **Body font:** Source Serif 4
- **Tracking:** 0em | **Leading:** 1.6

## Colors
- **Background:** #FFFFFF (clinical white)
- **Primary action:** #1A1A1A (publication black)
- **Accent:** #003087 (academic blue — link and figure reference)
- **Elevation model:** none; flat academic layout, no elevation metaphors

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 200, damping: 28 }`
- **Enter animation:** fade 150ms ease-out; no movement
- **Forbidden:** decorative animation, gradients, rounded cards, any visual element without informational purpose

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; academic publishing has no rounding

## Code Pattern
```css
.journal-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 40px;
  max-width: 960px;
  margin: 0 auto;
  font-family: 'STIX Two Text', 'Computer Modern', Georgia, serif;
}

.figure-caption {
  font-size: 0.85rem;
  color: #555555;
  margin-top: 8px;
  text-align: left;
}

.equation-block {
  font-family: 'STIX Two Math', serif;
  text-align: center;
  margin: 24px 0;
  overflow-x: auto;
}
```

## Slop Watch
- Two-column layout must collapse to single column at < 768px — academic readers use desktop; mobile two-column at 375px is illegible
- STIX Two requires explicit font-loading; without it equations fall back to system serif which lacks mathematical symbols
