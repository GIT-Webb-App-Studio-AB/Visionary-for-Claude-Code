# Clinical Cold

**Category:** emotional
**Motion tier:** Subtle

## Typography
- **Display font:** IBM Plex Sans 400–500
- **Body font:** IBM Plex Sans 400
- **Weight range:** 300–600 (nothing dramatic)
- **Tracking:** 0.02em labels, 0em body
- **Leading:** 1.4 display, 1.5 body (efficient, not generous)

## Colors
- **Background:** #F4F6F8 (cold grey-blue tint)
- **Primary action:** #0066CC (cold blue)
- **Accent:** #6B7280 (neutral grey — no warmth)
- **Elevation model:** flat borders (1px solid #E5E7EB) over shadows — clinical preference for flat surfaces

## Motion
- **Tier:** Subtle (mechanical, not organic)
- **Spring tokens:** stiffness: 600, damping: 45, mass: 0.6
- **Enter animation:** linear opacity 0→1, 150ms — no spring, no curve, just linear
- **Forbidden:** warm colors, rounded organic forms, anything suggesting human emotion or error

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 2px consistent — functional minimum, not designed

## Code Pattern
```css
.clinical-cold-surface {
  background: #F4F6F8;
  border: 1px solid #E5E7EB;
  border-radius: 2px;
  padding: 20px 24px;
}

.clinical-data-row {
  display: flex;
  align-items: baseline;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid #E5E7EB;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
}

.clinical-key {
  color: #6B7280;
  font-weight: 400;
  min-width: 160px;
}

.clinical-value {
  color: #111827;
  font-weight: 500;
  font-feature-settings: 'tnum' 1;
}
```

## Slop Watch
- Warming up the background even slightly (cream, off-white) — the cold grey-blue tint is the emotional signal; warmth undermines the clinical register immediately
- Adding any hover state that goes beyond border-color change; clinical interfaces perform functions, they don't invite delight
