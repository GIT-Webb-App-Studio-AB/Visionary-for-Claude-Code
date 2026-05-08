# Patina-mode — design som åldras med kodbasen

## Varför detta finns

Det finns två typer av digital design: den som ser ny ut för alltid
(och därmed ser daterad ut det andra året trender skiftat) och den som
**åldras med tiden** — som blir bekant, lived-in, "min". Fysiska
objekt har alltid haft denna kvalitet: ett trägolv blir vackrare med
år av användning, en lädersitsa formas efter den som suttit i den.
Digitala interfaces har inte haft den möjligheten — pixlar är
oföränderliga, en gradient är samma gradient idag som om tre år.

Patina-mode är Sprint 23:s F7-mekanism: generated UI åldras enligt
mätbara drift-rates per månad. Chroma sjunker, radius växer, motion
saktar in, kanter mjuknar. Ålder hämtas från `git blame --first-parent`
på källfilen — ingen fake-timestamp, ingen runtime-tracking, bara
verklig kod-historia som ålder-källa. Effekten är subtil men
ackumulerande: en komponent byggd idag ser crisp ut, samma komponent
12 månader senare har lite av "lived-in"-känsla.

Det är också Visionarys mest direkta anti-konvergens-mekanism.
Konkurrenter (v0, Lovable, bolt.new) generar identisk-utseende output
oavsett när användaren ber. Patina ger varje codebase en unik visuell
biografi — en sajt som körts i två år ser inte ut som en sajt
genererad förra veckan, även om de delar stil-blueprint.

## Drift-rates per token

| Token | Drift per månad | Skäl |
|---|---|---|
| `chroma` | −2 % | Pigment bleknar; saturate sjunker över tid i fysiska media |
| `radius` | +0.5px | Skarpa kanter mjukar med slitage; corner-radius växer |
| `motion_duration_ms` | +5ms | Mekaniska system saktar in; spring-systems ackumulerar friktion |
| `edge_sharpness` | −1 % | Aliasing-fenomen; line-weight reduceras visuellt |

12-månaders kumulativ drift på en typisk komponent:

```
chroma:           -24 % (clampas mot floor 0.05 där relevant)
radius:           +6.0px
motion_duration:  +60ms
edge_sharpness:   -12 %
```

Visuellt: en knapp som idag har `oklch(0.55 0.18 240)` på 8px-radius
och 200ms-motion ser efter 12 månader ut som `oklch(0.55 0.137 240)`
på 14px-radius och 260ms-motion. Igenkännbar, men dämpad. "Den knappen
har varit här länge."

Värdena är empiriskt valda för att vara märkbara över 6+ månader men
osynliga vecka-till-vecka. För snabbare drift (test-purposes), se
`tokens/runtime/patina.json`'s `drift_multiplier`-flagga.

## `git blame` som ålder-källa

```
git blame --first-parent -L 1,1 src/components/Hero.tsx
# 8a3f1c2 (David Rydgren 2026-01-21 14:23:11 +0100 1) export function Hero() {
```

Vi läser första radens commit-date och beräknar ålder. I implementation
används `execFileNoThrow` (utility i codebase som ger Windows-kompatibel
hantering, ingen shell-injection-yta) — inte rå shell-exec. Pseudo-flöde:

```
authorTimeEpoch = parseGitBlamePorcelain(filePath, line=1)
ageMs = Date.now() - authorTimeEpoch * 1000
ageMonths = ageMs / (30.44 * 24 * 60 * 60 * 1000)   // avg månader
```

`--first-parent` säkerställer att merge-commits inte rasrar ålder. Om
någon mergar en gammal feature-branch in i main påverkas inte filens
"first-commit"-date. Det är när filen först **fanns på main** som räknas.

### Edge-cases

- **Ny fil**: ålder är 0, ingen drift applicieras.
- **Renamed fil**: `git log --follow` skulle ge tidigare namnets ålder.
  Vi använder INTE `--follow` i v1 — för komplext för deterministisk
  output. Renamed fil resetar ålder.
- **Filer utanför git**: ålder defaultar till 0. Patina applicieras
  inte. Output får trace event `patina_skipped: { reason: "not_in_git" }`.
- **Detached HEAD / shallow clone**: vi försöker; failure → ålder 0.

## APCA Lc 60 hard-floor

Den största risken med patina är att chroma-drift gör läsbarheten
sämre över tid. APCA (Accessible Perceptual Contrast Algorithm)
Lc 60 är vår hard-floor för body text.

```
applyPatina(token, ageMonths):
  drifted = applyDrift(token, ageMonths)

  if token.role in [body_text, foreground]:
    Lc = computeAPCA(drifted, token.background)
    if abs(Lc) < 60:
      // Floor hit — clamp drift back until Lc 60 reached
      drifted = clampToAPCAFloor(drifted, token.background, 60)
      emitTrace('patina_floor_hit', { token, original, clamped })

  return drifted
```

I praktiken: chroma kan inte sjunka under en floor som beräknas live
mot bakgrundsfärgen. När chroma närmar sig floor:n stannar drift, även
om filen är 24 månader gammal.

Vid `prefers-contrast: more` höjs floor:n till Lc 75. Patina-effekten
blir då nästan osynlig på body text — designen åldras bara på dekor
och radius/motion.

## Freeze-mekanism för stable releases

Live patina på en marknadssida är problematisk: returning visitors ser
sajten shifta över månader, vilket kan kännas som regression. För
production-säkerhet finns freeze-mekanismen:

```
# Innan release-tag, lås patina-state
/visionary-patina freeze
# tokens/runtime/patina.json får frozen_age_months per fil

git add tokens/runtime/patina.json
git commit -m "chore: freeze patina at v2.0 release"
git tag v2.0
```

Efter freeze:n är patina-state immutable tills `unfreeze` körs.
Filen kan editeras, ny commits kan läggas till, kodbasen kan utvecklas
— patina-läsningen ignorerar `git blame` och använder `frozen_age_months`
istället.

Användning:
- **Marknadssidor**: freeze vid varje deploy. Sajten ser konsistent ut
  för returning visitors.
- **Interna verktyg**: ofta OK med live patina. Användarna är samma
  team som ser kod-historiken; patina speglar deras gemensamma resa.
- **Hobby-projekt**: live patina ger personlig "min sajt"-känsla.

## "Levande historia" — koppling till anti-konvergens

Sprint 16:s anti-typicality-arbete (Verbalized Sampling +
originality-dimension) attackerar konvergens vid generation. Patina
attackerar konvergens **över tid**. Två sajter genererade med samma
StyleBrief idag är distinkta. Två sajter genererade med samma
StyleBrief förra året, körda i produktion sedan dess, är **mer**
distinkta — patina har drivit dem isär.

Detta är Visionarys moat. Konkurrenter kan kopiera Verbalized
Sampling. Men kopiera "designen åldras med kodbasen" kräver att
hela tooling-stacken är byggd med drift-rates och git-blame-
integration som första-klass-koncept. Det är inte ett feature; det
är en arkitektonisk hållning.

Konkret: Visionarys 18 månaders-gamla codebases är **visuellt
distinkta** från andra Visionary-codebases på ett sätt som kommer ur
deras specifika commit-historia. Det är "levande historia" — sajten
har ärr av sin egen utveckling.

## Risker och mitigeringar

### Risk: surprise / confusion

En användare som inte vet att patina är aktivt kan undra varför
sajten ser annorlunda ut idag jämfört med för 6 månader sedan.

**Mitigering**:
- Default OFF. Patina aktiveras bara explicit via stil-config eller
  `--patina`-flagga.
- Dokumenterad i `commands/visionary-patina.md` och denna doc.
- `freeze` är trivial att aktivera för production.
- Drift-rates är tillräckligt långsamma att vecka-till-vecka skillnader
  är osynliga.

### Risk: APCA-floor-violation över tid

Drift som ackumulerar över 24+ månader kan teoretiskt nå punkt där
clamping sker varje render.

**Mitigering**:
- APCA Lc 60 hard-floor i token-pipeline (build-time) + runtime-
  validation.
- Test fixture med 24-månader git-blame validerar 0 violations.
- Trace event `patina_floor_hit` emitteras så monitoring kan fånga
  edge-cases.

### Risk: git blame långsamt på stora repos

Stora monorepos kan ha `git blame` som tar 100ms+ per fil.

**Mitigering**:
- Patina körs vid build-time, inte runtime. 100ms × 50 components =
  5s till build — försumbart i CI/CD.
- Per-fil cache i `tokens/runtime/.patina-cache.json` (invalideras vid
  git HEAD-change).
- Fallback till "ålder = 0" om `git blame` failar inom timeout 500ms.

## Kod-exempel + CLI-usage

### Aktivera patina på en stil

```yaml
# styles/editorial-calm.yaml
id: editorial-calm
patina:
  enabled: true
  drift_multiplier: 1.0   # default 1.0; sätt 0.5 för långsammare, 2.0 för snabbare
  floors:
    apca_lc: 60
    chroma: 0.05
```

Vid generation:

```
# Patina enligt stil-config
/visionary "hero section, editorial calm"

# Force-aktivera även om stil säger off
/visionary "hero section" --patina

# Force-deaktivera även om stil säger on
/visionary "hero section, editorial calm" --no-patina
```

### Inspektera nuvarande patina-state

```
/visionary-patina status

# Output:
# src/components/Hero.tsx
#   age:         3.4 months
#   drifts:
#     chroma           -0.068
#     radius           +1.7px
#     motion_duration  +17ms
#     edge_sharpness   -0.034
#   floors_hit:        none
#   frozen:            false
```

### Freeze före release

```
# Lås all patina vid nuvarande ålder
/visionary-patina freeze

# Lås en specifik fil vid en specifik ålder
/visionary-patina freeze 6   # 6 månader, oavsett verklig ålder

# Reset till "freshly generated"
/visionary-patina freeze 0
```

### Preview hur en fil skulle se ut vid given ålder

```
/visionary-patina preview src/components/Hero.tsx --age 12

# Renderar Hero med 12-månader-drift utan att modifiera fil
# Användbar för "vad kommer detta se ut om ett år"-tester
```

### Unfreeze

```
/visionary-patina unfreeze

# Eller per fil
/visionary-patina unfreeze src/components/Hero.tsx
```

## Trace events

Patina emitterar följande trace events:

- `patina_applied` — `{file, age_months, drifts_applied, floors_hit}`
- `patina_floor_hit` — `{file, token, original_value, clamped_value, floor_type}`
- `patina_frozen` — `{file, frozen_age_months, prior_age_months}`
- `patina_unfrozen` — `{file, prior_frozen_age_months}`
- `patina_skipped` — `{file, reason}` (e.g. "not_in_git", "git_blame_timeout")

Events går till `${CLAUDE_PLUGIN_DATA}/trace/patina-*.jsonl`. Sprint 14:s
active governance konsumerar dessa för drift-detection — så att
gradvis-ackumulerande patina-drift inte felaktigt klassificeras som
"code drift" som ska åtgärdas.

## Tester

```
hooks/scripts/lib/runtime/__tests__/patina.test.mjs
```

Coverage:
- 3-månader fixture → chroma -6 %, radius +1.5px (matematik validerad)
- 12-månader fixture → chroma -24 %, radius +6.0px
- 24-månader extreme drift → APCA-floor clampar (`patina_floor_hit`
  emitterat)
- `freeze` skriver till `patina.json`, persisterar över sessioner
- `unfreeze` återställer live age-driven drift exakt
- `prefers-contrast: more` höjer floor till Lc 75
- Edge-case: ny fil (ålder 0) → ingen drift
- Edge-case: fil utanför git → patina_skipped emitterat
- 1000 random-fixture-fuzz: 0 APCA-floor-violations

## Performance

- Build-time: ~50ms per fil (`git blame` + drift-beräkning + clamp)
- Cache-hit: ~2ms per fil
- Runtime: 0ms (allt är pre-baked vid build)
- Bundle-impact: ~0.6 KB (drift-state + clamp-runtime för CSS custom
  property-update vid `freeze` toggle)

## Källor

- **APCA**: Myndex Research, "Accessible Perceptual Contrast
  Algorithm". WCAG 3 candidate. Lc 60 empiriskt vald för body text.
- **`git blame --first-parent`**: git-scm.com/docs/git-blame. Förste-
  parent-traversal hindrar merge-commits från att rasera ålder.
- **OkLCH**: Lilley, C. (2022). "OKLCH in CSS". W3C CSS Color Module
  4. Drift sker i oklch eftersom det är perceptuellt linjärt.
- **Material aging i fysiska media**: Albers, J. (1963). "Interaction
  of Color". Yale University Press. — pigment-bleaching-effekten vi
  emulerar.

## Relaterade docs

- [`docs/runtime-context.md`](runtime-context.md) — master-doc för alla 3
  runtime-mekanismer
- [`docs/circadian-design.md`](circadian-design.md) — F1 (companion mechanism)
- [`docs/network-aware.md`](network-aware.md) — F4 (companion mechanism)
- [`docs/anti-typicality.md`](anti-typicality.md) — Sprint 16-koppling
  (patina som anti-konvergens-mekanism över tid)
- [`commands/visionary-patina.md`](../commands/visionary-patina.md) — CLI-doc
- [`docs/active-governance.md`](active-governance.md) — drift-detection
  konsumerar `patina_applied`-events
- [`docs/sprints/sprint-23-context-runtime.md`](sprints/sprint-23-context-runtime.md)
  — Task 42.3
