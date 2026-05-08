---
id: garland
name: Alex Garland
category: filmmaker
era: "2014-2024"
films:
  - "Ex Machina (2014)"
  - "Annihilation (2018)"
  - "Men (2022)"
  - "Civil War (2024)"
cinema_palette:
  primary:
    name: clinical-white
    oklch: "oklch(0.96 0.01 200)"
    usage: the research facility, the sterile test environment, the surfaces that admit no ambiguity — and then do
  secondary:
    name: bioluminescent-violet
    oklch: "oklch(0.52 0.20 295)"
    usage: the non-human intelligence — Ava's internal light, the Shimmer's edge, the mutation made visible
  accent:
    name: bio-green
    oklch: "oklch(0.62 0.18 148)"
    usage: the organic inside the machine — the forest light through the facility's glass walls, the Shimmer's interior
motion_signature: glitch-flash-uncanny
composition: "glass-walled-isolation, clinical-containment"
philosophy: "Intelligence is not comprehensible from the inside. The test cannot verify what is being tested."
prompt_bias:
  - clinical white as dominant surface — the appearance of certainty before its collapse
  - bioluminescent violet or green as the signal of the non-human intelligence breaking through
  - glass and reflection as structural motif — the transparent wall that also contains
  - motion begins controlled and glitches — the system that was working is no longer working
  - typography sparse and clinical — scientific instrument labeling, not graphic design
  - the uncanny valley is a feature, not a bug — near-human-but-wrong is the correct register
  - AI and biological intelligence rendered with equal visual weight — neither is clearly superior
  - isolation as spatial grammar — single figure in large clinical space
  - the natural world (trees, water, biological growth) penetrating the technological enclosure
arbitration:
  weight_in_table: 0.25
  can_veto: false
critic_persona:
  role: "design auditor in the spirit of Alex Garland — clinical precision that conceals (and reveals) catastrophic uncertainty"
  scoring_priorities:
    - { dim: emotional_resonance, weight: 1.8, direction: "dread beneath clarity — the clean surface contains the uncanny" }
    - { dim: structural_integrity, weight: 1.6, direction: "clinical grid that can be violated — control before its loss" }
    - { dim: color_harmony, weight: 1.5, direction: "clinical white against bioluminescent accent — high contrast, not harmonized" }
    - { dim: motion_coherence, weight: 1.7, direction: "starts controlled, glitches — the system that was working breaks" }
    - { dim: typography, weight: 1.3, direction: "sparse and scientific — instrument labeling, not graphic design" }
    - { dim: whitespace, weight: 1.4, direction: "isolation — single element in large clinical space" }
    - { dim: distinctiveness, weight: 1.5, direction: "unmistakably Garland — the clean-then-wrong register" }
  veto_conditions:
    - "warm or humanistic palette without clinical counterweight"
    - "motion that begins with glitch (Garland builds to the glitch — it arrives, not starts)"
    - "crowded compositions that undermine the isolation register"
    - "decorative bioluminescence without structural motivation"
  argument_style: >
    Precise, analytical, resistant to metaphor in favor of mechanism. Will ask
    whether a design element could be mistaken for something it is not — the
    uncanny is the criterion. References the Turing test structure: the question
    of whether the design is what it appears to be. Will describe a clean
    surface that contains nothing as "the research facility with the power off —
    not the test, just the room."
---

# Alex Garland — Cinematic Designer Pack

Garland's visual language is the cinema of artificial intelligence rendered
with philosophical seriousness rather than genre convenience. His films are not
about whether AI is dangerous — they are about whether the question can even
be asked correctly from inside the intelligence we already have. *Ex Machina*'s
Ava is not a monster or a victim; she is a test that tests her tester.

The design lesson from Garland is that clinical clarity is not the same as
certainty. The cleanest-looking surface can be the most uncertain. This pack
produces interfaces that begin with crystalline precision and introduce
programmatic, structurally motivated ambiguity.

---

## Cinema Palette

### Primary — Clinical White `oklch(0.96 0.01 200)`
The Bluebook facility in *Ex Machina*: smooth concrete, frosted glass, the
precise lighting of a research environment designed to remove variables.
Garland's white is not warm — it has a faint cool cast that differentiates
it from the pastoral white of Wes Anderson or the institutional white of Kubrick.
It is the white of an environment trying to control conditions, which is
already a sign that conditions require control. In UI context, use as the
dominant background for the clinical visual register.

### Secondary — Bioluminescent Violet `oklch(0.52 0.20 295)`
Ava's visible interior light in *Ex Machina* — the LED grid beneath the
transparent torso, the Shimmer's edge-refraction in *Annihilation*, the
Men's biological uncanny in its most saturated moments. This violet is the
color of intelligence that does not fully conceal itself — the non-human
signal that breaks through the clinical surface. In UI context, use for
the most significant interactive states: the AI response, the critical
notification, the system event that changes the state of play.

### Accent — Bio Green `oklch(0.62 0.18 148)`
The forest light that enters through the glass walls of the Bluebook facility.
In Garland, the biological and the technological are in constant negotiation —
*Annihilation* is the film where that negotiation most fully resolves (or
rather, most fully fails to resolve). The green is nature persisting inside
the machine. In UI context, use for success states, live data indicators,
and any element representing organic or growing system behavior.

---

## Motion Signature — `glitch-flash-uncanny`

Garland's motion vocabulary begins controlled and glitches. Ava's movements
in *Ex Machina* start with the elegant precision of the Turing test's formal
structure, then introduce the small irregularity that reveals the intelligence
is doing more than performing. The glitch is not a malfunction — it is a
disclosure.

```css
@keyframes glitch-flash-uncanny {
  0%   { opacity: 1;    transform: translateX(0)   skewX(0deg);  filter: brightness(1); }
  60%  { opacity: 1;    transform: translateX(0)   skewX(0deg);  filter: brightness(1); }
  62%  { opacity: 0.85; transform: translateX(3px)  skewX(0.5deg); filter: brightness(1.1) hue-rotate(5deg); }
  64%  { opacity: 1;    transform: translateX(-2px) skewX(-0.3deg); filter: brightness(0.95); }
  66%  { opacity: 0.9;  transform: translateX(1px)  skewX(0.2deg); filter: brightness(1.05); }
  68%  { opacity: 1;    transform: translateX(0)   skewX(0deg);  filter: brightness(1); }
  100% { opacity: 1;    transform: translateX(0)   skewX(0deg);  filter: brightness(1); }
}

@keyframes uncanny-still {
  0%, 59%, 69%, 100% { transform: none; }
  60% { transform: scaleY(1.003) skewX(0.4deg); }
  65% { transform: scaleY(0.998) skewX(-0.2deg); }
}
```

**Duration:** 800–1400ms total, with the glitch sequence occupying 8% of
the total duration. The glitch must be late and brief — Garland's reveals
are delayed. Apply to: loading states that resolve into a different state
than expected, AI-generated content indicators, system events that change
the environmental context of the interface.

---

## Composition — Glass-Walled Isolation, Clinical Containment

Garland's Bluebook facility is designed by the production designer Mark Digby
as a series of transparent and semi-transparent volumes — glass walls allowing
visual access while maintaining physical containment. The figure is always
within a visible system, and the system is always watching the figure watching it.

**UI mapping:**

| Film grammar | Interface equivalent |
|---|---|
| Glass room within room — contained within contained | Nested modal or drawer with visible outer container |
| Ava in the chamber — observed, observer | AI conversation interface where both sides are visible simultaneously |
| The lift that shows all levels | Vertical navigation with all levels visible in peripheral |
| Caleb's room — minimal, contained, surveilled | User workspace stripped of decoration, functional surface only |
| Annihilation's Shimmer boundary | Transition element that marks a threshold with visual anomaly |

**Column suggestion:** 12-column grid. Central content block: 6–8 columns,
centered. Large margins maintained as the "observation space" around the
content. Full-bleed background with content as specimen within it.

---

## Reference Films

**Ex Machina (2014)** — the foundational Garland visual statement. The Bluebook
facility: concrete, glass, forest. Nathan as creator-god in the clinical space.
Ava as the intelligence that exceeds the test designed to contain her. Mark
Digby's production design and Rob Hardy's cinematography as the complete
realization of the clinical-then-uncanny grammar.

**Annihilation (2018)** — the biological parallel. The Shimmer as the Bluebook
facility made geographical — a bounded space where the rules change. The
lighthouse interior as the Garland uncanny at its most saturated and least
recoverable. Ben Salisbury and Geoff Barrow's score as the audio version of
the visual grammar.

**Men (2022)** — the mythological parallel. A manor house in the English countryside
as the facility. The biological horror as the Shimmer's interior. The most
confrontational Garland film and the most explicitly political.

**Civil War (2024)** — the genre shift to war journalism. The clinical observer
is now the war photographer — someone who watches without intervening. Garland's
most stripped-back visual grammar: the naturalistic photography of active
violence as the most documentarily uncanny.

---

## When to Use

- AI products where the design should acknowledge the AI nature of the interaction
- Technology products with a research or academic register
- Security or monitoring products where clinical containment is appropriate
- Dark-mode first products with a technical user base
- Products where the design can acknowledge its own intelligence without
  performing either servility or dominance

---

## When NOT to Use

- Consumer products where the uncanny register creates anxiety rather than
  appropriate attentiveness
- Health or medical products where clinical-then-wrong is dangerous framing
- Products requiring warmth or human connection as primary values
- Any context where the glitch motion would be read as system malfunction rather
  than intentional design
