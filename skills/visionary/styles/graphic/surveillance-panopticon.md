# Surveillance Panopticon

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** IBM Plex Mono — institutional authority, machine-generated records
- **Body font:** IBM Plex Mono Regular
- **Tracking:** 0em | **Leading:** 1.5

## Colors
- **Background:** #050505 (CCTV black)
- **Primary action:** #FF8C00 (warning amber — under observation)
- **Accent:** #CC3300 (alert red — breach detected)
- **Elevation model:** none; surveillance is flat, clinical, grid-based

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 400, damping: 40 }` — immediate, mechanical
- **Enter animation:** scan-reveal — horizontal wipe at 120ms; like a camera pan
- **Forbidden:** warmth, softness, rounded anything, organic motion

## Spacing
- **Base grid:** 4px (surveillance grid, dense)
- **Border-radius vocabulary:** 0px; surveillance systems are rectilinear

## Code Pattern
```css
.cctv-overlay {
  border: 1px solid rgba(255, 140, 0, 0.4);
  background: rgba(255, 140, 0, 0.03);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  color: #FF8C00;
}

.timestamp {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  color: rgba(255, 140, 0, 0.7);
}
```

## Slop Watch
- All numeric displays must use `tabular-nums` — timestamp digits that shift width on update destroy the clinical surveillance aesthetic
- Warning amber (#FF8C00) must not be used as a general accent; it carries warning semantics — reserve for genuinely alerting states to preserve signal meaning
