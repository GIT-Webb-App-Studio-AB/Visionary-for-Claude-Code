# Claymorphism

**Category:** morphisms
**Motion tier:** Expressive

## Typography
- **Display font:** Nunito 700 — rounded terminals echo the inflated 3D form language
- **Body font:** Nunito 400
- **Tracking:** -0.01em | **Leading:** 1.5

## Colors
- **Background:** #F5E6FF — lavender pastel that reads as "soft plastic"
- **Primary action:** #7C3AED — saturated violet with white text
- **Accent:** #FB923C — warm orange for contrast without aggression
- **Elevation model:** thick drop shadow + inner highlight — creates inflated 3D blob illusion

## Motion
- **Tier:** Expressive
- **Spring tokens:** bounce (card hover), snappy (button press), layout (list reorder)
- **Enter animation:** scale from 0.85 + slight overshoot (spring with damping 0.6)
- **Forbidden:** sharp transforms, linear easing, anything with 0 bounce — kills the inflated material feel

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 24px minimum on all elements, 32px cards, 999px pills — nothing below 20px

## Code Pattern
```css
.clay-card {
  background: linear-gradient(145deg, #f0e6ff, #e8d5fa);
  border-radius: 28px;
  box-shadow:
    0 20px 60px rgba(124, 58, 237, 0.25),
    0 8px 20px rgba(124, 58, 237, 0.15),
    inset 0 2px 4px rgba(255,255,255,0.7);
  border: 1px solid rgba(255,255,255,0.5);
}
```

## Slop Watch
- **Thin shadows:** A 2px drop shadow on a claymorphism card looks like a bug — shadows need to be deep and diffuse (20px+ blur)
- **Dark color palette:** Claymorphism needs pastels; dark clay becomes murky and loses the inflated 3D read
