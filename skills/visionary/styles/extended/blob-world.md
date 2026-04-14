# Blob World

**Category:** extended
**Motion tier:** Kinetic

## Typography
- **Display font:** Nunito 700 (or Fredoka 700) — round, soft, lives in the same visual space as blobs
- **Body font:** Nunito Regular
- **Tracking:** -0.01em | **Leading:** 1.6

## Colors
- **Background:** #F0E6FF (soft pastel lavender)
- **Primary action:** #8B5CF6 (purple)
- **Accent:** #F472B6 (pink)
- **Elevation model:** soft blur shadows matching blob color; no hard edges

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 120, damping: 10 }` — continuous organic morphing
- **Enter animation:** blob morphs from collapsed to expanded form, 600ms ease-in-out
- **Forbidden:** sharp corners, geometric shapes, monospace type, hard shadows

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** continuous morph (60% 40% 70% 30% / 30% 60% 40% 70%) — never static

## Code Pattern
```css
.blob {
  border-radius: 60% 40% 70% 30% / 30% 60% 40% 70%;
  animation: blob-morph 8s ease-in-out infinite;
  background: linear-gradient(135deg, #8B5CF6, #F472B6);
}

@keyframes blob-morph {
  0%   { border-radius: 60% 40% 70% 30% / 30% 60% 40% 70%; }
  25%  { border-radius: 40% 60% 30% 70% / 60% 30% 70% 40%; }
  50%  { border-radius: 70% 30% 40% 60% / 40% 70% 30% 60%; }
  75%  { border-radius: 30% 70% 60% 40% / 70% 40% 60% 30%; }
  100% { border-radius: 60% 40% 70% 30% / 30% 60% 40% 70%; }
}
```

## Slop Watch
- Blob morph keyframes must return to the start state at 100% — if start and end values differ, browsers will interpolate an abrupt jump between the last and first frame
- Never add `overflow: hidden` to blob containers — clipping the morph animation cuts off the organic edges that define the aesthetic
