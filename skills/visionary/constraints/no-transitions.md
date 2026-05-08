---
id: no-transitions
category: motion
css_rules:
  - "ZERO use of CSS transition property OR JS-driven animations"
  - "ZERO @keyframes or animation properties"
  - "ZERO motion/react animate, framer-motion animate"
  - "Hover/focus state changes happen instantly with no transition"
invariants:
  - "Every visible element has computed transition-duration = 0s AND animation-duration = 0s OR animation-name = 'none'"
conflict_set: ["infinite-loop-mandatory", "scroll-driven-only", "paused-by-default", "gesture-only", "staggered-cascade", "reverse-mount", "no-easing"]
rationale: "Static, no-motion design is the opposite of the everything-animates-on-scroll default that has dominated marketing sites since Stripe's 2018 rebrand. Removing all transitions forces the design to communicate purely through composition and color — no kinetic crutches. References classical print, brutalist web, and the Are.na editorial aesthetic where instantaneous state changes feel honest, not flashy."
examples: ["Are.na 2025 — instantaneous hover states", "Brutalist web archive sites", "Pen.com (Pen Magazine archive site)"]
---

# no-transitions

Zero motion. Every state change is instantaneous. The design
communicates through composition alone — no kinetic effects.

## Compliant patterns

```css
.btn { background: blue; }
.btn:hover { background: navy; }   /* no transition — instant change */
```

## Non-compliant

```css
.btn { transition: background 200ms; }
@keyframes fade { 0% { opacity: 0; } 100% { opacity: 1; } }
```

## Validation

Walk all visible elements. Pass if every element has computed
`transition-duration = 0s` AND (`animation-duration = 0s` OR
`animation-name = 'none'`).
