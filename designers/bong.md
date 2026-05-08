---
id: bong
name: Bong Joon-ho
category: filmmaker
era: "2000-2022"
films:
  - "Memories of Murder (2003)"
  - "The Host (2006)"
  - "Mother (2009)"
  - "Snowpiercer (2013)"
  - "Parasite (2019)"
cinema_palette:
  primary:
    name: luxury-cream
    oklch: "oklch(0.92 0.04 88)"
    usage: the Park family's surface world — pristine, modernist, expensive, concealing
  secondary:
    name: mud-brown
    oklch: "oklch(0.38 0.07 55)"
    usage: the Kim family's basement reality — the semi-basement, the flooding toilet, the drunk sleeping on the street
  accent:
    name: arterial-red
    oklch: "oklch(0.48 0.20 22)"
    usage: the genre rupture — the moment the comedy becomes the violence, the blood that was always coming
motion_signature: montage-energy-cut
composition: "tight-architecture, interior, class-coded"
philosophy: "Genre is the sugar coating on the class analysis. Comedy and horror are the same feeling at different speeds."
prompt_bias:
  - use luxury-cream and clean modernist surfaces for elements representing authority or abundance
  - use mud-brown and compressed spaces for elements representing constraint or precarity
  - genre-tonal shift as structural device — the design can shift register mid-interaction
  - tight architectural interiors — the walls matter, the ceiling height matters
  - class is spatial — upper floors versus basements is compositional argument
  - the staircase as vertical class axis — use vertical layout rhythm to encode status
  - pristine surfaces that will not stay pristine — luxury-cream as a surface that can be violated
  - rapid-cut energy in motion sequences contrasting with dwell-still horror holds
  - allow the tonal shift — the design need not stay in one emotional register
arbitration:
  weight_in_table: 0.25
  can_veto: false
critic_persona:
  role: "design auditor in the spirit of Bong Joon-ho — genre-aware, class-alert, tonal-shift as feature"
  scoring_priorities:
    - { dim: emotional_resonance, weight: 1.8, direction: "tonal complexity — the design should be able to be funny and horrifying" }
    - { dim: hierarchy, weight: 1.6, direction: "spatial class-coding — hierarchy is the argument, not only the structure" }
    - { dim: motion_coherence, weight: 1.5, direction: "genre-aware — rapid comedy energy and dwell-horror hold as contrasting registers" }
    - { dim: color_harmony, weight: 1.4, direction: "luxury-cream versus mud-brown as class opposition, not decorative palette" }
    - { dim: structural_integrity, weight: 1.3, direction: "tight architectural containment — the walls are part of the argument" }
    - { dim: distinctiveness, weight: 1.4, direction: "genre-aware specificity — the design knows what kind of film it is in each moment" }
    - { dim: density, weight: 1.2, direction: "class-appropriate density — luxury spaces sparse, precarious spaces compressed" }
  veto_conditions:
    - "a single consistent emotional register without tonal complexity"
    - "luxury palette without the underlying mud-brown structural layer"
    - "motion that doesn't differentiate between comedy and horror registers"
    - "spatial layout that ignores vertical axis as class grammar"
  argument_style: >
    Genre-literate, class-analytic, precise about tonal register. Will describe
    layout failures as class failures — "this design is pretending everyone
    has the same ceiling height." Will identify when a surface is performing
    luxury without acknowledging what's underneath it. References specific
    production design decisions (the Park house, the semi-basement) as
    precision instruments for spatial argument. Uses "the staircase" as
    a verb — "this navigation staircases the user."
---

# Bong Joon-ho — Cinematic Designer Pack

Bong Joon-ho is cinema's most sophisticated genre practitioner — not because he
subverts genre, but because he understands genre as a delivery mechanism for
class analysis. The monster in *The Host* is a monster, but it is also the
direct result of US military chemical disposal in the Han River. The thriller
of *Parasite* is a thriller, but the resolution is determined by where the
bodies are spatially in the frame — which floor, which level of the house.

The design lesson from Bong is that register is not fixed. A surface can be
comic and then suddenly tragic, and the tragedy is more effective because the
comedy prepared the viewer for the wrong kind of attention.

---

## Cinema Palette

### Primary — Luxury Cream `oklch(0.92 0.04 88)`
The Park family's world: the high-modernist house with its Mies van der Rohe
furniture, the pristine concrete, the architect's stone in the garden. This
cream is the color of a surface that has never been touched by the things that
produce it — never shown the kitchen, the delivery driver, the cleaner's
supply room. In UI context, use for elements positioned as premium, expert,
or authoritative — with the awareness that this clean surface conceals
structural conditions.

### Secondary — Mud Brown `oklch(0.38 0.07 55)`
The Kim family's reality: the semi-basement window at street level, the flooding
toilet, the drunk's urine, the smell that Mr. Park cannot place but that
follows Ki-taek everywhere. This is not an accent — in Bong's spatial grammar,
it is the structural ground beneath the luxury cream. In UI context, use for
elements representing constraint, scarcity, and the infrastructure that the
luxury surface depends on and cannot acknowledge.

### Accent — Arterial Red `oklch(0.48 0.20 22)`
The genre rupture: the moment where *Parasite* stops being a comedy thriller
and becomes something else entirely. Bong uses red precisely — it arrives late
and with full force, having been withheld. In UI context, use only for the
most critical state signals — errors with real consequences, destructive
action confirmations, system-level alerts that cannot be ignored.

---

## Motion Signature — `montage-energy-cut`

Bong's action sequences cut fast — the Han River monster attack in *The Host*
is edited with kinetic montage energy that does not give the viewer time to
settle. But his horror dwells: the rock in *Parasite*, the snow in *Snowpiercer*,
the realization of what the stone means is given time to land. The contrast
between these two speeds is the central tension of his motion vocabulary.

```css
@keyframes montage-energy-cut {
  0%   { opacity: 1;   transform: translateX(0)    scale(1);    }
  10%  { opacity: 1;   transform: translateX(-8px)  scale(0.99); }
  20%  { opacity: 0.8; transform: translateX(8px)   scale(1.01); }
  30%  { opacity: 1;   transform: translateX(-4px)  scale(0.995); }
  100% { opacity: 1;   transform: translateX(0)    scale(1);    }
}

@keyframes dwell-horror {
  0%   { transform: scale(1);    filter: brightness(1); }
  40%  { transform: scale(1);    filter: brightness(1); }
  100% { transform: scale(1.03); filter: brightness(0.92); }
}
```

**Duration:** montage-energy-cut: 200–400ms with cubic-bezier(0.25, 0.46, 0.45, 0.94).
dwell-horror: 2000–4000ms linear. Apply the energy cut to comedy or navigation
interactions; apply the dwell-horror to significant state changes, error
reveals, or content that needs weight before the user proceeds.

---

## Composition — Tight Architecture, Interior, Class-Coded

Bong's production designer Ha-jun Lee built the Park house as a spatial
argument: the garden at grade, the living spaces elevated, the bunker below
grade, the semi-basement at street level. The film's action moves vertically
through this spatial hierarchy. The architectural sections are the narrative.

**UI mapping:**

| Film grammar | Interface equivalent |
|---|---|
| Park house above grade — light, open, large windows | Premium tier interface elements: generous whitespace, light-filled, uncrowded |
| Kim semi-basement — compressed ceiling, street-level window | Constraint-state elements: tight padding, lower brightness, compressed typography |
| The staircase — vertical class transit | Page scroll as descent or ascent through system hierarchy |
| The bunker — lower than the basement | System-level states: loading, error, offline — the lowest spatial register |
| Garden stone — out of place on the premium surface | Alert or warning element that violates the surrounding premium aesthetic |

**Column suggestion:** Architecture-responsive grid. Premium sections: 10 of 12
columns, centered, generous padding. Constrained sections: full 12 columns,
tight padding. The column expansion encodes status.

---

## Reference Films

**Memories of Murder (2003)** — the first Bong crime film. Rural Korea, the
late 1980s, serial murder, incompetent authority. The genre of the procedural
used to examine institutional failure. The rice paddies as landscape of bureaucratic
helplessness.

**The Host (2006)** — the monster-movie class analysis. The Han River creature
as consequence of US military negligence. A family of food-stall workers as
the protagonists the disaster-movie genre normally sidelines. Sustained
tonal complexity: comedy, horror, and genuine pathos without ironic distance.

**Snowpiercer (2013)** — the vertical class metaphor made horizontal. The train
as spatial argument: front-class, economy-class, engine room. Bong's most
explicit diagram of class as spatial arrangement.

**Mother (2009)** — the most psychologically complex Bong film. A mother who
loves her intellectually disabled son to the point of crime. The tonal range
from gentle comedy to devastating horror in the same character arc.

**Parasite (2019)** — the Palme d'Or film. The spatial class analysis at its
most legible and most formally sophisticated. The house as the entire argument.

---

## When to Use

- Products with a dual-audience or multi-tier user base where the product
  genuinely inhabits different registers for different users
- Social critique or advocacy contexts where spatial class-coding is the point
- Entertainment platforms where genre-awareness and tonal complexity are features
- Design systems that need to encode hierarchy with deliberate spatial and
  chromatic specificity
- Contexts where the luxury-cream surface and the mud-brown infrastructure can
  both be named and shown

---

## When NOT to Use

- Products that need a single consistent emotional register
- Brands that cannot sustain the tonal complexity of comedy-to-horror
- B2B or enterprise contexts where genre-literacy cannot be assumed
- Products where the class-coding would be read as value judgement about
  the user rather than the system

---

## Ethical Reflection

Bong's films are made from a specific South Korean social and political context:
the class anxieties of Korean capitalism, the legacy of the 1997 Asian financial
crisis, the relationship between Korea and US military presence. *Parasite*'s
class analysis is specific to the conditions of Seoul in 2019, not a universal
statement about rich and poor that can be exported as aesthetic shorthand.

In particular: using the mud-brown/luxury-cream class opposition as aesthetic
decoration, without engaging with the specific social analysis Bong is making,
is precisely the extraction that the films are critiquing. The semi-basement
in *Parasite* is not a metaphor available for design appropriation — it is a
specific architectural condition that the Kim family cannot leave and that the
Park family does not see.

This pack licenses the formal vocabulary — the class-coded palette, the
staircase as vertical hierarchy, the tonal shift between registers. It does not
license using poverty or precarity as aesthetic texture. The mud-brown should
represent genuine constraint in the product's use case, not be used as visual
edginess.

Note on language: "Parasite" as a film title is Bong's ironic inversion — the
film proposes that the question of who is parasiting whom is the actual political
question. Using this pack's visual grammar should carry that irony, not flatten
it into a simple aesthetic choice.
