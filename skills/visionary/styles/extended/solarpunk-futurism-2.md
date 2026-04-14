# Solarpunk Futurism (Extended)

**Category:** extended/solarpunk
**Motion tier:** Expressive

## Typography
- **Display font:** Inter Bold with variable optical sizing
- **Body font:** Inter Regular, 16px base
- **Tracking:** -0.01em | **Leading:** 1.6
- **Unique feature:** Animated typeface weight shifts on interaction

## Colors
- **Background:** #1A3A2A (deep forest-green, OLED-safe)
- **Primary action:** #66D66D (living green, photosynthesis metaphor)
- **Accent:** #FFD700 (solar gold, warm optimism)
- **Secondary accent:** #2DD4BF (teal — water, growth)
- **Elevation model:** soft luminous shadows (solar halo effect, never dark shadows)

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 320, damping: 26, mass: 0.95 }` — growth feeling, organic flourish
- **Enter animation:** expand + glow — scale 0.8 → 1, opacity 0, 400ms ease-out with luminous halo
- **Micro-interactions:** leaf flutter on scroll, photocell pulse on focus
- **Forbidden:** grey, brown, sharp contrasts, dystopian symbolism, decay aesthetics

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 12–24px; organic soft curves inspired by leaf edges
- **Gap patterns:** Breathing room between elements; asymmetric spacing signals natural growth

## Code Pattern
```css
.solarpunk-container {
  background: linear-gradient(135deg, #1A3A2A 0%, #1F4D2F 100%);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(102, 214, 109, 0.12), 
              inset 0 1px 0 rgba(102, 214, 109, 0.08);
  position: relative;
  overflow: hidden;
}

.solarpunk-accent {
  color: #66D66D;
  font-weight: 700;
  text-shadow: 0 0 12px rgba(102, 214, 109, 0.3);
}

@media (prefers-reduced-motion: no-preference) {
  .solarpunk-element {
    animation: solar-pulse 3s ease-in-out infinite;
  }
  
  @keyframes solar-pulse {
    0%, 100% { box-shadow: 0 0 8px rgba(102, 214, 109, 0.2); }
    50% { box-shadow: 0 0 24px rgba(102, 214, 109, 0.4); }
  }
}
```

## Slop Watch
- The primary green must remain vivid (saturation ≥ 70%) — desaturated greens lose the "living energy" of solarpunk
- Never use dark, muddy browns or greys — they contradict the optimistic future aesthetic
- Solar gold should appear sparingly (max 15% of surface) to avoid overwhelming the green foundation
- Motion must feel organic and hopeful, never mechanical or threatening
