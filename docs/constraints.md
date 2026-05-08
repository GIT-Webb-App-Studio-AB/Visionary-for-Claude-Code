# Constraint-Injection — anti-konvergens via tvingande regler

## Varför detta finns

AI-genererad UI har en farlig benägenhet att konvergera. Trots att
Visionary har 202 stilar i katalogen producerar generation-rymden ofta
visuellt likartade resultat: en grid av cards på vit bakgrund, blå
primary-knapp, sans-serif typografi, subtle hover-state. Den genomsnittliga
output skiljer sig sällan på något sätt som *känns*.

Det är inte modellens fel. Det är **typikalitetens** fel — sannolikheten
att producera en form ökar med hur många exempel modellen sett av den
formen, och de vanligaste formerna har sett miljarder av exempel. För att
bryta ur typikaliteten behövs en mekanism som *tvingar* generation att
röra sig bort från sannolikt-utfall mot osannolikt-utfall, utan att
användaren själv behöver formulera en tillräckligt udda promptsekvens
för att lyckas.

Constraint-injection är den mekanismen.

En *constraint* är en hård invariant — en testbar regel som **måste**
hålla efter generation: "noll element med border-radius < 12px",
"endast en typeface i hela komponenten", "viewport måste blöda från
kant till kant". Constraints är inte stilar, inte preferenser, inte
soft hints. De är post-generation-validerbara påståenden som antingen
är sanna eller falska.

Wild idea: "generera en hero-section, men inga rektanglar får finnas"
producerar något du aldrig sett. Constraints är ofta starkare creative-
driver än stilval — för en stil säger *vad* du ska göra, men en constraint
tar bort det självklara *sättet* att göra det och tvingar fram nytänkande.

## Hur det skiljer sig från stilval

| Stilval (Sprint 1) | Constraint (Sprint 21) |
|---|---|
| Soft bias mot ett visuellt vokabulär | Hård invariant som måste hålla |
| Påverkar prompt + receptval | Påverkar prompt + post-generation-validering |
| Kan ignoreras av modellen utan följder | Validator-fail → retry-budget 3 → drop |
| Komponerbart med andra stilval | Komponerbart med stilar OCH andra constraints |
| Ger likartad output över körningar | Ger varierad output (slumpvalt 1-3 ur 40) |

Constraints körs **efter** stilval i pipelinen (stage 2.6, mellan blend
i sprint 17 och critique i sprint 1). Det betyder att en blend och en
constraint kan kombineras — "swiss-rationalism × liminal-space + no-
rectangles" är ett giltigt frö för generation.

## Katalogen — 40 atomära regler

Constraints är sorterade i fem kategorier om åtta regler vardera. Varje
kategori adresserar en specifik dimension av sluttäligheten ("vad det
ser ut som").

### Form (8)

Hur element är formade — silhuetter, kanter, rumslig representation.

| ID | Vad den tvingar | Exempel-output |
|---|---|---|
| `no-rectangles` | Noll element med border-radius < 12px | Organisk blob-knapp; clip-path-cards |
| `single-shape` | Hela komponenten består av en upprepad form | Hero som 100 cirklar; cards som heptagon |
| `fractured-edges` | Inga raka kanter — varje shape har minst en oregelbundenhet | SVG-mask med jagged perimeter |
| `viewport-bleeds` | Innehåll måste lämna viewporten på minst en sida | Hero som blir av-skuren i botten |
| `text-as-shape` | Typografi används som visuellt block, inte läsbar text | Headline-bokstäver storlek 280px |
| `no-icons` | Noll iconfont/SVG-icon-användning | Allt indikatorinnehåll uttryckt i text |
| `sculptural-only` | Element måste ha 3D-djup via lighting/shadow | Knappar som fysiska objekt |
| `anti-card` | Inga rektangulära "innehållsboxar" — innehåll flyter fritt | Magazine-layout, ingen card-component |

### Color (8)

Palette- och färginvarianter som bryter den konventionella "primary +
secondary + accent + neutral"-kvartetten.

| ID | Vad den tvingar | Exempel-output |
|---|---|---|
| `single-color` | Hela komponenten i en hue ± 10° | Monokromatisk blå hero |
| `monochrome-only` | Endast oklch L-skala, ingen chroma > 0.05 | Editorial gråskala |
| `no-gradients` | Noll gradient-användning, alla bakgrunder solid | Flat-flat-flat |
| `max-3-colors` | Max 3 unika oklch-värden i hela komponenten | Constructivist 3-färgs |
| `complementary-only` | Endast hue-par 180° isär | Röd + cyan, inget annat |
| `desaturated-only` | Alla färger med chroma ≤ 0.10 | Dusty post-internet |
| `neon-on-black` | Bakgrund #000-ish, accenter chroma > 0.20 | Cyberpunk-aesthetic enforced |
| `paper-only` | Alla färger som finns i fysiskt pappersmaterial | Cream + jordnära toner |

### Typography (8)

Typografi-invarianter som bryter "headline serif + body sans + monospace
för code"-default.

| ID | Vad den tvingar | Exempel-output |
|---|---|---|
| `single-typeface` | En typeface för hela komponenten | Helt i Inter eller Playfair |
| `monospace-headlines` | Headlines i monospace, body får vara sans/serif | Tech-zine-vibe |
| `all-italic` | Alla textnoder i italic | Editorial poetry-vibe |
| `vertical-only` | All text orienterad vertikalt | CJK-inspirerad layout |
| `broken-baselines` | Inga delade baselines — varje textblock har egen | Dada-collage |
| `type-as-image` | Typografi behandlas som bild, inte text | Headline = enskild HTML-canvas |
| `no-uppercase` | Noll versaler, inte ens i headers | All-lowercase aesthetic |
| `weight-200-only` | All text font-weight 200 | Ultra-light premium-känsla |

### Layout (8)

Strukturella invarianter — hur element är arrangerade i 2D-rummet.

| ID | Vad den tvingar | Exempel-output |
|---|---|---|
| `asymmetry-only` | Noll horisontellt centrerade element | Asymmetrisk swiss |
| `broken-grid` | Inget genomgående grid — varje sektion egen logik | Magazine-layout |
| `every-section-breaks` | Varje sektion har visuellt avbrott från föregående | Manifesto-form |
| `no-center` | Inga element på horisontell mittlinje | Off-balance hero |
| `full-bleed-mandatory` | Alla sektioner blöder kant-till-kant | Ingen container max-width |
| `off-screen-anchors` | Minst ett element startar utanför viewport | Cinematic entrance |
| `diagonal-only` | All alignment på diagonal axis | Constructivist tilt |
| `vertical-stack-only` | Inga horisontella rader — allt staplat | Mobile-first extremism |

### Motion (8)

Rörelse-invarianter som bryter den default subtle/expressive-tier.

| ID | Vad den tvingar | Exempel-output |
|---|---|---|
| `no-transitions` | Noll CSS-transitions/animations | Static manifesto |
| `infinite-loop-mandatory` | Minst ett element animerar oändligt | Zoetrope-vibe |
| `scroll-driven-only` | All rörelse triggas av scroll | Editorial scrollytelling |
| `paused-by-default` | All rörelse kräver explicit user-trigger | Reduced-motion-first |
| `gesture-only` | Rörelse via mouse/touch-gesture, ej hover | Tactile interaction |
| `parallax-extreme` | Lager rör sig minst 0.3x scroll-hastighet | Depth-cinematic |
| `easing-overshoot` | All easing har overshoot-fas | Squishy spring-feel |
| `motion-as-content` | Rörelse är primär informationsbärare | Animated infographic |

## Conflict-set logik

Vissa constraints utesluter andra. Att välja `single-color` + `max-3-colors`
samtidigt är trivialt löst (single-color uppfyller max-3), men `single-
color` + `complementary-only` är direkt motsägelsefullt — du kan inte
ha "en hue" och "två komplementära hues" samtidigt.

Varje constraint har ett `conflict_set: [...]` fält i sitt YAML-schema:

```yaml
id: single-color
conflict_set:
  - complementary-only
  - max-3-colors  # trivially-true subset, men explicit för klarhet
  - neon-on-black  # tvingar två hues
```

Sampler-funktionen (Task 38.2) backtrackar på conflict-set: om ett
slumpvalt urval har inbördes konflikter förkastas hela urvalet och
ett nytt sample dras. Efter tre misslyckade försök reduceras
sample-storleken (3 → 2 → 1) tills en konfliktfri kombination
hittas.

Minimum 15 av de 40 constraints har explicit conflict_set definierat —
främst de som direkt motsäger katalogstilar (`pixel-perfect-grid`,
`swiss-rationalism-strict`, etc).

## Hur sampling fungerar

Vid `--constrain` flagga:

1. **Mode**:
   - `--constrain` (utan värde) → autoselect 1-3 random non-conflicting
   - `--constrain "no-rectangles, single-color"` → explicit list
2. **Count**: 1-3 är default-spannet. Färre = svagare bias, fler =
   risk för "alla constraints krockar".
3. **Sampling**:
   - Slumpa N constraints från katalogens 40
   - Validera mot conflict-set över paret
   - Om konflikt: backtrack och slumpa ny
   - Efter 3 backtracks: minska N med 1
4. **Trace**: `constraints_injected` event loggas med IDs + rationale.

Determinism: med `VISIONARY_SEED` env satt blir samplingen reproducerbar
för regression-testning.

## Validator-pass

Constraints är invarianter — de **måste** valideras. Annars är de bara
prompt-vibe, inte regler.

Pipeline-stage 2.7 (efter generation, före critique-loop) kör per-
constraint validator-funktion mot DOM/CSS via Playwright
`browser_evaluate`:

```js
// Exempel: no-rectangles validator
const failed = Array.from(document.querySelectorAll('*')).filter(el => {
  const cs = getComputedStyle(el);
  const radius = parseFloat(cs.borderRadius);
  return radius < 12 && el.offsetWidth > 32 && el.offsetHeight > 32;
});
return { passed: failed.length === 0, evidence: failed.map(el => el.tagName) };
```

Resultatet är `{passed: bool, evidence: string}`. Evidence går in i
nästa retry-prompt så modellen får konkret feedback ("element BUTTON
har border-radius 4px, constraint kräver ≥12px").

### Retry-budget 3

Vid validator-fail:

1. Bygg corrective prompt med evidence
2. Re-generate
3. Re-validate
4. Om fortfarande fail → repeat (totalt max 3 attempts)
5. Efter 3 attempts: **drop** offending constraint från active-set,
   logga `constraint_dropped`, fortsätt med kvarvarande constraints

Drop-on-fail är medvetet — bättre att leverera UI som uppfyller
*några* constraints än att blockera leverans när modellen kämpar med en
specifik invariant.

### Trace-events

| Event | Payload |
|---|---|
| `constraints_injected` | `{ids, rationale, sampled_at}` |
| `constraint_validation` | `{id, passed, evidence, attempt}` |
| `constraint_dropped` | `{id, reason: "exhausted retries", final_evidence}` |

## När du ska använda constraints

### Bra fall

- **Konvergerande output**: dina senaste 5 generations ser likadana ut
  trots olika prompts → constraints bryter mönstret
- **Designer som vill bli överraskad**: "ge mig något jag inte hade
  bett om" — constraints är just det
- **Brand som vill vara icke-typisk**: agencies, konstinstitutioner,
  fashion — branscher där "att inte se ut som alla andra" är värdet
- **Exploratory phase**: tidiga prototyper där du letar efter en
  vision innan committment till stil

### Dåliga fall

- **Strict brand-guidelines**: om brand mandatar specifika färger/forms
  kommer constraints fightas mot guidelines → frustration
- **Multi-page consistency**: constraints är per-generation, inte per-
  projekt. Att ha `no-rectangles` på hero men inte på footer ger
  inkonsekvent UI. Använd `/visionary-apply` för projekt-wide
  consistency.
- **Production-ready accessibility**: vissa constraints
  (`vertical-only`, `weight-200-only`, `no-uppercase`) kan kollidera
  med a11y-floors. Use with care.

## CLI

```bash
# Auto-select 1-3 random non-conflicting constraints
/visionary --constrain

# Explicit list
/visionary --constrain "no-rectangles, single-color, asymmetry-only"

# Combined with other Visionary features
/visionary --blend "swiss-rationalism, liminal-space" --constrain
/visionary --mood "calm-serious" --constrain "monospace-headlines"
```

## Källkod-tabell

| Fil | Funktion |
|---|---|
| `skills/visionary/constraints.md` | Schema-doc + validator-DSL |
| `skills/visionary/constraints/<id>.yaml` | 40 enskilda constraint-filer |
| `hooks/scripts/lib/constraints/inject.mjs` | Sampling + prompt-injection |
| `hooks/scripts/lib/constraints/validate.mjs` | Per-constraint validator-runner |
| `hooks/scripts/lib/constraints/__tests__/*.test.mjs` | Sampling + validator-tester |
| `commands/visionary.md` | `--constrain` flag-doc |
| `docs/constraints.md` | Denna fil |

## Vidare läsning

- `docs/anti-typicality.md` — den filosofiska grunden (Sprint 16)
- `docs/coined-styles.md` — komplementär feature (auto-promotion av
  accepted blends)
- `docs/critique-principles.md` — hur critique-loopen interagerar med
  validator-fails

## Sluttankar

Constraints är inte ett trick för att producera "weird UI". De är ett
verktyg för att tvinga modellen att tänka **förbi den vanligaste
lösningen** — vilket ofta är där intressant design börjar. Om du
någon gång stirrat på en AI-generation och tänkt "den här ser ut precis
som varje annan AI-generation jag sett", är det den känslan
constraints är designade att bryta.
