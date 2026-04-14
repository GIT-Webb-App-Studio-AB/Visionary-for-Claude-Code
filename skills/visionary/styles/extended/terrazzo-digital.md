# Terrazzo Digital

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Neue Haas Grotesk — clean industrial sans that doesn't compete with the pattern
- **Body font:** DM Sans
- **Tracking:** 0em | **Leading:** 1.55

## Colors
- **Background:** Terrazzo chip pattern (terracotta #C8714F + teal #4A9B8F + cream #F5EDD8)
- **Primary action:** #1C1C1C (neutral dark)
- **Accent:** #C8714F (terracotta dominant)
- **Elevation model:** subtle drop shadows; terrazzo is a floor material with physical weight

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 200, damping: 28 }`
- **Enter animation:** fade 200ms ease-out
- **Forbidden:** neon, gradients over the pattern, anything that competes with the chip texture

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8–16px; polished terrazzo surfaces are smooth and rounded at edges

## Code Pattern
```css
.terrazzo-surface {
  background-color: #F5EDD8;
  background-image:
    radial-gradient(circle at 20% 30%, #C8714F 0, #C8714F 6px, transparent 6px),
    radial-gradient(circle at 70% 60%, #4A9B8F 0, #4A9B8F 4px, transparent 4px),
    radial-gradient(circle at 45% 80%, #C8714F 0, #C8714F 3px, transparent 3px),
    radial-gradient(circle at 85% 20%, #4A9B8F 0, #4A9B8F 5px, transparent 5px),
    radial-gradient(circle at 35% 50%, #A8956A 0, #A8956A 4px, transparent 4px);
}
```

## Slop Watch
- Terrazzo chip placement must look random — evenly distributed chips read as a pattern repeat, not natural stone; use varied positions and sizes
- Keep chip sizes varied (3–8px radius); uniform chip sizes look digital/artificial rather than stone aggregate
