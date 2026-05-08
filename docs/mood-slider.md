# Mood Slider — Russell circumplex som stil-väljare

## Varför detta finns

För användare utan design-vokabulär är "vilken stil?" en omöjlig fråga.
202 katalog-namn (`swiss-rationalism`, `neubrutalism`, `vaporwave`,
`liminal-space`...) säger ingenting till någon som aldrig läst en
design-bok. "Vilket humör?" är begripligt — och Russell circumplex
(1980) ger oss en validerad 2D-mappning från humör till estetiska
parametrar: `valence × arousal`.

Mood-slidern är **2D-styrgreppet för icke-design-experter**: istället
för att försöka komma ihåg om Swiss eller Müller-Brockmann passar din
"calm and serious"-vision, sätter du `(valence=0.3, arousal=0.2)` och
får en kandidat-trio från rätt kvadrant. Designer-experter har fortsatt
sin direkta `--style`-väljning; icke-experter får en ingång som matchar
mänsklig intuition om hur en design ska "kännas".

Det är också en **anti-konvergens-mekanism**: två mood-koordinater nära
varandra ger olika kandidatlistor (top-3 är slumpmässigt vägd, inte
deterministisk top-1). Mood `(0.2, 0.2)` och `(0.25, 0.18)` ger inte
exakt samma stilar — slidern producerar variation även för marginellt
olika input.

## Russell circumplex på 30 sekunder

Två axlar:

- **Valence:** `0` = negativ/sad, `1` = positiv/happy
- **Arousal:** `0` = lugn/sleepy, `1` = upprörd/excited

Tillsammans bildar de ett 2D-plan som psykologisk forskning har
validerat sedan 1980 (Russell). Varje emotion kan placeras som en punkt
i planet. Vi mappar punkten till estetiska kluster i katalogen.

```
                arousal = 1
                    ▲
                    │
       Q2           │            Q1
   Low V, High A    │     High V, High A
   (raw/glitch)     │   (vibrant/pop)
                    │
   ─────────────────┼─────────────────▶ valence
                    │                  = 1
                    │
       Q3           │            Q4
   Low V, Low A     │     High V, Low A
   (swiss/calm)     │   (soft/dreamy)
                    │
                    ▼
                arousal = 0
   valence = 0
```

| Quadrant | Valence | Arousal | Estetiskt kluster |
|---|---|---|---|
| **Q1** | hög | hög | vibrant maximalist (`memphis`, `vaporwave`, `y2k-futurism`, `pop-art`, `bubblegum-bling`, `dopamine-design`) |
| **Q2** | låg | hög | brutalist/glitch (`architectural-brutalism`, `brutalist-honesty`, `glitchcore`, `cyberpunk-neon`, `neubrutalism`, `anxiety-urgency`) |
| **Q3** | låg | låg | swiss/calm/mono (`swiss-rationalism`, `swiss-muller-brockmann`, `liminal-space`, `default-computing-native`, `monochrome`, `zen-void`) |
| **Q4** | hög | låg | soft/dreamy (`liquid-glass`, `dreamcore`, `cottagecore-tech`, `coastal-grandmother`, `light-mode-sanctuary`, `hyper-comfort-hygge`) |

Varje kvadrant har minst 6 distinkta stilar (audit-krav i sprint 17
task 33.5 AC) — annars degenererar slidern och alla mood-koordinater i
samma kvadrant ger samma trio.

## Hur du använder

### Numeriska koordinater

```bash
/visionary-mood 0.8,0.2    # high V, low A → Q4 (soft/dreamy)
/visionary-mood 0.2,0.85   # low V, high A → Q2 (brutalist/glitch)
/visionary-mood 0.5,0.5    # neutral → mix från alla 4 kvadranter
```

Format: `<valence>,<arousal>` med båda värden i `[0, 1]`. Inga spaces
runt komman. `/visionary-mood 0.8, 0.2` (med space) parseas också men
varnar.

### Text-mood

För användare som inte vill räkna koordinater:

```bash
/visionary-mood happy-anxious      # → Q1 (vibrant + tense)
/visionary-mood calm-melancholic   # → Q3 (mono/swiss)
/visionary-mood serene             # → Q4
/visionary-mood angry              # → Q2
```

**Stödda text-fraser (16 per kvadrant, svenska + engelska):**

| Kvadrant | Engelska | Svenska |
|---|---|---|
| **Q1** (high V, high A) | excited, energetic, vibrant, joyful, hyped, ecstatic, playful, electric, bubbly, festive, exuberant, manic, giddy, cheerful, thrilled, pumped | upprymd, energisk, vibrerande, glad, hypad, euforisk, lekfull, elektrisk, bubblig, festlig, översvallande, manisk, fnittrig, glättig, upphetsad, peppad |
| **Q2** (low V, high A) | angry, anxious, tense, urgent, raw, aggressive, panicked, distressed, frustrated, alarmed, hostile, agitated, restless, unsettled, fearful, jittery | arg, ångestfylld, spänd, brådskande, rå, aggressiv, panikslagen, plågad, frustrerad, larmad, fientlig, upprörd, rastlös, otrygg, rädd, darrig |
| **Q3** (low V, low A) | calm, serious, minimal, sad, melancholic, quiet, subdued, contemplative, somber, reflective, weary, resigned, grave, austere, restrained, monastic | lugn, allvarlig, minimal, sorgsen, melankolisk, tyst, dämpad, kontemplativ, dyster, reflekterande, trött, resignerad, allvar, asketisk, återhållsam, klosterlik |
| **Q4** (high V, low A) | serene, soft, cozy, warm, peaceful, content, gentle, dreamy, tender, mellow, hygge, blissful, tranquil, comforted, nurtured, restful | rofylld, mjuk, mysig, varm, fridfull, nöjd, varsam, drömsk, öm, dämpat, hygge, salig, stillsam, tröstad, omhuldad, vilsam |

Fuzzy match (Levenshtein ≤ 2) gör att typos accepteras. "calmm" eller
"mysik" löses till "calm"/"mysig".

## Mappning till designparametrar

Mood styr inte bara stil-pool utan också specifika tokens i den
resulterande Design Reasoning Brief:

| Parameter | Drivs av | Effekt |
|---|---|---|
| **Palette saturation** | `valence` | hög V → vibrant; låg V → muted (oklch chroma scaled by valence) |
| **Motion-tier** | `arousal` | hög A → expressive/kinetic (tier 2–3); låg A → static/subtle (tier 0–1) |
| **Density** | quadrant-default | Q1/Q3 standard, Q2 dense, Q4 spacious — överstyrbar |
| **Style-pool** | `(V, A)` | primary quadrant + adjacent (om close-to-axis) |
| **Type-drama** | `arousal` | hög A → display/expressive; låg A → system-ui |
| **Texture** | (orthogonal) | quadrant-default (Q4 → smooth/glass, Q2 → grainy/raw) |

**Konkret exempel:** `/visionary-mood 0.85,0.15`

```
valence = 0.85 (hög)
arousal = 0.15 (låg)
→ Q4 (soft/dreamy)
→ style-pool: liquid-glass, dreamcore, cottagecore-tech, coastal-grandmother
→ palette saturation: hög (vibrant men muted via Q4-defaults)
→ motion-tier: 0 (Static) eller 1 (Subtle)
→ density: spacious (8–12 px grid)
→ type-drama: låg (system-ui eller mjuk humanist sans)
→ texture: smooth/glass
```

Top-3 kandidater returneras till user-pick eller, om mood feeds till
`--blend`, som anchors med vikter `[0.5, 0.3, 0.2]`.

## Adjacent quadrants — när det är relevant

Om mood ligger nära en axel (e.g. `valence=0.55, arousal=0.85`) är det
INTE rent Q1 — det är blandning Q1+Q2. Mood-mappern räknar närhet och
inkluderar `secondary_styles` från adjacent kvadrant.

**Adjacency-regler:**

- `|valence - 0.5| < 0.1` → adjacent på V-axeln (inkludera kvadrant på
  andra sidan)
- `|arousal - 0.5| < 0.1` → adjacent på A-axeln
- Båda < 0.1 → all 4 quadrants får candidates (neutral mood)

**Praktisk effekt:** `/visionary-mood 0.55,0.85` (precis ovanför Q1/Q2-
gränsen, hög arousal) ger:

```
primary (Q1):    memphis, vaporwave, post-internet-maximalism
secondary (Q2):  glitchcore, cyberpunk-neon
weights:         primary 0.7, secondary 0.3
```

Det betyder att även om du är i Q1, så bär kandidatlistan en touch av
Q2:s rawness — vilket matchar hur "high arousal med svag positiv
valence" verkligen känns (excited men spänt).

## Kombination med `--blend`

Mood och blend är komplementära, inte konkurrerande:

- **Mood** = bred styrning av default-pool (för icke-experter)
- **Blend** = exakt blandning av specifika anchors (för experter)

Du kan kombinera:

```bash
/visionary --blend "swiss:0.7 + liminal:0.3" --mood calm
```

→ blend används för stil-anchors i stage 2.5; mood används för
secondary parameters (palette saturation, motion-tier defaults).

Eller låt mood feeda till blend automatiskt:

```bash
/visionary-mood 0.2,0.2 --as-blend
```

→ mood-mapper hittar top-3 i Q3 (`swiss-rationalism`,
`swiss-muller-brockmann`, `liminal-space`) och triggar blend med vikter
`[0.5, 0.3, 0.2]`.

## Etisk hänsyn

**Affektiv inferens utan opt-in är förbjudet under EU AI Act (Article 5,
applicable from 2 February 2026 in workplace/educational contexts).**
Auto-detection av mood via kamera, mikrofon, eller textanalys kräver
explicit consent och är out-of-scope för Visionary.

Mood-slidern är OK eftersom **användaren själv anger sitt mood
manuellt**. Det är inte affektiv inferens — det är preferens-input.
Skillnaden:

| Tillåtet | Inte tillåtet |
|---|---|
| Användare skriver "calm" eller `0.2,0.2` | System läser av användarens ansikte |
| Användare väljer mood från lista | System analyserar text för känsloläge |
| Mood persisteras lokalt i `taste/facts.jsonl` | Mood skickas till tredje part utan opt-in |

Visionary loggar mood-input lokalt (samma `taste/`-flywheel som styles)
men inferrerar inte mood automatiskt. Sprint 21 evaluerar opt-in-bas
för mer avancerad mood-tracking — alltid med explicit toggle.

## När mood-slider är rätt verktyg

**Bra för:**

- Nya användare utan katalog-vokabulär — "calm" är begripligt; "swiss-
  müller-brockmann" är inte
- Snabbinkast i tidigt projekt-stadie där stil-direction inte är
  bestämd
- Iterations-sessioner där du vill prova "samma mood, olika stilar" via
  randomisering inom kvadrant
- Brand-tone-driven projekt där stil ska matcha en känsla (kund säger
  "vi vill kännas serene") snarare än en stil-tradition

**Mindre bra för:**

- Designer-experter som redan vet vilka 2–3 stilar matchar visionen —
  använd `--style` eller `--blend` direkt
- Produkter med strikt brand-guideline (palette + typografi är låst —
  mood adderar bara overhead utan att förändra output meningsfullt)
- Återkommande sessioner i samma projekt — mood är discovery-verktyg,
  inte production-verktyg. När stil är bestämd, använd `/apply` för att
  låsa den.

## Källkod

| Fil | Ansvar |
|---|---|
| `commands/visionary-mood.md` | Command-doc, slash-trigger, locale-stöd |
| `hooks/scripts/lib/mood-mapper.mjs` | Russell-mappning, kvadrant-pool, adjacent-logik, text-mood-lookup |
| `hooks/scripts/lib/mood-mapper-config.json` | Stil-pool per kvadrant, fuzzy-match-tabell |

## Källor

- **Russell, J.A. (1980).** "A circumplex model of affect". *Journal of
  Personality and Social Psychology*, 39(6), 1161–1178. — den originala
  formuleringen av valence × arousal-modellen.
- **Penn State Open Textbook.** "Circumplex Models of Affect". —
  pedagogisk översikt av modellen och dess validering över decennier.
- **Mehrabian, A. (1996).** "Pleasure-Arousal-Dominance: A general
  framework for describing and measuring individual differences in
  Temperament". *Current Psychology*. — VAD-modellen
  (Valence-Arousal-Dominance) lägger till en tredje axel som vi inte
  använder i v1. Sprint 21 evaluerar.
- **EU AI Act Article 5(1)(f).** Förbud mot affektiv inferens i
  workplace/educational contexts utan opt-in. Tillämpas från 2 februari
  2026. — varför auto-detection är out-of-scope.

## Relaterade docs

- [`docs/latent-style-mixing.md`](latent-style-mixing.md) — `--blend`-
  flagga och slerp-detaljer (mood kan feeda till blend)
- [`docs/anti-typicality.md`](anti-typicality.md) — Sprint 16 verbalized
  sampling (kompletterar mood för anti-konvergens)
- [`commands/visionary-mood.md`](../commands/visionary-mood.md) — slash-
  command-spec
- [`docs/sprints/sprint-17-latent-mixing.md`](sprints/sprint-17-latent-mixing.md)
  — Task 33.5 (mood-slider implementation)
