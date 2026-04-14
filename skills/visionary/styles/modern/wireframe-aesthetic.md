# Wireframe Aesthetic

**Category:** modern
**Motion tier:** Subtle

## Typography
- **Display font:** Courier New — intentionally lo-fi, references hand-drawn wireframe annotation
- **Body font:** Courier New Regular
- **Tracking:** 0em | **Leading:** 1.5 | **Weight range:** 400/700

## Colors
- **Background:** #FFFFFF
- **Primary action:** #000000
- **Accent:** #767676
- **Elevation model:** 1px solid #000000 borders only — sketch-on-paper aesthetic

## Motion
- **Tier:** Subtle
- **Spring tokens:** `stiffness: 400, damping: 40`
- **Enter animation:** sketch-draw (SVG stroke-dashoffset on border elements, 200ms)
- **Forbidden:** color fills, gradients, shadows, rounded corners, images (use placeholder rectangles)

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px — wireframe boxes are rectangular by definition

## Code Pattern
```css
.wireframe-box {
  border: 1px solid #000000;
  padding: 16px;
  background: #FFFFFF;
  position: relative;
}
.wireframe-image-placeholder {
  border: 1px solid #000000;
  background: #F0F0F0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #767676;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
}
.wireframe-image-placeholder::before {
  content: '';
  position: absolute;
  top: 0; left: 0; bottom: 0; right: 0;
  background: linear-gradient(to bottom right, transparent calc(50% - 0.5px), #000 calc(50% - 0.5px), #000 calc(50% + 0.5px), transparent calc(50% + 0.5px)),
              linear-gradient(to bottom left,  transparent calc(50% - 0.5px), #000 calc(50% - 0.5px), #000 calc(50% + 0.5px), transparent calc(50% + 0.5px));
}
```

## Slop Watch
Wireframe aesthetic must signal intentionality — it looks like a wireframe because it IS the interface concept, not because it is unfinished. Include explicit placeholder language ([Image 400×300], [Chart], [User Name]) to complete the intentional lo-fi signal.
