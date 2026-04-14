# Architecture Inspired

**Category:** hybrid
**Motion tier:** Subtle

## Typography
- **Display font:** Helvetica Neue (or Neue Haas Grotesk) — the typeface of architectural documentation
- **Body font:** DM Sans
- **Tracking:** 0.01em | **Leading:** 1.5

## Colors
- **Background:** #FFFFFF (white)
- **Primary action:** #3A3A3A (steel)
- **Accent:** #888888 (concrete)
- **Elevation model:** structural reveals; thin 1px borders as load-bearing elements

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 280, damping: 30 }` — precise, no excess movement
- **Enter animation:** structural reveal — elements draw in from edges, 300ms ease-out
- **Forbidden:** organic curves, decorative shadows, warm tones, bounce

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; architecture has no accidental rounding

## Code Pattern
```css
.architectural-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1px;
  background: #3A3A3A; /* grid lines are structural */
}

.architectural-cell {
  background: #FFFFFF;
  padding: 24px;
}

.section-rule {
  border: none;
  border-top: 1px solid #3A3A3A;
  margin: 40px 0;
}
```

## Slop Watch
- Grid lines must be achieved via gap + background color, not borders — CSS border gaps are inconsistent at 1px scale across browsers
- Never introduce rounded corners; even 1px rounding signals consumer product design, not architectural precision
