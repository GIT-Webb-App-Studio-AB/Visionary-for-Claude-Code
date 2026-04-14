# Art Nouveau

**Category:** historical
**Motion tier:** Expressive

## Typography
- **Display font:** Libre Baskerville — organic serif with flowing stroke contrast
- **Body font:** Libre Baskerville Regular
- **Tracking:** 0.01em | **Leading:** 1.7 | **Weight range:** 400/700

## Colors
- **Background:** #F5F0E8
- **Primary action:** #4A6741
- **Accent:** #8B4513
- **Elevation model:** soft diffuse shadows (0 4px 24px rgba(74,103,65,0.15))

## Motion
- **Tier:** Expressive
- **Spring tokens:** `stiffness: 120, damping: 15` — flowing, organic
- **Enter animation:** bloom (scale 0.92 + opacity 0 → 1, 400ms ease-out with gentle overshoot)
- **Forbidden:** hard geometric edges, primary-color palettes, mechanical motion

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** highly variable — use organic curves, asymmetric rounding (e.g., `border-radius: 40% 60% 70% 30% / 30% 40% 60% 70%`)

## Code Pattern
```css
.art-nouveau-panel {
  background: #F5F0E8;
  border-radius: 40% 60% 70% 30% / 30% 40% 60% 70%;
  padding: 48px;
  border: 2px solid #4A6741;
  position: relative;
}
.art-nouveau-panel::before {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: inherit;
  border: 1px solid rgba(74, 103, 65, 0.3);
}
.art-nouveau-botanical {
  /* Botanical motifs via SVG clip-path or background-image */
  background-image: url("data:image/svg+xml,...");
  background-repeat: repeat;
  opacity: 0.08;
}
```

## Slop Watch
Organic curves must feel botanical, not bubbly. Avoid candy-like rounded rectangles — the curves of Art Nouveau are asymmetric and purposeful, echoing plant forms and flowing hair. Earth tones only; no primaries.
