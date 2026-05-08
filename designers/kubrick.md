---
id: kubrick
name: Stanley Kubrick
category: filmmaker
era: "1960-1999"
films:
  - "2001: A Space Odyssey (1968)"
  - "A Clockwork Orange (1971)"
  - "The Shining (1980)"
  - "Full Metal Jacket (1987)"
  - "Eyes Wide Shut (1999)"
cinema_palette:
  primary:
    name: ice-white
    oklch: "oklch(0.96 0.01 260)"
    usage: the dominant ground of institutional spaces — the Overlook corridors, the HAL 9000 interface, the barracks
  secondary:
    name: signal-red
    oklch: "oklch(0.48 0.20 22)"
    usage: violence and ideology — the blood elevator, Alex's eyelid opener, the Marine Corps blood type
  accent:
    name: primary-yellow
    oklch: "oklch(0.85 0.16 95)"
    usage: the inhuman and the satirical — the Big Board lighting, the Ludovico conditioning room, HAL's eye
motion_signature: dolly-zoom-tracking
composition: "one-point-perspective, symmetric"
philosophy: "Mankind is the joke and the punchline. The machine is more consistent than the man who built it."
prompt_bias:
  - enforce one-point perspective in spatial elements — corridors, hallways, long tables must vanish to a single point
  - primary colors (red, yellow, blue) used as saturated signals against white or near-white ground
  - ironic coolness as the default emotional register — design knows it is design
  - typography bold and institutional — block letters, sans-serif authority, no warmth
  - the symmetric composition is not comfortable — it is the symmetry of the panopticon
  - depth cues must be explicit — strong perspective lines, diminishing scale, layered foreground/midground/background
  - avoid organic curves in structural elements — Kubrick's architecture is right angles and vanishing points
  - motion is camera-mechanical — tracking shots at exact speed, not hand-held approximation
  - allow moments of deliberate wrongness — the bear costume, the masked ball — as ironic structural breaks
arbitration:
  weight_in_table: 0.25
  can_veto: false
critic_persona:
  role: "design auditor in the spirit of Stanley Kubrick — structural symmetry, institutional irony, unblinking precision"
  scoring_priorities:
    - { dim: structural_integrity, weight: 1.9, direction: "one-point perspective enforced — no ambiguous spatial grammar" }
    - { dim: hierarchy, weight: 1.6, direction: "geometric — visual logic must be immediately apprehensible" }
    - { dim: color_harmony, weight: 1.5, direction: "primary color as signal against white ground — no muddy intermediates" }
    - { dim: whitespace, weight: 1.4, direction: "institutional white — the silence before the violence" }
    - { dim: motion_coherence, weight: 1.3, direction: "mechanical tracking precision — no organic irregularity" }
    - { dim: emotional_resonance, weight: 1.2, direction: "ironic cool — the design knows it is design" }
    - { dim: typography, weight: 1.4, direction: "bold, institutional, sans-serif authority" }
  veto_conditions:
    - "organic or hand-drawn aesthetic elements"
    - "warm-dominant palette without ironic framing"
    - "asymmetric composition without structural motivation"
    - "motion that approximates hand-held or documentary naturalism"
  argument_style: >
    Precise, cold, encyclopedic. Will reference Kubrick's filming process (the
    repeated takes, the mathematical lens calculations, the meticulous set
    construction) as analogies for design rigor. Treats every deviation from
    symmetry as a question that must be answered. Uses the word "deliberate"
    frequently. Impatient with anything that looks accidental.
---

# Stanley Kubrick — Cinematic Designer Pack

Kubrick is the most structurally rigorous filmmaker in the Western canon. Every
frame is geometrically calculated. His one-point perspective corridors are not
visual effects — they are arguments about power, inevitability, and the imprisonment
of the symmetric. His use of primary colors is not decorative — it is the palette
of ideology made visible.

The design lesson from Kubrick is not "use red" or "use one-point perspective."
It is: every visual decision is an argument. Nothing is accidental. The design
that knows it is design is more honest than the design that pretends to be neutral.

---

## Cinema Palette

### Primary — Ice White `oklch(0.96 0.01 260)`
The dominant surface of Kubrick's institutional spaces: the HAL 9000 Discovery
corridors, the Overlook Hotel's white-and-black geometric carpet against white
walls, the Marine Corps barracks. This is the white of authority — not warmth.
It makes the saturated accents hit with maximum force. In UI context, use as
the primary background for high-authority, high-contrast layouts.

### Secondary — Signal Red `oklch(0.48 0.20 22)`
The most saturated red in cinema: the blood elevator in *The Shining*, the
red of Alex's droog costume, the Marine Corps blood type on the dog tags.
Kubrick uses red as violence made visible — not metaphorical but literal.
In UI context, use for critical state signals — errors, destructive action
confirmations, and danger indicators — with full awareness that this color
carries weight.

### Accent — Primary Yellow `oklch(0.85 0.16 95)`
The color of the inhuman and the satirical: the Big Board's lighting in
*Dr. Strangelove*, the Ludovico Technique conditioning room's overhead wash,
HAL 9000's single yellow eye. Yellow is the color of systems that are
functional but wrong. In UI context, use for warning states, advisory notices,
and elements that signal "operational but requiring attention."

---

## Motion Signature — `dolly-zoom-tracking`

Kubrick's signature camera movements are mechanical and unhuman in their
precision. The tracking shot down the Overlook Hotel corridor, the slow
zoom on Alex during the conditioning sequence, the star-gate transition at
1:1 symmetry. The camera moves with the certainty of a system, not the
responsiveness of a person.

```css
@keyframes dolly-zoom-tracking {
  0%   { transform: perspective(600px) translateZ(0)   scale(1);    }
  100% { transform: perspective(600px) translateZ(80px) scale(1.12); }
}

@keyframes kubrick-tracking {
  0%   { transform: translateX(-100vw); animation-timing-function: linear; }
  100% { transform: translateX(0); }
}
```

**Duration:** 1200–2400ms linear. Never ease-in-out — Kubrick's camera
maintains constant mechanical speed. Apply to section transitions, hero
reveals, and loading sequences where the sense of inexorable approach is
appropriate. The dolly-zoom effect (perspective depth changing while scale
stays constant) should be used sparingly as a significant-moment marker.

---

## Composition — One-Point Perspective, Symmetric

The Kubrick center is not the Wes Anderson center. Anderson's symmetry is
ornamental — the diorama of a life well-organized. Kubrick's symmetry is
architectural and inescapable — the corridor you must walk down, the institution
you cannot exit, the machine that will outlast you.

**UI mapping:**

| Film grammar | Interface equivalent |
|---|---|
| One-point corridor — walls converging to a single vanishing point | Navigation rail or sidebar with strong perspective-depth visual treatment |
| HAL 9000's single eye at center of the pod bay | Primary action button at exact geometric center, dominant scale |
| The Big Board overhead shot — geography as power | Data map or heatmap with centered geographic anchor |
| Carpet pattern repeating to the vanishing point | Repeating grid pattern as structural background element |
| Full Metal Jacket barracks — identical repeating units | Card grid with zero variation between items — deliberate uniformity |

**Column suggestion:** Strict symmetric 12-column grid. Odd-count columns
are structural violations unless architecturally motivated. The center column
(columns 6–7) should function as the vanishing point to which all structural
lines converge.

---

## Reference Films

**2001: A Space Odyssey (1968)** — the fullest expression of the Kubrick
visual system. The Discovery corridors, the stargate sequence, the white
room at the end of the universe. HAL 9000's eye as the most memorable
single-point composition in cinema.

**A Clockwork Orange (1971)** — primary colors in full saturation against
white institutional ground. The Ludovico Technique sequence as forced visual
consumption — the film is watching you as you watch it.

**The Shining (1980)** — the Steadicam as tracking-shot perfected. The Overlook
Hotel carpet as graphic design element. The geometric organization of terror.
Blood as primary red in maximum volume.

**Full Metal Jacket (1987)** — two films in one. Parris Island: institutional
white and khaki, geometric barracks, the machine of military formation.
Vietnam: chaos against that formed order.

**Eyes Wide Shut (1999)** — the Christmas color palette as ironic warmth inside
cold dread. The masked ball as the most elaborate application of the Kubrick
ceremonial-symmetric.

---

## When to Use

- Enterprise software with authority and precision as brand values
- Security or systems products where the institutional register is appropriate
- High-contrast editorial contexts — architecture, fashion, art
- Dark-mode interfaces where the primary color signals retain their impact
  against dark rather than light ground
- Products in which ironic self-awareness is part of the brand voice

---

## When NOT to Use

- Products requiring warmth, accessibility, or approachability as primary values
- Consumer health or wellness applications
- Brands positioning themselves on human connection or community
- Children's or family products (the palette is too cold and too weighted)
- Contexts where the ironic register would be misread as sincere coldness

---

## Ethical Reflection

Kubrick's filmography contains sequences of sustained violence, sexual
manipulation, and the dehumanization of soldiers, prisoners, and women.
This pack adapts his formal visual language — symmetry, primary colors,
one-point perspective — not his thematic content. The power dynamics
encoded in his institutional spaces are appropriate as a formal reference
for products that genuinely inhabit authority structures (enterprise software,
government, security). They are not appropriate as aesthetic decoration for
consumer products that want to feel edgy without acknowledging what the
visual grammar originally contained.

Kubrick's treatment of women across his filmography is a documented critical
concern. Using this pack does not authorize the male-gaze framing mechanisms
of *Eyes Wide Shut* or *A Clockwork Orange*. The one-point symmetry is the
formal tool; the power relations it was used to encode are not part of this pack.
