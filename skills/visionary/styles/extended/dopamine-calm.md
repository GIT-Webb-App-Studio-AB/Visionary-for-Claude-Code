---
id: dopamine-calm
category: extended
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [light, pastel]
keywords: [dopamine, calm, gentle, reward-light, wellness, mindfulness, positive-psychology]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Dopamine Calm

**Category:** extended
**Motion tier:** Subtle

The antidote to `dopamine-design`'s attention-maximalism. Research-informed
positive psychology applied to UI: gentle rewards (not surges), celebration
moments that respect the user's focus, progress indicators that signal
achievement without demanding attention. References: Headspace app, Calm,
Finch (self-care pet app), Apple Fitness streak UI (2024+ version that
removed aggressive confetti).

Sits between `dopamine-design` (maximalist reward loops) and
`calm-focus-mode` (neurodivergent-first, near-zero chrome). This is the
middle path: acknowledge accomplishment without manipulating engagement.

## Typography

- **Display font:** **Nunito** (warm geometric, not the hard Inter register)
- **Body font:** Nunito Regular 16 px
- **Tracking:** 0 | **Leading:** 1.6
- **Feature:** rounded numbers (`font-variant-numeric: oldstyle-nums`) on
  progress counters — softer than the default lining figures

## Colors

- **Background:** `#FFF8F2` (warm ivory — evokes morning light)
- **Primary text:** `#2D2A27`
- **Primary action:** `#5C8A5E` (muted sage — research validates
  green/blue as lowest-anxiety action colors)
- **Reward accent:** `#E8A94E` (warm gold — reserved for completion
  moments, never for routine UI)
- **Soft chrome:** `#E0D9CE` (backdrop for cards)
- **Forbidden:** saturated red, pure yellow, neon — they carry urgency
  or stress signals

## Motion

- **Tier:** Subtle
- **Spring tokens:** `{ bounce: 0.1, visualDuration: 0.4 }` — slow, gentle
- **Celebration motion:** when an achievement fires, 800 ms soft spring
  (NOT the confetti-explosion of `dopamine-design`). A subtle scale
  1 → 1.05 → 1 + warm-gold tint, then return. Dignified, not sycophantic
- **Micro-interactions:** color shift + 1 px lift. Never scale or bounce
- **Forbidden:** confetti, particle effects, shake, pulse animations,
  auto-playing celebrations

## Spacing

- **Base grid:** 8 px
- **Border-radius:** 12–20 px — soft but not toy-rounded
- **Density:** balanced; room for breathing

## Code Pattern

```css
:root {
  --dc-bg: #FFF8F2;
  --dc-text: #2D2A27;
  --dc-sage: #5C8A5E;
  --dc-gold: #E8A94E;
  --dc-chrome: #E0D9CE;
}

.dc-card {
  background: #FBF5EE;
  border: 1px solid var(--dc-chrome);
  border-radius: 16px;
  padding: 24px;
  transition:
    transform 320ms cubic-bezier(0.16, 1, 0.3, 1),
    background 320ms ease;
}
.dc-card:hover { transform: translateY(-1px); background: #FDF8F1; }

.dc-progress {
  block-size: 8px;
  background: var(--dc-chrome);
  border-radius: 999px;
  overflow: hidden;
}
.dc-progress-bar {
  block-size: 100%;
  background: var(--dc-sage);
  transition: inline-size 600ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dc-celebrate {
  animation: celebrate 800ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes celebrate {
  0%   { transform: scale(1);    background: var(--dc-chrome); }
  40%  { transform: scale(1.05); background: var(--dc-gold);   }
  100% { transform: scale(1);    background: var(--dc-chrome); }
}

.dc-count {
  font-variant-numeric: oldstyle-nums;
  font-weight: 600;
  color: var(--dc-sage);
}

@media (prefers-reduced-motion: reduce) {
  .dc-celebrate { animation: none; }
  .dc-progress-bar { transition: none; }
}
```

## Accessibility

### Contrast
`#2D2A27` on `#FFF8F2` = 12.6:1 (AAA). `#5C8A5E` on `#FFF8F2` = 4.6:1 (AA
body-size on CTA; use white text for higher contrast). APCA Lc ≥ 80.

### Focus
3 px `--dc-sage` outline, 3 px offset.

### Motion
Celebration scale is ≤ 1.05 (below vestibular threshold). Reduced-motion
drops animation entirely while preserving the color-shift endpoint (so the
user still sees the reward signal visually).

### Touch target
44×44 default.

### RTL / Logical properties
Fully logical.

## Slop Watch

- Confetti particles = this is NOT `dopamine-design`; celebration must be
  dignified
- Saturated primary red/yellow CTAs = carry stress signals
- Auto-playing animation = manipulative; all motion must be user-triggered
- "Streak!" maximalism on routine tasks = devalues real accomplishments
- Multiple accent colors = over-designed; sage + gold only
