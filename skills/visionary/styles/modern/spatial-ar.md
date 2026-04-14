# Spatial / AR (Speculative)

**Category:** modern
**Motion tier:** Expressive

## Typography
- **Display font:** SF Pro Display (system-ui on Apple, or Inter fallback) — designed for spatial rendering
- **Body font:** SF Pro Text (system-ui)
- **Tracking:** 0em | **Leading:** 1.5 | **Weight range:** 300/400/500/600

## Colors
- **Background:** rgba(0,0,0,0) (transparent — overlaid on real world or spatial canvas)
- **Primary action:** #FFFFFF
- **Accent:** rgba(99,102,241,0.9) (indigo — depth-aware tint)
- **Elevation model:** spatial depth — blur + scale to simulate z-axis; near elements larger, far elements smaller + blurred

## Motion
- **Tier:** Expressive
- **Spring tokens:** `stiffness: 140, damping: 16` — weighted, as if in physical space
- **Enter animation:** depth-emerge (scale 0.7 + blur(8px) + translateZ(-100px) → 1 + blur(0) + translateZ(0), 400ms)
- **Forbidden:** 2D-only motion (no x/y slides without z-axis awareness), instant transitions (spatial interfaces need gravitational weight)

## Spacing
- **Base grid:** 8px; but spatial context may require angular measurement (degrees of visual field) over pixel units
- **Border-radius vocabulary:** 16px–24px — rounded forms read better in spatial context; sharp edges cause visual tension against organic real-world backgrounds

## Code Pattern
```css
.spatial-panel {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 32px 80px rgba(0, 0, 0, 0.5);
  /* Simulated depth layer */
  transform: perspective(1000px) translateZ(0px);
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.spatial-panel:hover {
  transform: perspective(1000px) translateZ(20px);
}
```

## Slop Watch
Spatial UI is speculative — this file defines patterns for visionOS/AR contexts, not standard web. Do not apply spatial depth tokens to flat web interfaces; they will look like failed glassmorphism. Clearly annotate when generating spatial UI that it targets spatial computing platforms.
