# Dreamcore (Extended)

**Category:** extended/dreamcore
**Motion tier:** Subtle

## Typography
- **Display font:** EB Garamond italic — dreamlike serif, hand-drawn optical irregularities
- **Body font:** EB Garamond 400
- **Tracking:** -0.02em | **Leading:** 1.8
- **Feature:** Text opacity varies (0.6–1.0) to create depth through transparency layers

## Colors
- **Background:** #FAF9F2 (washed cream, slightly yellowed like old photograph)
- **Primary text:** #5A4A3A (warm brown, almost invisible from distance)
- **Accent:** #E8D4B0 (sand/parchment overlay)
- **Ghost color:** #F5F5C8 (pale yellow, used for spectral elements)
- **Elevation model:** layered transparency creates spatial depth; no sharp shadows

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 180, damping: 35, mass: 1.1 }` — slow, dreamy, weightless
- **Enter animation:** dissolve fade — opacity 0 → 0.8 over 600ms ease-out, elements staggered 80ms apart
- **Micro-interactions:** elements drift slightly (±2px vertical) on hover, super slow
- **Forbidden:** bright colors, fast animations, sharp borders, dark modes, saturation

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 4–12px; soft blur suggests unformed edges
- **Whitespace ratio:** 60% minimum — vastness and void are the core aesthetic

## Code Pattern
```css
.dreamcore-container {
  background: linear-gradient(180deg, #FAF9F2 0%, #F5F5E8 100%);
  padding: 48px;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dreamcore-element {
  color: #5A4A3A;
  opacity: 0.75;
  transition: opacity 300ms ease;
  font-style: italic;
}

.dreamcore-element:hover {
  opacity: 0.95;
}

.dreamcore-accent-line {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, #E8D4B0 50%, transparent 100%);
  margin: 64px 0;
  width: 100%;
}

@media (prefers-reduced-motion: no-preference) {
  .dreamcore-drift {
    animation: slow-drift 8s ease-in-out infinite;
  }
  
  @keyframes slow-drift {
    0%, 100% { transform: translateY(0); opacity: 0.7; }
    50% { transform: translateY(-4px); opacity: 0.8; }
  }
}
```

## Slop Watch
- Colors must stay in the pale, unsaturated range (HSL saturation ≤ 20%) — vibrant colors destroy the washed-out dreamstate
- Never use pure black (#000) or dark charcoal — stick to warm browns and taupes
- Whitespace and void are sacred — do not fill empty space
- Motion should be barely perceptible; emphasis movement breaks the trance
- Text opacity should vary slightly per element to create layered, ghostly feeling
