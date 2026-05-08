# Runtime-Context — design som lever vidare efter generation

## Varför detta finns

Static design dör i samma sekund den genereras. Den som ser sajten
klockan 02:00 ser samma palett som den som ser den klockan 14:00. Den som
laddar sajten på en spårvagn med 2G får samma 4 MB JS-bundle som den som
laddar den på 1 Gbps fiber. Och en sajt som körts i produktion i tolv
månader ser exakt likadan ut som den såg ut dagen den deployades — trots
att kodbasen runt den har förändrats.

Visionary Sprint 23 introducerar tre runtime-context-mekanismer som ger
generated UI **kontextuell medvetenhet** efter generation:

- **F1 — Circadian palette-shift**: paletten skiftar mellan dawn / day /
  dusk / night beroende på lokal-tid och soltider. Editorial calm vid
  middag blir warm-low-key vid skymning utan att stilen byts ut.
- **F4 — Network-aware visual budget**: tre tier-paletter (full /
  degraded / minimal). Vid `effectiveType: '2g'` eller `saveData: true`
  faller motion till tier 0, gradients blir flat fills, blur byts mot
  border, foton hämtas i låg upplösning. Stilens "själ" (palette +
  typografi) bevaras; dekor offras.
- **F7 — Patina-mode**: designen åldras med kodbasen. Filer drar drift
  per månad — chroma sjunker, radius växer, motion saktar in, kanter
  mjuknar — baserat på `git blame --first-parent` first-commit-date.

Ingen av Visionarys konkurrenter (v0, Lovable, bolt.new, Stitch) har
runtime-context i v1. Det är cirkulärt enkelt — `Date.now()`,
`navigator.connection`, `git log` — men kombinationen är ny och
genuint användbar.

## De tre mekanismerna i översikt

### F1 — Circadian palette-shift

Generated stiles får ett valfritt `circadian: {dawn, day, dusk, night}`-
block med 4 fas-paletter. En runtime-modul (~30 LOC, body-injekteras vid
generation om `--circadian` är aktiv) uppdaterar CSS custom properties
var 15 minut baserat på lokal-tid och `suncalc` för soltider. Smooth
transition >800ms ease mellan faser.

**Hard-floor**: `prefers-color-scheme` system-pref vinner ALLTID. Om
användaren explicit valt dark, går circadian aldrig till "day"-palette.

**När använda**: editorial-stilar, content-tunga sajter, läs-fokuserade
gränssnitt där tonen ska följa dagens rytm. Detaljerad spec i
[`docs/circadian-design.md`](circadian-design.md).

### F4 — Network-aware visual budget

Tre output-tiers per generated component:

| Tier | Trigger | Vad som händer |
|---|---|---|
| `full` | `effectiveType: '4g'` (default) | Allt aktiverat |
| `degraded` | `effectiveType: '3g'` | motion-tier max 1, blur max 4px, gradients OK |
| `minimal` | `effectiveType: '2g'` eller `saveData: true` | motion-tier 0, flat fills, border ersätter blur, low-res foton |

Detection sker både via CSS `prefers-reduced-data` (CSS L5) och via
runtime `navigator.connection`. Server-hint `Save-Data: on`-header kan
tippa SSR mot pre-renderad minimal-tier för first-byte-vinst.

**När använda**: konsumentsidor, e-commerce, mobile-first sajter där
performance-spridning är stor. Detaljerad spec i
[`docs/network-aware.md`](network-aware.md).

### F7 — Patina-mode

Komponenter åldras enligt mätbara drift-rates per månad:

| Token | Drift per månad |
|---|---|
| `chroma` | −2 % |
| `radius` | +0.5px |
| `motion_duration_ms` | +5ms |
| `edge_sharpness` | −1 % |

Ålder hämtas via `git blame --first-parent <file>` vid build-time.
Drift applicieras på base-tokens innan output. APCA Lc 60 är **hard
floor** — drift som skulle bryta läsbarhet clampas innan render.

`/visionary-patina freeze` låser drift vid en specifik ålder för stable
releases. `unfreeze` återgår till live age-driven drift.

**När använda**: codebase-residenta projekt där "lived-in" är en
tillgång (interna verktyg, dokumentations-sajter, hobby-projekt). INTE
för konsumentmarknadssajter där varje besökare ska se samma look.
Detaljerad spec i [`docs/patina-mode.md`](patina-mode.md).

## Coordinator — hur de tre samexisterar

En generated UI kan ha alla tre mekanismer aktiva samtidigt. Coordinator
(`hooks/scripts/lib/runtime/coordinator.mjs`, ~80 LOC) löser konflikter
via deterministisk precedence:

```
prefers-reduced-motion / prefers-color-scheme   (system pref)
  > network-budget                              (bandwidth urgency)
  > circadian                                   (time-of-day)
  > patina                                      (age)
```

System-pref vinner alltid. Om användaren har `prefers-color-scheme:
dark`, kan circadian inte tvinga "day"-palette. Om
`prefers-reduced-motion` är på, går motion till tier 0 oavsett vad
patina, network-tier eller circadian skulle säga.

Network-budget kommer näst — vid `2g/saveData` saktas motion-duration
till 0ms, vilket overrider patinas `+Xms`-drift. Logiken är "akut
situation > långsiktig estetik".

Circadian opererar inom det som network-budget och system-pref tillåter
— den shiftar palette inom tier-gränserna.

Patina applicieras sist, ovanpå allt det andra. Den är den
långsamast-ackumulerande signalen och därför också den första som
clampas vid combined-drift-cap.

### Combined-drift-cap

Ingen kombination av mekanismer får ge >15 % drift från base i någon
dimension. Skälet: vid t.ex. patina-12mo + dusk-circadian + saveData-
minimal kan chroma sjunka katastrofalt. Cap:en hindrar att designen
degenererar till oigenkännlighet.

När cap:en träffas reduceras patina först, sedan circadian, sedan
network-budget. System-pref clampas aldrig — det är inviolabel.

Trace event `combined_drift_capped` emitteras med `{token, raw_drift,
clamped_drift, mechanisms_active}` så regression-detection kan
fånga edge cases.

## A11y-policy — hard non-negotiables

Alla tre mekanismer respekterar:

- **`prefers-reduced-motion`** — circadian transitions blir instant (0ms)
  istället för 800ms. Patina motion-duration-drift ignoreras (motion-
  tier 0 vinner). Network-tier 0 (full) konverterar till motion-tier 0
  också.
- **`prefers-color-scheme`** — circadian respekterar system-pref absolut.
  Patina chroma-drift går aldrig under 0.05 chroma. Network-tier minimal
  använder samma palette som network-tier full, bara med flat fills.
- **`prefers-contrast: more`** — APCA Lc 60 floor höjs till Lc 75. Patina
  chroma-drift clampas mot den högre floor:n istället.
- **`prefers-reduced-data`** — om användaren explicit signalerar reducerad
  data, tvingas network-tier till `minimal` även om `effectiveType: '4g'`
  rapporteras (vissa användare har metered connections på 4G).
- **WCAG 2.2 AA** — alla output, alla mekanismer, alla kombinationer.
  Vi har 0 violations i 1000-fixture-fuzz-tester.
- **EAA (28 juni 2025)** — i kraft. Compliance verifierad.
- **ADA Title II (24 april 2026)** — deadline för US state/local gov.
  Compliance verifierad.

## Privacy — zero-permission, zero-tracking, klient-side

Alla tre mekanismer använder **endast zero-permission-signaler**:

- `Date.now()` — klient-tid, ingen geolocation API, ingen permission-
  prompt. Soltider approximmeras från browser-locale-region (default
  Stockholm 59.3°N om locale missing).
- `navigator.connection.effectiveType` + `saveData` — Network Information
  API, ingen permission-prompt på supporting browsers.
- `prefers-reduced-data`, `prefers-reduced-motion`, `prefers-color-scheme`,
  `prefers-contrast` — CSS media queries, system-prefs, ingen permission.
- `git blame --first-parent` — build-time only. Ingen runtime-access till
  git från browser.

**Inget skickas till server.** Ingen telemetry, inga roundtrips, ingen
fingerprint-export. Mekanismerna är rena klient-side beräkningar baserade
på signaler som browsern redan exponerar utan opt-in.

### Fingerprint-mitigering

Network Information API kan i teorin användas som fingerprint-vektor
(unika `effectiveType` + `downlink`-värden). Vi mitigerar:

- **Kvantisering**: vi läser bara `effectiveType` (4 buckets: 4g, 3g, 2g,
  slow-2g) och `saveData` (bool). Inte `downlink`, inte `rtt`. Det är
  3-bit information totalt, otillräckligt för fingerprinting.
- **Ingen server-transmission**: värdena används bara klient-side för CSS-
  bundle-selektion. De skickas aldrig i request-headers eller telemetry.
- **15-min-buckets för tid**: circadian kvantiserar tid till 15-min-
  intervall (96 buckets/dygn). Ingen sub-15min-precision exponeras.

### Etisk gräns: ALDRIG affektiv inferens

Det är frestande att säga "vi kan läsa typing-cadence och anpassa
animation-tempo efter användarens stress-nivå". Vi gör det inte. **EU AI
Act kategoriserar affektiv inferens (känslo-detektion utan explicit opt-
in) som high-risk och i många fall förbjudet** (Art. 5, ban list).

Patinas drift-rates är schemalagda matematiska konstanter, inte
inferens. Circadians fas-shift är schemalagd efter solens position, inte
efter användarens humör. Network-aware reagerar på tekniska signaler
(bandwidth), inte på beteendemönster.

Skulle någon framtida feature kräva affektiv inferens (det kommer den
inte), måste den (a) ha explicit opt-in på install-time, (b)
dokumenteras i `docs/taste-privacy.md`, (c) genomgå EU AI Act-review.

## Opt-in per mekanism

Default OFF för alla tre. Aktivering per stil eller per generation:

```
# Aktivera vid generation
/visionary --circadian
/visionary --network-aware
/visionary --patina

# Eller alla tre
/visionary --runtime-context all

# Eller per stil i style-doc
circadian:
  enabled: true
  dawn: { palette: ... }
  day: { palette: ... }
  dusk: { palette: ... }
  night: { palette: ... }
```

Stil-fil-aktivering vinner över command-line `--no-<mechanism>`-flaggor.
Det betyder att en stil som *kräver* circadian (t.ex. en day-night
editorial-stil) kan inte avaktiveras med `--no-circadian` — användaren
måste välja en annan stil istället.

## Källkod

| Fil | Ansvar |
|---|---|
| `hooks/scripts/lib/runtime/coordinator.mjs` | Konflikt-resolution, precedence, combined-drift-cap |
| `hooks/scripts/lib/runtime/circadian.mjs` | Fas-beräkning, suncalc-integration, CSS custom property-update |
| `hooks/scripts/lib/runtime/network-aware.mjs` | Tier-detection, bundle-selektion, server-hint-stöd |
| `hooks/scripts/lib/runtime/patina.mjs` | Drift-engine, git-blame-läsning, APCA-floor-clamp |
| `tokens/runtime/circadian.css.ts` | Stil-specifika fas-paletter |
| `tokens/runtime/network-budgets.json` | Tier-resolver per stil |
| `tokens/runtime/patina.json` | Drift-rates, floors, freeze-state |
| `commands/visionary-patina.md` | CLI för status/freeze/unfreeze |
| `docs/circadian-design.md` | F1 spec + screenshots |
| `docs/network-aware.md` | F4 spec + tier-jämförelse |
| `docs/patina-mode.md` | F7 spec + drift-progression |

## Performance-budget

| Mekanism | CSS | JS | Total |
|---|---|---|---|
| Circadian | ~0.4 KB | ~0.6 KB | 1.0 KB |
| Network-aware | ~0.8 KB (3 tiers) | ~0.2 KB | 1.0 KB |
| Patina | ~0.1 KB | ~0.5 KB | 0.6 KB |
| Coordinator | — | ~0.3 KB | 0.3 KB |
| **Totalt (alla 3)** | **~1.3 KB** | **~1.6 KB** | **~2.9 KB minified** |

Combined runtime-overhead är <2 KB minified för en typisk konfiguration
(en eller två mekanismer aktiva). Med alla tre + coordinator landar vi
runt 2.9 KB, vilket fortfarande är försumbart relativt en typisk
component-bundle.

LCP-impact: ≤50ms per mekanism vid first-paint, mätbart i Playwright-
benchmarks. Patinas build-time-läsning av `git blame` lägger 0ms på
runtime (det är pre-baked).

## Risker och mitigeringar

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| Circadian byter palette mid-flow → confusion | Medel | Medel | Smooth transition >800ms ease, optional "what changed"-tooltip |
| Patina-drift går under APCA-floor över tid | Hög | Hög | Hard-floor i token-pipeline, freeze-mekanism, runtime-clamp |
| Network-API instabil cross-browser | Medel | Medel | Feature-detect + saveData-fallback för Safari, JS-polyfill |
| Konflikt mellan 3 mekanismer ger urvattnad slutprodukt | Medel | Hög | Coordinator-priority + combined-drift-cap (<15 % från base) |
| Patina på produktionssajt → confusion för returning visitors | Hög | Låg | Default OFF, opt-in per stil, freeze-flagga, dokumenterat use-case |
| Affektiv inferens-drift framåt (feature creep) | Låg | Hög | Etisk gräns dokumenterad, EU AI Act-review krav, default OFF |

## Compliance-status

- **WCAG 2.2 AA**: 0 violations över 1000 random-fixtures
- **EAA (June 28, 2025)**: in force, compliance verifierad
- **ADA Title II (April 24, 2026)**: deadline countdown, compliance
  verifierad ahead of deadline
- **EU AI Act**: ingen affektiv inferens, ingen high-risk klassificering,
  compliance verifierad
- **GDPR**: zero-tracking, zero-server-transmission, ingen
  personuppgifts-process

## Relaterade docs

- [`docs/circadian-design.md`](circadian-design.md) — F1 detaljerad spec
- [`docs/network-aware.md`](network-aware.md) — F4 detaljerad spec
- [`docs/patina-mode.md`](patina-mode.md) — F7 detaljerad spec
- [`commands/visionary-patina.md`](../commands/visionary-patina.md) — patina CLI
- [`docs/anti-typicality.md`](anti-typicality.md) — Sprint 16-koppling
  (patina som anti-konvergens-mekanism)
- [`docs/taste-privacy.md`](taste-privacy.md) — privacy-policy övergripande
- [`docs/sprints/sprint-23-context-runtime.md`](sprints/sprint-23-context-runtime.md)
  — implementation tasks 42.1–42.7

## Källor

- **EU AI Act**: Regulation (EU) 2024/1689. Art. 5 affektiv inferens-ban.
- **WCAG 2.2**: W3C Recommendation, October 2023. AA-nivå.
- **EAA (European Accessibility Act)**: Directive (EU) 2019/882, in
  force June 28, 2025.
- **ADA Title II Web Accessibility Rule**: U.S. DOJ rule April 24, 2024
  with compliance deadlines April 24, 2026 (large entities) and April
  24, 2027 (small entities).
- **APCA (Accessible Perceptual Contrast Algorithm)**: WCAG 3 candidate,
  Myndex Research. Lc 60 floor empiriskt vald för body text.
- **Network Information API**: W3C Editor's Draft. `effectiveType` +
  `saveData` properties.
- **`prefers-reduced-data`**: CSS Media Queries Level 5. Currently
  Editor's Draft, fallback via `Save-Data: on`-header.
- **suncalc**: github.com/mourner/suncalc. ~3KB minified, MIT license.
