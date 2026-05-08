---
id: gesture-only
category: motion
css_rules:
  - "ZERO animations exist independent of user gesture"
  - "Implementation: only :hover, :focus, :active, :focus-visible, :focus-within, [data-active], onclick-toggled animations"
  - "No on-load fade-ins, no on-scroll reveals, no auto-play loops"
invariants:
  - "Every element with animation-name != 'none' OR transition-duration > 0 must be inside a selector pattern that is gesture-triggered (:hover, :focus, etc.)"
  - "Operationally: when the document loads with no user interaction, NO element has computed transform/opacity/etc. that is mid-animation"
conflict_set: ["no-transitions", "infinite-loop-mandatory", "scroll-driven-only", "paused-by-default", "reverse-mount"]
rationale: "Gesture-only motion is the most-restrained kinetic posture — the page reveals nothing animated until you reach for it. References desktop-application UX (a button has hover state, a slider has drag state, but the window opens in static-ready position). Rejects the marketing-site default of staggered-fade-ins-on-load that signal 'this site is animated' before the visitor has engaged."
examples: ["macOS native apps 2025 — gesture-only", "Linear 2025 — minimal motion until interaction", "Are.na 2025"]
---

# gesture-only

Motion exists only as a response to user gesture. No motion fires on
load, scroll, or auto-timer. Reference to native desktop UX.

## Compliant patterns

```css
.btn {
  background: blue;
  transition: transform 200ms ease;
}
.btn:hover { transform: scale(1.05); }
.btn:active { transform: scale(0.98); }
```

## Non-compliant

```css
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
.hero { animation: fade-in 0.6s; }   /* on-load — banned */
```

## Validation

Capture computed style on document load (no interaction). Walk elements.
Pass if NO element shows mid-animation computed values, AND any
animation/transition rules in the stylesheet are inside gesture selectors
(:hover, :focus, :active, :focus-within, etc.) or class-toggle-driven.
