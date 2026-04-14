# Glassmorphism

**Category:** morphisms
**Motion tier:** Expressive

## Typography
- **Display font:** Space Grotesk — geometric warmth reads well over blurred backgrounds without competing
- **Body font:** Inter
- **Tracking:** -0.01em | **Leading:** 1.55

## Colors
- **Background:** #0f0f1a — deep near-black that saturates the blur effect
- **Primary action:** rgba(255,255,255,0.9) text on #6366f1 pill button
- **Accent:** #a78bfa — violet that vibrates against dark glass
- **Elevation model:** glows — inset box-shadow + outer diffuse glow, no hard drop shadows

## Motion
- **Tier:** Expressive
- **Spring tokens:** snappy (panel open), ui (hover lift), gentle (backdrop reveal)
- **Enter animation:** fade-up with blur-in (filter: blur(8px)→blur(0) + translateY(12px)→0)
- **Forbidden:** opacity-only fades (flat), scale-bounce on panels (kills glass illusion)

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 20px panels, 12px inputs, 999px pills — generous rounding reinforces softness

## Code Pattern
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.05) inset,
    0 8px 32px rgba(0,0,0,0.4);
}
```

## Slop Watch
- **Too much blur:** backdrop-filter: blur(60px) turns panels into smears — 20-28px is the sweet spot
- **White overlay abuse:** rgba(255,255,255,0.3) looks like a broken opacity, not glass — keep alpha ≤ 0.12
