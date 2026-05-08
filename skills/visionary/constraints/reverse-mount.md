---
id: reverse-mount
category: motion
css_rules:
  - "At least 1 visible element MUST animate OUT on initial mount, becoming visible only after the animation completes"
  - "Implementation: animation that starts visible and goes to opacity: 0 OR transform-out, with animation-fill-mode: backwards delaying the visible state"
  - "Effect: visitor sees nothing for ~300ms, then the element appears"
invariants:
  - "DOM contains at least 1 element with computed animation-direction = 'reverse' OR animation-delay > 200ms with animation-fill-mode = 'backwards' AND opacity = 0 in the from-state"
conflict_set: ["no-transitions", "infinite-loop-mandatory", "scroll-driven-only", "gesture-only"]
rationale: "Reverse-mount is the late-2010s avant-garde web move — the page loads, then content disappears, then re-emerges. It rejects the immediate-content-display convention and creates a deliberate moment of withholding. Reference to art-installation pacing where the work doesn't appear until the visitor has settled. Common in fashion microsite teasers and in editorial portfolio reveals."
examples: ["Études Studio teaser sites 2024", "Aaron Lowell Denton portfolio 2024 — content emerges from invisibility", "Pentagram microsites 2025"]
---

# reverse-mount

Content animates from visible to invisible (or hidden) on initial load,
then reappears. Creates a deliberate moment of withholding.

## Compliant patterns

```css
@keyframes appear {
  0%   { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

.headline {
  animation: appear 0.6s ease both;
  animation-delay: 400ms;
  animation-fill-mode: backwards;  /* invisible until delay completes */
}
```

## Non-compliant

```css
.headline { opacity: 1; }   /* visible from the start — banned */
```

## Validation

Walk visible elements. Pass if at least one has computed
`animation-fill-mode = 'backwards'` AND `animation-delay > 200ms` AND
the keyframe `from` state has opacity = 0 OR transform != 'none'.
