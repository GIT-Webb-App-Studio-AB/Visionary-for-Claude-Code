---
id: infinite-loop-mandatory
category: motion
css_rules:
  - "At least 1 visible element MUST have animation-iteration-count: infinite"
  - "Examples: rotating logo, breathing background, marquee text, pulsing accent"
  - "Must respect prefers-reduced-motion: reduce — when reduced, animation-play-state: paused"
invariants:
  - "DOM contains at least 1 visible element with computed animation-iteration-count = 'infinite' AND animation-name != 'none'"
conflict_set: ["no-transitions", "paused-by-default", "gesture-only", "scroll-driven-only", "reverse-mount"]
rationale: "An infinite-loop animation in a static layout is the brutalist-web move — a perpetually-rotating logo, a subtle breathing gradient, a marquee that never stops. The motion gives the page a heartbeat. The constraint must respect WCAG 2.2.2 (>5s motion needs pause control), so the implementation includes user-stoppable infinite loops."
examples: ["Vercel infinite logo rotation 2024", "Marquee.live aesthetic", "Y Combinator's startup-school pages — perpetual logo orbit"]
---

# infinite-loop-mandatory

A perpetually-running animation somewhere on the page. Gives the design
a heartbeat. Must respect prefers-reduced-motion AND provide pause control
for compliance with WCAG 2.2.2.

## Compliant patterns

```css
@keyframes rotate { to { transform: rotate(360deg); } }

.logo {
  animation: rotate 12s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .logo { animation-play-state: paused; }
}
```

```html
<button onclick="toggleMotion()">Pause / Play</button>  <!-- WCAG 2.2.2 -->
```

## Non-compliant

```css
.logo { animation: rotate 12s linear; }   /* count = 1, not infinite */
```

## Validation

Walk visible elements. Pass if at least one has computed
`animation-iteration-count = 'infinite'` AND `animation-name != 'none'`.
