# Data Physicalization

**Category:** extended
**Motion tier:** Expressive

## Typography
- **Display font:** IBM Plex Mono — data labels with technical authority
- **Body font:** IBM Plex Sans
- **Tracking:** 0em | **Leading:** 1.5

## Colors
- **Background:** #F8F8F8 (clean data canvas)
- **Primary action:** Data-driven palette (generated from dataset)
- **Accent:** Outlier highlight — contrast against data range
- **Elevation model:** physical metaphor — data bars cast shadows proportional to value

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 180, damping: 20 }`
- **Enter animation:** data-enter — each element animates from baseline value (0 or min) to actual value, 600ms staggered
- **Forbidden:** decorative animation unrelated to data, fixed color palettes ignoring data distribution

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px or data-driven (radius proportional to value for bubble charts)

## Code Pattern
```css
.data-bar {
  background: var(--data-color);
  height: var(--data-height);
  transform-origin: bottom;
  animation: data-grow 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes data-grow {
  from { transform: scaleY(0); opacity: 0; }
  to   { transform: scaleY(1); opacity: 1; }
}
```

## Slop Watch
- Every visual encoding must have a data justification — decorative size/color variation without data backing destroys the physicalization honesty
- Animation must start from baseline (0 or minimum), not from random values; enter from wrong state makes data relationships misleading during transition
