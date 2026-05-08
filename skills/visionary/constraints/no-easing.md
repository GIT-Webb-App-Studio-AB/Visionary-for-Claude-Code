---
id: no-easing
category: motion
css_rules:
  - "All animations MUST use linear timing (no ease-in, ease-out, cubic-bezier)"
  - "ZERO use of cubic-bezier(...) or ease/ease-in/ease-out/ease-in-out keywords"
  - "Implementation via animation-timing-function: linear OR transition-timing-function: linear"
invariants:
  - "Every element with non-zero animation-duration OR transition-duration has computed animation-timing-function = 'linear' AND transition-timing-function = 'linear'"
conflict_set: ["no-transitions", "scroll-driven-only", "paused-by-default", "gesture-only"]
rationale: "Linear timing is mechanical — robotic, deliberate, anti-skeuomorphic. Removing all easing rejects the post-iOS-7 convention that motion should feel 'natural' (= ease-out, decelerating). The result reads as digital-honest, terminal-aesthetic, brutalist. Common in developer-tool aesthetics (Linear, Vercel) where motion explicitly does NOT mimic physics."
examples: ["Vercel CLI loading animations 2024-25 (linear)", "Berkeley Mono brand animations", "Brutalist dev tools — Tea, Bun"]
---

# no-easing

Linear motion only. No cubic-bezier curves. No ease-in/out. The aesthetic
is mechanical, terminal, anti-skeuomorphic.

## Compliant patterns

```css
.btn {
  transition: transform 200ms linear;
}

@keyframes spin { to { transform: rotate(360deg); } }

.spinner {
  animation: spin 2s linear infinite;
}
```

## Non-compliant

```css
.btn { transition: transform 200ms ease-out; }
.btn { transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1); }
```

## Validation

Walk elements with non-zero `animation-duration` or `transition-duration`.
Pass if every such element has computed `animation-timing-function = 'linear'`
AND `transition-timing-function = 'linear'`.
