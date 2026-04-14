# Catalog Archive

**Category:** hybrid
**Motion tier:** Subtle

## Typography
- **Display font:** Neue Haas Grotesk (or Aktiv Grotesk) — institutional sans with archival authority
- **Body font:** Adobe Caslon (or EB Garamond as web fallback)
- **Tracking:** 0.01em | **Leading:** 1.6

## Colors
- **Background:** #FAF7F2 (cream)
- **Primary action:** #1C1C1C (archive black)
- **Accent:** #7A2030 (burgundy — library binding reference)
- **Elevation model:** subtle drop shadows; archival boxes cast weight

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 200, damping: 28 }`
- **Enter animation:** fade 200ms ease-out; 2px Y shift
- **Forbidden:** bounce, neon, bright primaries, anything that signals new

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 2–4px; archival materials have worn, minimal rounding

## Code Pattern
```css
.catalog-entry {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px 16px;
  align-items: baseline;
  padding: 12px 0;
  border-bottom: 1px solid rgba(28, 28, 28, 0.12);
}

.catalog-number {
  font-family: 'Neue Haas Grotesk', 'Helvetica Neue', sans-serif;
  font-size: 0.75rem;
  color: #7A2030;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
}

.catalog-title {
  font-family: 'EB Garamond', 'Adobe Caslon', Georgia, serif;
  font-size: 1rem;
}
```

## Slop Watch
- Catalog number column must use `tabular-nums` — proportional digits cause visual misalignment across the catalog index
- The sans + serif combination is structural: sans for metadata/numbers (institutional) and serif for titles/descriptions (humanist) — never use a single typeface throughout
