# Goblincore

**Category:** internet
**Motion tier:** Expressive

## Typography
- **Display font:** IM Fell English — irregular ink-press serif with imperfect character spacing
- **Body font:** IM Fell English or Libre Baskerville
- **Tracking:** 0.01em | **Leading:** 1.7

## Colors
- **Background:** #1C1A0F — earthy near-black, like forest floor at dusk
- **Primary action:** #6B8C42 — muddy olive green
- **Accent:** #A0784A — mushroom brown used for borders and decorative elements
- **Elevation model:** none — depth through texture and irregular borders, no clean digital shadows

## Motion
- **Tier:** Expressive
- **Spring tokens:** gentle (transitions), ui (hover reveal — like a creature peeking out)
- **Enter animation:** irregular reveal — clip-path from irregular shape (not clean rectangle) expanding
- **Forbidden:** clean geometric animations, perfect symmetry, anything that suggests "polished product"

## Spacing
- **Base grid:** 8px — but applied loosely; slight irregularity is correct
- **Border-radius vocabulary:** deliberate variation — 3px, 7px, 11px — intentionally odd to feel hand-made

## Code Pattern
```css
.goblin-card {
  background: #2A2516;
  border: 2px solid #6B8C42;
  border-radius: 11px 3px 9px 5px; /* irregular corners */
  padding: 24px;
  position: relative;
}

/* Mushroom texture overlay */
.goblin-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* noise SVG */
  opacity: 0.04;
  pointer-events: none;
  border-radius: inherit;
}

.goblin-link {
  color: #A0784A;
  text-decoration: underline;
  text-decoration-style: wavy;
  text-decoration-color: rgba(160,120,74,0.4);
}
```

## Slop Watch
- **Dark cottagecore confusion:** Goblincore is earthy and odd, not romantically rustic — the difference is irregular shapes, foraged-object references, and missing the floral softness
- **Using a "premium" font:** Goblincore rejects polish — using a clean geometric sans destroys the aesthetic. The roughness of IM Fell English is intentional
