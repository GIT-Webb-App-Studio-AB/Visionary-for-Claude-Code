# Legal Editorial

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Times New Roman (or Libre Baskerville) — legal documents have used Times since 1929
- **Body font:** Libre Baskerville Regular
- **Tracking:** 0em | **Leading:** 1.65

## Colors
- **Background:** #FFFFFF (legal documents are white)
- **Primary action:** #1A1A1A (black — legal ink)
- **Accent:** #6B1A2A (law burgundy — case law references, section headers)
- **Elevation model:** none; legal documents have no elevation

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 200, damping: 30 }`
- **Enter animation:** fade 150ms ease-out; legal interfaces don't animate decoratively
- **Forbidden:** bounce, color backgrounds, sans-serif primary type, any decorative motion

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; legal documents are rectilinear

## Code Pattern
```css
.legal-document {
  font-family: 'Libre Baskerville', 'Times New Roman', serif;
  font-size: 12pt; /* legal standard */
  line-height: 2; /* double-spaced for annotation */
  max-width: 8.5in;
  margin: 1in auto;
  padding: 1in;
}

.section-heading {
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
  margin: 2em 0 1em;
}
```

## Slop Watch
- Line height must be 2.0 (double-spaced) for document body — single spacing is not legally standard and makes annotation impossible
- All caps section headings are a legal convention; applying sentence case reads as non-legal and reduces the professional register
