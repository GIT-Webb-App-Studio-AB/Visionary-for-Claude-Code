# Neural Network AI

**Category:** graphic
**Motion tier:** Kinetic

## Typography
- **Display font:** Space Mono — monospace node labels, data precision
- **Body font:** Space Mono Regular
- **Tracking:** 0em | **Leading:** 1.5

## Colors
- **Background:** #020814 (compute black)
- **Primary action:** #4A9EFF (electric node blue)
- **Accent:** #00F5D4 (activation teal)
- **Elevation model:** node pulse glow; connection lines as primary structural element

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 200, damping: 20 }`
- **Enter animation:** nodes activate sequentially layer-by-layer, 40ms stagger, with edge-draw animation
- **Forbidden:** static layout, organic curves, warm palettes

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 999px for nodes; 0 for data panels and connection paths

## Code Pattern
```css
.neural-edge {
  stroke: rgba(74, 158, 255, 0.4);
  stroke-width: 1;
  stroke-dasharray: 4 4;
  animation: edge-flow 2s linear infinite;
}

@keyframes edge-flow {
  from { stroke-dashoffset: 0; }
  to   { stroke-dashoffset: -8; }
}
```

## Slop Watch
- Connection edge animation must use stroke-dashoffset, not CSS transform — transform on SVG path children has inconsistent browser support
- Node activation stagger must propagate input→hidden→output (left to right); reversed or random order destroys the neural network metaphor
