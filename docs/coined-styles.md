# Coined Styles — Visionary blir självväxande

## Vad coined styles är

En *coined* style är en ny katalog-stil som Visionary auto-promoterar
från användarens egna accepterade blends. Tanken är enkel: om du
gång på gång accepterar `swiss-rationalism × liminal-space` i 70/30-blend,
så är det inte längre en *blend* — det är en stil. Din stil. Visionary
ska behandla den som det.

Det här är komplementen till constraint-injection (sprint 21 task 38.1-3):
constraints bryter typikalitet på generation-nivå, coined styles fångar
*motsatsen* — de personliga preferenser som kristalliseras över tid och
förtjänar förstaklass-status.

Resultatet är att Visionary blir **självväxande**. Katalogen börjar med
202 stilar; efter sex månaders användning kan din katalog ha 215 stilar
där 13 är dina egna namnsatta blends, integrerade i samma sökning,
indexering och loader som de hand-författade stilarna.

## Lifecycle — från acceptans till katalog-stil

### Steg 1: Blend accepteras

När du genererar UI med `--blend` (Sprint 17) eller plockar en variant
ur `/variants` som råkar vara en blend, registreras blend-vektorn som en
acceptans i taste-flywheelen.

Vad "acceptans" betyder beror på källan:

- **Explicit**: du anger `--blend "swiss, liminal"` och accepterar resultatet
  (variant-pick eller positiv git-signal)
- **Implicit**: Sprint 17:s blend-engine sampler `swiss-liminal` ur en mood-
  region och du accepterar
- **Pair-vinst**: i `/variants` slår blend-genereringen en katalog-stil

### Steg 2: `updateAcceptanceCount`

```js
import { updateAcceptanceCount } from 'hooks/scripts/lib/coined-styles.mjs';

const result = updateAcceptanceCount({
  vector: { density: 0.5, chroma: 0.7, ... },
  anchor_recipe: [
    { id: 'swiss-rationalism', weight: 0.7 },
    { id: 'liminal-space', weight: 0.3 },
  ],
  projectRoot,
});
// result = { mode: 'created', entry: {...} }
//   eller    { mode: 'updated', entry: {...} }
```

Funktionen söker bland existerande JSONL-entries efter ett vector-similar
entry (cosine ≥ 0.85 i 8D-rummet). Om hit: bumpa `accepted_count` och
uppdatera `last_seen`. Om miss: skapa ny entry via Sprint 17:s
`persistCoinedBlend`.

Threshold 0.85 är empirisk — under den nivån produceras visuellt
distinkta UI:er trots liknande vector. Över 0.85 är resultaten i praktiken
utbytbara.

### Steg 3: `checkPromotion`

Efter varje `updateAcceptanceCount` kör flywheelen `checkPromotion`. En
entry kvalificerar för promotion om:

1. `accepted_count ≥ 3`
2. `now - first_seen ≥ 7 dagar`
3. `promoted_at` är inte satt (inte redan promoterad)

Båda gates måste hålla samtidigt. Detta är medvetet:

- **Count-gate (3)**: ett tillfälligt experiment är inte en stil. Du
  accepterade kanske `cottagecore × cyberpunk` en gång på skoj —
  det blir inte en katalog-stil av en enda acceptans.
- **Maturity-gate (7 dagar)**: skyddar mot user-noise från en enda
  arbetssession. Om du genererar samma blend 5 gånger på en
  morgon räknas det inte som "vald över tid"; det är iteration på en
  pågående uppgift, inte konvergerande smak.

### Steg 4: `promoteToCatalog`

När en entry passerar gates skapar Visionary en markdown-fil i
`skills/visionary/styles/extended/coined-<auto-name>.md`:

```markdown
---
id: coined-vibrant-rationalism
category: extended
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [vibrant, retro]
keywords: [coined, auto-promoted, vibrant, rationalism]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
coined:
  promoted_at: "2026-05-13T10:00:00Z"
  source_id: coined-abc123def456
  accepted_count: 3
---

# Coined: vibrant-rationalism

**Category:** extended (auto-promoted from accepted blends)
**Motion tier:** Subtle
**Source id:** `coined-abc123def456`

## Origin
[...]

## 8D Embedding
- **density**: 0.50
- **chroma**: 0.95
[...]
```

Samtidigt:

1. `_index.md` får en bullet-line under ny `## Coined Styles`-sektion
2. JSONL-entryn markeras med `promoted_at` + `name` + `promoted_filename`
3. Loader plockar upp filen vid nästa session-start — coined-stilen är
   nu sökbar via samma mekanism som hand-författade stilar

### Steg 5: Loader behandlar den som vilken stil som helst

Coined styles laddas av samma loader som katalogstilar. När du nästa
gång gör en generation kan resolvern bias mot `coined-vibrant-
rationalism` direkt — det dyker upp i candidate-pool, har 8D-vector
för embedding-search, och kan blendas med andra stilar.

## Auto-name generation — hur namnet skapas

Sprint 21 v1: **deterministic** namn (ingen LLM-call). Detta är en
medveten design-choice:

- **Reproducible**: samma vektor + recipe → samma namn, alltid.
  Promotion får inte bero på en LLM-roll-of-the-dice.
- **Offline**: ingen network-call krävs vid promotion. Visionary
  fungerar lika bra utan API-key som med.
- **Profanity-fri**: deterministisk algoritm kan inte producera
  "blasphemous-cathedral" om vector inte explicit pekar dit.

Algoritmen:

1. Hitta den axel som är **längst från 0.5** i 8D-vectorn (den mest
   "uttalade" dimensionen). Ties brutna av canonical AXES-ordning.
2. Mappa axel + riktning till en descriptor:
   - `density` high → "dense", low → "spacious"
   - `chroma` high → "vibrant", low → "muted"
   - `formality` high → "formal", low → "casual"
   - `motion_intensity` high → "kinetic", low → "still"
   - `historicism` high → "retro", low → "modern"
   - `texture` high → "tactile", low → "smooth"
   - `contrast_energy` high → "sharp", low → "soft"
   - `type_drama` high → "expressive", low → "restrained"
3. Suffix: tyngsta anchorns sista hyphen-segment.
   `swiss-rationalism` → "rationalism", `frutiger-aero` → "aero".
4. Compose `<descriptor>-<suffix>`, lowercase, kebab-case.

Exempel:

| Recipe (heaviest anchor → suffix) | Dominant axis | Auto-name |
|---|---|---|
| swiss-rationalism + liminal-space, chroma 0.95 | chroma high → vibrant | `vibrant-rationalism` |
| synthwave + cottagecore, motion 0.95 | motion high → kinetic | `kinetic-synthwave` |
| brutalist-web + dark-academia, density 0.95 | density high → dense | `dense-web` |
| cottagecore + paper-cut, texture 0.05 | texture low → smooth | `smooth-cottagecore` |

### Sprint 22 v2 (planerad): Haiku-batch

Senare kan vi lägga till en Haiku-batch-call som returnerar en mer
poetisk 2-word-form ("calm-arcade", "feral-grid", "wounded-monolith") —
men deterministic-namnet förblir fallback om LLM-call failar eller
producerar profanity.

## Storage

```
${CLAUDE_PLUGIN_DATA}/taste/coined-styles.jsonl
                                ^
                                JSONL — en entry per rad
```

Default-resolution följer Sprint 15 storage-konvention:

1. `VISIONARY_COINED_STYLES_PATH` env satt → använd den (för tester)
2. `CLAUDE_PLUGIN_DATA` env satt → `<that>/taste/coined-styles.jsonl`
3. Annars → `${projectRoot}/taste/coined-styles.jsonl` (dev-fallback)

Markdown-filerna däremot bor i `skills/visionary/styles/extended/`.
Det är medvetet — loader-koden ska inte skilja på "katalog-stil" och
"coined-stil"; det är bara en `category: extended` i front-matter.

### Cross-project shared

Eftersom JSONL bor under `${CLAUDE_PLUGIN_DATA}` (per default), är
coined styles **delade mellan dina projekt**. Om du accepterar
`swiss-liminal` 3 gånger över 7 dagar — oavsett vilka projekt du jobbar
i — kommer den promoteras EN gång och vara tillgänglig i alla.

Det här är medvetet. Coined styles är en del av din *taste*, inte din
projektskonfiguration. Smak följer dig mellan jobb.

### LRU-eviction

JSONL har soft-cap på 100 entries. När en 101:a entry skulle skapas
faller den äldsta (per `last_seen`) bort. Detta hindrar disk-bloat
över årslångt användande utan att förlora frequently-used styles.

LRU-eviction är konfig-styrd via `VISIONARY_COINED_LRU_LIMIT` env
(default 100, accepterar 50-1000).

## Management commands

Användaren kan inspektera och styra sin coined-katalog via
`/visionary-coined`:

| Subcommand | Vad den gör |
|---|---|
| `list` | Lista alla coined entries med count, age, status |
| `view <id>` | Visa full record + rendered markdown |
| `rename <id> <name>` | Skriv över auto-namn |
| `eject <id>` | Ta bort från extended/, behåll i taste-history |

Se `commands/visionary-coined.md` för full doc.

### Eject-semantik

`eject` är en **mjuk** borttagning:

- Markdown-filen tas bort från extended/
- `_index.md`-line strippas
- JSONL-entryn behåller `vector`, `accepted_count`, `first_seen`,
  `last_seen` — bara `promoted_at` + `promoted_filename` rensas

Effekt: stilen försvinner ur katalogen, men om du fortsätter acceptera
samma blend kommer den att re-promoteras. Acceptans-räknaren börjar
INTE från noll.

Det här är skydd mot ångerfulla rage-eject — om du tar bort en stil
som du sedan ångrar dig om, behöver du inte vänta 7 nya dagar att
samla 3 nya acceptanser. Den kommer tillbaka första gången du
accepterar den blend igen efter eject.

## Integritet och privacy

- **Ingen export**: Sprint 21 har INGEN export-mekanism. Coined styles
  är personliga och delas inte. Sprint 22 kan introducera opt-in
  export via `/visionary-coined export` om community-mönster blir
  värdefulla att dela.
- **Ingen network-call**: Promotion fungerar offline. Inga LLM-calls,
  inga analytics-pings, inget telemetri. Allt händer på din disk.
- **Opt-out**: `VISIONARY_DISABLE_TASTE=1` env stänger av hela taste-
  flywheelen inklusive coined-promotion. JSONL slutar skrivas, redan
  promoterade styles fortsätter laddas.

## Koppling till anti-typicality-visionen

Sprint 16 etablerade anti-typicality-grunden: typiskt utfall är
modellens default, och vi behöver mekanismer som rör output bort
från det. Sprint 17 introducerade *blends* som ett kontinuerligt
sätt att navigera mellan katalog-stilar utan att begränsas till de
202 hand-författade. Sprint 21 (constraints + coined) levererar två
komplementära halvor:

1. **Constraints** trycker mot icke-typiskt utfall via tvingande
   regler (utåtriktad force).
2. **Coined styles** fångar var dina personliga preferenser
   konvergerar och kristalliserar dem (inåtriktad memory).

Tillsammans gör de Visionary till ett system som **både utforskar
bredare** (constraints) **och minns smartare** (coined). Inget annat
AI-design-verktyg har den symmetrin i Q3 2026.

## Källkod-tabell

| Fil | Funktion |
|---|---|
| `hooks/scripts/lib/coined-styles.mjs` | Full impl: persist, dedup, promotion, eject, rename |
| `hooks/scripts/lib/__tests__/coined-styles.test.mjs` | Sprint 17 stub-tester |
| `hooks/scripts/lib/__tests__/coined-styles-promotion.test.mjs` | Sprint 21 promotion-tester |
| `commands/visionary-coined.md` | Management command-doc |
| `skills/visionary/styles/extended/coined-*.md` | Auto-genererade markdown-filer |
| `skills/visionary/styles/_index.md` | Index med `## Coined Styles`-sektion |
| `${CLAUDE_PLUGIN_DATA}/taste/coined-styles.jsonl` | Persistens-fil |
| `docs/coined-styles.md` | Denna fil |

## Vidare läsning

- `docs/constraints.md` — komplementär feature i samma sprint
- `docs/anti-typicality.md` — Sprint 16 filosofisk grund
- `docs/latent-style-mixing.md` — Sprint 17 blend-engine
- `docs/taste-flywheel.md` — Sprint 5 fundamenten coined bygger på

## Sluttankar

Coined styles är Visionarys svar på en obekväm sanning: AI-design-
verktyg förstår "vad" du gillar, men minns inte "vad" du *fortsatt*
gillar. Efter sex månaders användning är skillnaden mellan
"katalogen som finns" och "katalogen som passar dig" ofta större än
katalogen själv.

Coined styles stänger den klyftan utan att kräva manuell stil-
författande. Du gör vad du gör; Visionary noterar mönstret; över tid
växer din katalog att se ut som dig. Det är så det ska vara.
