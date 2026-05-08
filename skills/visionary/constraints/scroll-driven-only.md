---
id: scroll-driven-only
category: motion
css_rules:
  - "All animations MUST be driven by scroll-timeline or view-timeline (the CSS scroll-driven animations spec)"
  - "ZERO time-based animations (animation-duration > 0 with no scroll-timeline)"
  - "Implementation via animation-timeline: scroll() OR animation-timeline: view()"
invariants:
  - "Every element with animation-name != 'none' has computed animation-timeline that is NOT 'auto' (= time-based)"
  - "I.e. animation-timeline ∈ {scroll(...), view(...), <custom-timeline-name>}"
conflict_set: ["no-transitions", "infinite-loop-mandatory", "paused-by-default", "gesture-only", "reverse-mount", "no-easing"]
rationale: "Scroll-driven animations are the 2024-baseline-supported way to bind motion to scroll progress without JS. The aesthetic is the post-Stripe scrollytelling default but executed via CSS rather than libraries. The constraint forces all motion to be user-controlled — the visitor's scroll IS the playhead. Reading speed = animation speed."
examples: ["NYT scrollytelling 2025 (Atlas of Time)", "Apple iPhone 17 Pro page 2025", "Vercel ship-2025 site (full scroll-timeline)"]
---

# scroll-driven-only

All motion bound to scroll. No time-based animations. The user's scroll
controls the playhead.

## Compliant patterns

```css
@keyframes reveal {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}

.section {
  animation: reveal both;
  animation-timeline: view();
  animation-range: entry 0% cover 30%;
}
```

## Non-compliant

```css
.section {
  animation: reveal 0.6s ease both;   /* time-based — banned */
}
```

## Validation

Walk elements with `animation-name != 'none'`. Pass if every such element
has computed `animation-timeline` that is NOT `auto`.
