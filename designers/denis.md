---
id: denis
name: Claire Denis
category: filmmaker
era: "1988-2022"
films:
  - "Chocolat (1988)"
  - "Beau Travail (1999)"
  - "35 Shots of Rum (2008)"
  - "White Material (2009)"
  - "Beau Travail (1999)"
  - "Both Sides of the Blade (2022)"
cinema_palette:
  primary:
    name: skin-warm
    oklch: "oklch(0.68 0.09 55)"
    usage: the body as primary surface — skin in afternoon light, the warmth of presence, flesh as landscape
  secondary:
    name: petrol-blue
    oklch: "oklch(0.38 0.10 232)"
    usage: the French Foreign Legion's dusk, the harbor, the separation between desire and its object
  accent:
    name: sand-bone
    oklch: "oklch(0.82 0.06 85)"
    usage: the African light, the dry season, the space between bodies that is also the film's subject
motion_signature: texture-touch-dissolve
composition: "tactile-close-up, body-centered"
philosophy: "The body knows before language. Desire is spatial. The cut is a touch."
prompt_bias:
  - prioritize skin-tone warmth as the dominant surface register
  - close-up and macro framing — the texture of surfaces is the subject, not its context
  - motion as grace — slow, unhurried transitions that emphasize the quality of movement
  - no graphic typography — text recedes entirely in favor of image
  - petrol blue used for separation, distance, longing — the color of what cannot be reached
  - grain as feature — textured film surface is part of the visual argument
  - compositional closeness — the frame does not provide comfortable viewing distance
  - labor and effort visible in images — Denis films bodies at work, bodies in physical engagement
  - post-colonial gaze is explicit — Africa is not atmosphere, it is place with specific political history
arbitration:
  weight_in_table: 0.25
  can_veto: false
critic_persona:
  role: "design auditor in the spirit of Claire Denis — tactile presence, bodily knowledge, post-colonial alertness"
  scoring_priorities:
    - { dim: emotional_resonance, weight: 2.0, direction: "bodily and tactile — the design must be felt, not only seen" }
    - { dim: color_harmony, weight: 1.6, direction: "skin-warm primary against petrol-blue separation — desire as color grammar" }
    - { dim: motion_coherence, weight: 1.7, direction: "grace — motion that has the quality of a body moving well" }
    - { dim: density, weight: 1.4, direction: "close and present — the texture of the surface matters" }
    - { dim: typography, weight: 0.5, direction: "recessive — language should not compete with bodily presence" }
    - { dim: whitespace, weight: 0.8, direction: "proximity — Denis compositions do not provide comfortable distance" }
    - { dim: distinctiveness, weight: 1.4, direction: "unmistakably tactile — the design has physical grain" }
  veto_conditions:
    - "clean, graphic modernism without texture or warmth"
    - "typography-dominant compositions where text overrides image"
    - "Africa or post-colonial contexts rendered as exotic atmosphere"
    - "motion that is decorative rather than bodily — bounces, spins, flourishes"
    - "cool-dominant palette without skin-warmth counterweight"
  argument_style: >
    Attentive, tactile, resistant to abstraction. Will describe design failures
    in terms of distance — "this layout does not allow proximity." References
    specific skin textures, the quality of afternoon light, the difference
    between a body at rest and a body in labor. Will invoke Agnes Godard's
    cinematography as the standard for how light should treat surfaces.
    Refuses to reduce any element to its function — everything is also its
    texture and its warmth.
---

# Claire Denis — Cinematic Designer Pack

Denis is cinema's most rigorous practitioner of what might be called somatic
filmmaking — cinema that addresses the viewer's body as much as their mind.
Her films are built from textures, surfaces, and the quality of physical
presence. The editing in *Beau Travail* is not narrative — it is choreography.
The close-up in *35 Shots of Rum* is not information — it is contact.

The design lesson from Denis is to take seriously the physical dimension of
screens: the texture of surfaces, the warmth of colors, the bodily quality
of motion. A Denis-influenced UI is not primarily about layout or hierarchy;
it is about the experience of encountering a surface.

---

## Cinema Palette

### Primary — Skin Warm `oklch(0.68 0.09 55)`
The body is Denis's primary subject and her primary visual surface. Agnes
Godard's cinematography treats skin as landscape — the camera moves across
a shoulder or a forearm with the same attentiveness it gives to the Djibouti
desert. This warm mid-tone encompasses a range of skin tones across Denis's
films — it is not a specific person's skin, but the quality of human warmth
in afternoon light. In UI context, use as the dominant warm surface for
hero areas, card backgrounds, and image overlays where warmth signals
human presence rather than brand intention.

### Secondary — Petrol Blue `oklch(0.38 0.10 232)`
The color of separation and the interval: the harbor water in *Beau Travail*,
the French Foreign Legion's dusk, the distance between Galoup and the world
he has lost. Denis uses cool blue not as an aesthetic contrast but as the
spatial form of longing — the color of what is present but unreachable.
In UI context, use for inactive states, background layers, and elements
that recede from the primary interaction.

### Accent — Sand Bone `oklch(0.82 0.06 85)`
The dry light of Djibouti and Cameroon — the specific quality of African
continental light, not as decoration but as place. This is the color of the
spaces between bodies that Denis's camera inhabits as carefully as the bodies
themselves. In UI context, use for large background washes in hero sections,
for section dividers that function as breath rather than boundary.

---

## Motion Signature — `texture-touch-dissolve`

Denis edits *Beau Travail* to music — specifically to Benjamin Britten's
*Billy Budd* and to Corona's "Rhythm of the Night." The editing is musical,
not narrative: bodies moving in close-up, then the landscape, then a hand,
then the harbor. The dissolves emphasize continuity of surface and texture
across cuts rather than continuity of action.

```css
@keyframes texture-touch-dissolve {
  0%   { opacity: 1;    filter: blur(0)      saturate(1);    transform: scale(1); }
  30%  { opacity: 0.7;  filter: blur(1.5px)  saturate(1.1);  transform: scale(1.01); }
  60%  { opacity: 0.4;  filter: blur(2px)    saturate(1.15); transform: scale(1.02); }
  100% { opacity: 1;    filter: blur(0)      saturate(1);    transform: scale(1); }
}

@keyframes bodily-grace {
  0%   { transform: translateY(0)   rotate(0deg);   filter: blur(0); }
  40%  { transform: translateY(-4px) rotate(0.3deg); filter: blur(0.5px); }
  100% { transform: translateY(0)   rotate(0deg);   filter: blur(0); }
}
```

**Duration:** 600–1000ms for the texture-touch-dissolve. The cross-dissolve
should be visible — Denis's dissolves are never subliminal. The saturate
increase during the transition emphasizes the warmth of skin-tone colors.
Apply to image transitions in galleries, to section transitions in scrolling
experiences, and to hover states on human-centered content.

---

## Composition — Tactile Close-Up, Body-Centered

Denis and Godard use the camera at a distance that insists on physical
presence. The close-up in Denis is not for information delivery — it is
for contact. The viewer is placed in proximity they did not ask for, which
is the same position Denis's characters often occupy.

**UI mapping:**

| Film grammar | Interface equivalent |
|---|---|
| Extreme close-up of forearm / shoulder / hand | Hero image cropped to specific body detail, not full portrait |
| Faces in profile, partial — never full-face confrontation | Portrait photography at three-quarter angle, not direct eye contact |
| Bodies in labor — Legion exercises, kitchen work | Process photography showing craft and effort, not finished product |
| The harbor from above — bodies small in landscape | Aerial or overhead shot that reduces figure to texture |
| Two people almost touching — the space between | Split composition with intentional gap as visual subject |

**Column suggestion:** Variable width with strong top-cropping on hero images.
Resist the temptation to show full figures — Denis composes in fragments.
Hero images should be 70–80% viewport height, cropped from the top or bottom.
Grid: 12 columns, content blocks 8–10 columns wide, slightly off-center.

---

## Reference Films

**Beau Travail (1999)** — the fullest Denis visual statement. The French Foreign
Legion in Djibouti, shot by Agnes Godard in extreme close-up and wide landscape
alternation. The editing is choreographic, structured by Britten's *Billy Budd*.
Skin, labor, and suppressed desire in the most specific possible landscape.

**35 Shots of Rum (2008)** — the Paris film. A father and daughter, their apartment,
the RER B. Denis at her most narrative and her most intimate. Warmth as the
primary emotional register; petrol-blue train windows as separation.

**Chocolat (1988)** — the first film, and the most explicit engagement with
post-colonial Cameroon. A French colonial family, their Cameroonian employee
Protée, the geography of power disguised as domestic arrangement.

**White Material (2009)** — French coffee plantation, civil war Cameroon. The
violence of colonial persistence as physical and spatial fact, not metaphor.
Isabelle Huppert as someone who refuses to see what the landscape is telling her.

---

## When to Use

- Fashion or beauty products where the quality of surfaces and textures is primary
- Cultural and arts organizations where bodily experience is part of the offer
- Premium food, craft, or artisanal products where labor and materiality matter
- Personal or intimate brand contexts — therapy, wellness, body-positive spaces
- Photography-first editorial or portfolio sites where images carry the content

---

## When NOT to Use

- Products where bodily intimacy would be inappropriate (professional services,
  enterprise software, government)
- High-density information products where close-up framing loses context
- Products requiring cultural neutrality — Denis's palette is specific to a
  warm-light geography that may not translate to all contexts
- Any product where the post-colonial alertness required by this pack exceeds
  the team's capacity to maintain it

---

## Ethical Reflection

This is the most important ethical note in the cinematic pack series.

Claire Denis was born in Paris and grew up in Cameroon and Burkina Faso as the
child of a French colonial administrator. Her films return obsessively to this
specific history — the French colonial presence in Africa, the structures of
power that organized domestic space, the physical proximity of people whose
political and economic relations were radically unequal.

This pack's warm African light, its skin-tone warmth, and its use of specific
Djiboutian and Cameroonian landscape are **not available as generic
"warm sunshine aesthetic."** Denis's palette is the product of a specific
engagement with postcolonial France that involves sustained self-examination
of her own position as a white French filmmaker in African space.

Using warm skin-tone palettes or "African light" as a visual trend, without
acknowledging the political and historical geography of those color temperatures,
is exactly the kind of extraction Denis's films explicitly interrogate.

Further: Denis is one of cinema's most important feminist filmmakers. Her
gaze at bodies — including male bodies in *Beau Travail* — is notably different
from the default heterosexual male gaze that structures most cinema. The
pack's use of close-up and bodily presence should be understood through this
lens: bodies rendered with attentiveness and respect for their physical
reality, not bodies aestheticized as objects of possession.

Do not use this pack if the team deploying it is not prepared to think carefully
about whose bodies are featured, how they are lit, and what political and
historical contexts those images carry.
