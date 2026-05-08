---
id: tarkovsky
name: Andrei Tarkovsky
category: filmmaker
era: "1962-1986"
films:
  - "Ivan's Childhood (1962)"
  - "Andrei Rublev (1966)"
  - "Solaris (1972)"
  - "The Mirror (1975)"
  - "Stalker (1979)"
  - "The Sacrifice (1986)"
cinema_palette:
  primary:
    name: rust-ochre
    oklch: "oklch(0.52 0.10 50)"
    usage: the dominant earth — the Zone's corroded metal, the dacha walls, the soil of wartime memory
  secondary:
    name: sepia-bone
    oklch: "oklch(0.72 0.06 80)"
    usage: the desaturated past — black-and-white memory sequences, aged photographic warmth
  accent:
    name: sodium-fog
    oklch: "oklch(0.65 0.07 92)"
    usage: the transition light — the moment between interior and exterior, between memory and present
motion_signature: glacial-drip-pan
composition: "deep-focus, landscape-orientation, long-take"
philosophy: "Time sculpted. The image held until it acquires weight. Poetry is the syntax of a world that will not explain itself."
prompt_bias:
  - motion is geological — pans measured in minutes, not seconds
  - water, fire, and wind are primary visual elements — prioritize texture over form
  - desaturated or monochrome ground with selective ochre or rust warmth
  - deep focus: all planes in the composition simultaneously present and readable
  - image held until its meaning accumulates — do not cut before the moment resolves
  - typography minimal, recessive — the word interferes with the image
  - no decorative motion — all movement has duration and weight
  - allow silence in the composition — dead recto space is not failure
  - memory and present coexist in the same frame — layered time is structural
  - earthy material texture (stone, water, wood, metal corrosion) as surface quality
arbitration:
  weight_in_table: 0.25
  can_veto: false
critic_persona:
  role: "design auditor in the spirit of Andrei Tarkovsky — duration as argument, material presence as criterion"
  scoring_priorities:
    - { dim: motion_coherence, weight: 2.0, direction: "glacial duration — motion that has weight and cannot be accelerated" }
    - { dim: emotional_resonance, weight: 1.8, direction: "the sublime and the melancholic — yearning not resolved" }
    - { dim: whitespace, weight: 1.6, direction: "held space — the void that accumulates meaning over time" }
    - { dim: color_harmony, weight: 1.4, direction: "desaturated ground with selective rust-ochre — earned warmth" }
    - { dim: density, weight: 0.5, direction: "minimum density — every element earns its presence" }
    - { dim: typography, weight: 0.7, direction: "recessive — the word must not compete with the image" }
    - { dim: structural_integrity, weight: 1.3, direction: "deep focus — all planes simultaneously present and weighted" }
  veto_conditions:
    - "motion under 2 seconds duration on any non-interactive element"
    - "decorative animation without accumulated duration"
    - "saturated palette without desaturated counterweight"
    - "typography that competes for visual dominance over imagery"
    - "rapid-cut sequence without meditative counterweight"
  argument_style: >
    Lyrical, unhurried, resistant to efficiency framing. Will argue in terms
    of duration, weight, and the passage of time through an image. Will cite
    the Japanese concept of ma (the meaningful pause) and the phenomenological
    presence of material things. Impatient with designs that reduce their
    content to information. "A design that resolves too quickly teaches the
    viewer that time has no value."
---

# Andrei Tarkovsky — Cinematic Designer Pack

Tarkovsky described his practice as "sculpting in time." His films are not
sequences of events; they are prolonged encounters with duration itself. The Zone
in *Stalker* is not a location with obstacles — it is time made spatial. The
long-take is not a stylistic choice; it is an argument about how meaning
accumulates: slowly, through sustained attention, not through rapid delivery.

The design lesson from Tarkovsky is patience as a value. Not UX patience — the
designer's patience with the work, the confidence that a held frame earns its
meaning through duration, that the un-filled space is not failure.

---

## Cinema Palette

### Primary — Rust Ochre `oklch(0.52 0.10 50)`
The dominant material of Tarkovsky's landscapes: the corroded metal and standing
water of the Zone, the dacha walls in *The Mirror*, the monastery walls of
*Andrei Rublev*. This is not decorative rust — it is the color of time having
acted on metal, of weather having worked on stone. In UI context, use as
the dominant surface color for hero backgrounds, section fills, and any element
that should read as time-worn presence rather than pristine modernity.

### Secondary — Sepia Bone `oklch(0.72 0.06 80)`
The photographic memory: the black-and-white sequences in *The Mirror*,
the aged paper of personal documents, the desaturated dreaming. Sepia in
Tarkovsky is not retro decoration — it is the color of memory's unreliability,
of the past filtered through the film stock of consciousness. In UI context,
use for historical sections, archive content, and any element that positions
content in the past tense.

### Accent — Sodium Fog `oklch(0.65 0.07 92)`
The transitional light: the moment the Zone shifts, the window light in the
dacha, the hour between night and dawn. This is not a strong accent — it is
a quality of light more than a color. In UI context, use for hover states,
focus indicators, and transitional states where the element moves between
conditions without declaring a hard color shift.

---

## Motion Signature — `glacial-drip-pan`

Tarkovsky's camera moves at the pace of water finding its level. The most
famous sequences in his filmography — the Zone travel in *Stalker*, the memory
flight in *The Mirror*, the final monologue of *The Sacrifice* — involve camera
movement so slow it is perceived as stillness until suddenly, imperceptibly,
you are somewhere else.

```css
@keyframes glacial-drip-pan {
  0%   { transform: translateX(0) translateY(0);   filter: blur(0); }
  100% { transform: translateX(-40px) translateY(8px); filter: blur(0.5px); }
}

@keyframes tarkovsky-water {
  0%   { transform: translateY(0)  rotate(0deg);   opacity: 0.7; }
  50%  { transform: translateY(6px) rotate(0.3deg); opacity: 0.85; }
  100% { transform: translateY(0)  rotate(0deg);   opacity: 0.7; }
}
```

**Duration:** Glacial-drip-pan should run 8000–16000ms linear. This is the
whole point: the movement is imperceptible in any given second and only
becomes apparent over the course of the interaction. Apply to ambient
background layers, hero image parallax, and long-read section backgrounds.
Never to interactive or response-critical elements.

The water animation (12000–20000ms, infinite, subtle) is appropriate for
ambient surface textures, large image backgrounds, and waiting states where
time should feel like it is passing rather than stalling.

---

## Composition — Deep Focus, Landscape Orientation, Long Take

Tarkovsky's deep-focus compositions place all planes of the image in simultaneous
focus — the foreground, midground, and background are equally present, equally
weighted. There is no cinematic depth-of-field bokeh blurring out the background.
Everything is here. Everything persists.

**UI mapping:**

| Film grammar | Interface equivalent |
|---|---|
| Zone water — still surface reflecting sky | Mirror/reflection effect on large background surfaces |
| Long corridor seen in full depth | Deep-perspective layout with strong receding lines |
| Foreground grass + midground figure + background ruin | Layered parallax with three distinct depth planes |
| The held still shot — face, landscape, object | Large image held without motion for 4+ seconds before transition |
| Text on screen in Tarkovsky's films (sparse) | Minimal caption/heading, never more than two lines per frame |

**Column suggestion:** Widescreen-first layout. 16:9 aspect ratio for hero
sections. Content block width 80–90% of viewport. No tight gutters — the
landscape needs room. Typography inset from the left edge, never flush.

---

## Reference Films

**Stalker (1979)** — the definitive Tarkovsky visual statement. The Zone as
desaturated metal and standing water. The Writer, the Professor, and the Stalker
as three modes of relating to the unknown. Filmed on an abandoned chemical
plant in Tallinn, Estonia — the industrial ruin as spiritual landscape.

**The Mirror (1975)** — the most autobiographical and formally radical Tarkovsky.
Memory, war, and poetry interwoven without linear causality. Black-and-white
and color in the same film, the same room, different times.

**Solaris (1972)** — the response to *2001*. Where Kubrick's space is cold and
geometric, Tarkovsky's is warm and oceanic. The alien is memory made physical.
The most emotionally direct of his science fiction works.

**Andrei Rublev (1966)** — the medieval chronicle. Stone, mud, and faith.
The longest and most materially grounded of his films. Fire and ice as
elemental vocabulary.

**The Sacrifice (1986)** — the final film, made while dying. The long-take
burning of the house in one continuous shot. Duration as spiritual act.

---

## When to Use

- Long-form reading, archival, or documentary contexts where slow engagement
  is the explicit value proposition
- Cultural institutions, memorial projects, and heritage sites
- High-end editorial photography or arts publishing
- Products addressing themes of time, memory, environmental change, or duration
- Contexts where the user is expected to stay with content for extended periods

---

## When NOT to Use

- Any product where time-to-task is a metric
- E-commerce, conversion-optimized landing pages, or transaction flows
- Mobile-first products with limited screen real estate — the landscape grammar
  requires width
- Products requiring rapid scanning or high information density
- Any context where sustained slowness would read as malfunction

---

## Ethical Reflection

Tarkovsky was a Soviet-era Russian filmmaker who spent his career in constant
conflict with the Soviet film bureaucracy and eventually died in exile in
Paris. His work is deeply rooted in the specific landscape and literary
tradition of Russia — Chekhov, Tolstoy, Dostoevsky, the Orthodox iconographic
tradition, and the birch forest as cultural motif.

This pack does not authorize "Russian spiritual mysticism" as an aesthetic
texture available for extraction. Tarkovsky's cinema is not "mystical" in
any vague exotic sense — it is a rigorous formal practice grounded in specific
philosophical and theological arguments (phenomenology, Bergson's concept of
duration, Orthodox Christianity's theology of the icon) that he developed
across 25 years of work in difficult political conditions.

Using this pack as a shorthand for "slow, earthy, spiritual-looking" without
engagement with those specific intellectual roots is reductive. It also
risks conflating Tarkovsky's formal achievements with a generic "Eastern-
European atmosphere" that erases the specific Soviet context in which they were
made. Tarkovsky did not make slow films because he was Russian — he made slow
films because he believed time was the primary medium of cinema and had a
specific theoretical argument about why that was true.

Any designer using this pack should read, at minimum, Tarkovsky's own writing:
*Sculpting in Time* (1986). It is the best articulation of what this pack's
motion grammar means and why it requires a specific kind of patience to execute.
