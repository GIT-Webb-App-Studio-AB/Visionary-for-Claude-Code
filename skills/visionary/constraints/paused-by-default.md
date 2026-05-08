---
id: paused-by-default
category: motion
css_rules:
  - "All animated elements MUST start with animation-play-state: paused"
  - "Animation runs (play-state: running) only on hover, focus, or click"
  - "Implementation: keyframes defined, animation declared, animation-play-state toggled by interaction"
invariants:
  - "Every element with animation-name != 'none' has computed animation-play-state = 'paused' on initial render"
  - "AND a hover/focus/click rule changes animation-play-state to 'running'"
conflict_set: ["no-transitions", "infinite-loop-mandatory", "scroll-driven-only", "gesture-only", "reverse-mount"]
rationale: "Default-paused animation rejects the auto-play, attention-stealing motion of the post-2018 marketing-site era. Visitors arrive in a calm composition; motion happens only when they choose to engage. References the museum-installation aesthetic where exhibits activate on viewer presence, and the editorial print habit of letting the reader find motion in their own eye-tracks rather than imposing it."
examples: ["MoMA online exhibitions 2024 — hover-activated motion", "Aperture web essays 2025"]
---

# paused-by-default

Animations exist, but start paused. Visitor-initiated motion only. The
page is a still composition until you engage with it.

## Compliant patterns

```css
@keyframes wobble {
  0%, 100% { transform: rotate(-2deg); }
  50%      { transform: rotate(2deg); }
}

.figure {
  animation: wobble 1.6s ease-in-out infinite;
  animation-play-state: paused;
}

.figure:hover, .figure:focus-within {
  animation-play-state: running;
}
```

## Non-compliant

```css
.figure { animation: wobble 1.6s infinite; }  /* runs on load — banned */
```

## Validation

Walk elements with `animation-name != 'none'`. Pass if computed
`animation-play-state = 'paused'` for every such element on initial render.
