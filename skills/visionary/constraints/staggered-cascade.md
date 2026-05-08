---
id: staggered-cascade
category: motion
css_rules:
  - "At least 3 elements MUST animate in with stagger >= 100ms between adjacent elements"
  - "Implementation via animation-delay incrementing across siblings (nth-child or motion stagger)"
  - "The cascade should be visible — items appear in sequence, not in a single beat"
invariants:
  - "DOM contains at least 3 elements with computed animation-delay values that differ by >= 100ms across adjacent siblings"
conflict_set: ["no-transitions", "scroll-driven-only", "paused-by-default", "gesture-only"]
rationale: "Staggered-cascade animation creates rhythm and tells the visitor 'this section has multiple distinct items'. Pioneered by iOS app launch animations (icons cascade in 50ms apart) and adapted by motion-design-aware web (Linear's docs nav, Apple's product grids). The 100ms threshold is the perceptual minimum — below that, the eye reads the cascade as simultaneous."
examples: ["Apple product-grid loads 2024-25", "Linear's sidebar nav stagger 2025", "Notion's onboarding flow 2024"]
---

# staggered-cascade

Items animate in with deliberate sequence. At least 3 elements with
≥100ms stagger between them. Communicates that the section contains
multiple distinct atoms.

## Compliant patterns

```css
@keyframes lift {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.grid > .card { animation: lift 0.4s ease both; }
.grid > .card:nth-child(1) { animation-delay: 0ms;   }
.grid > .card:nth-child(2) { animation-delay: 100ms; }
.grid > .card:nth-child(3) { animation-delay: 200ms; }
.grid > .card:nth-child(4) { animation-delay: 300ms; }
```

## Non-compliant

```css
.grid > .card { animation: lift 0.4s; }   /* all simultaneous — banned */
```

## Validation

Walk elements with non-zero `animation-delay`. Group by parent. For each
group, sort by delay. Pass if any group has ≥ 3 children where adjacent
delays differ by ≥ 100ms.
