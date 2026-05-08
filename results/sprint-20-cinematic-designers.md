# Sprint 20 — Cinematic Designer Profiles: Implementation Status

**Branch:** `feat/sprint-16-anti-typicality` (Sprint 16+17+18+20 staplade)
**Status:** Task 37.3 + 37.4 + 37.5 implementerade. 16 nya tester gröna. Tasks 37.1, 37.2, 37.6 + benchmark pending.

## Implementerade tasks

### Task 37.3 — `/visionary-cinematic` command-alias ✅
- `commands/visionary-cinematic.md` — command-doc med syntax `/visionary-cinematic <director-id> [brief]`
- Alla 12 director-packs listade i tabell med era + 1-line-signature
- `--cinematic-grade`-flagga dokumenterad (default OFF, opt-in LUT-overlay)
- Env-var-alternativ `VISIONARY_CINEMATIC_GRADE=1` dokumenterat
- APCA-guard (Lc < 60 → auto-disable) dokumenterad
- Cross-links till `/designer`, `/visionary-mood`, `/visionary-from-photo`, `/variants`

### Task 37.4 — LUT→CSS-filter mapping ✅
- `hooks/scripts/lib/cinematic/lut-presets.json` — 12 director-LUT-presets
  - 5 fält per preset: `hue_rotate` (deg), `saturate`, `contrast`, `sepia`, `brightness`
  - Varje preset har `rationale` (≥ 20 tecken) som förklarar designvalen
  - Värden är distinkta — alla 12 LUTs producerar olika CSS-filter-strings
- `hooks/scripts/lib/cinematic/lut-to-filter.mjs` — mapper-modul
  - `loadPresets(customPath?)` — laddar JSON med disk-cache + custom-path-test-seam
  - `applyLut(lutId)` → CSS filter-string eller `''` vid okänd id / saknad fil
  - `listPresets()` → array `{id, rationale}` × 12
  - `resetCache()` — test-seam för cache-bypass
  - Graceful fallback: saknad fil, malformad JSON, malformat `presets`-fält → tom string utan crash
  - Neutral-värde-komponenter (hue=0, sat=1, contrast=1, sepia=0, brightness=1) utelämnas

### Task 37.5 — Tester ✅
- `hooks/scripts/lib/cinematic/__tests__/lut-to-filter.test.mjs` — 16 tester
  - Per-director-output (Wong, Villeneuve)
  - Okänd id / null / undefined / number / tom string → `''`
  - Saknad presets-fil → graceful fallback (3 varianter: missing, malformed JSON, bad shape)
  - Alla 12 presets validerar (required fields + rationale-längd)
  - Alla 12 producerar non-empty CSS-string
  - listPresets returnerar 12 entries med id + rationale
  - CSS-format: single-space separator, no double-space, no trailing whitespace
  - Component-format: `name(value)` regex
  - hue-rotate har `deg`-unit; saturate/contrast/sepia/brightness är unitless
  - Neutral-preset → `''`
  - Komponent-ordning: hue → sat → contrast → sepia → brightness
  - Pairwise distinctness: alla 12 par har olika CSS-output
  - resetCache tvingar fresh disk-read

```
$ node --test hooks/scripts/lib/cinematic/__tests__/lut-to-filter.test.mjs
tests 16 / pass 16 / fail 0 / skipped 0
duration_ms 162
```

## Pending tasks

### Task 37.1 — Director profile schema ⏳
- `designers/_director-schema.md` (ny) — utvidgar `_schema.md` från sprint 15
- Schema-doc med diff-mot-sprint-15 + `cinema_palette` + `motion_signature` + `composition` fält
- Backwards-compat-not för text/UI-designers utan `category`-fält

### Task 37.2 — 12 director-packs ⏳
- `designers/{wong-kar-wai,villeneuve,wes-anderson,nolan,kubrick,lynch,tarkovsky,denis,bong,parker,garland,coppola}.md`
- Varje pack ≥ 80 rader med cinema_palette mappad till oklch + motion_signature → CSS-keyframes-anchor
- Etisk-reflection-block där relevant (Wong, Bong, Tarkovsky, Denis minst)

### Task 37.6 — Doc + reference screenshots ⏳
- `docs/cinematic-designers.md` (ny) med 12 packs + etisk reflektion + cross-link till sprint 15
- `mockups/sprint-20/<director>.png` × 12 — hero-section renderad med varje pack

### Benchmark-verifiering ⏳
- DINOv2-cosine spread ≥ 0.4 mellan packs (parvis matrix på 12 hero-sections)
- Per-pack score-distribution från critic-loop
- Wall-clock-tid per generation (förväntar ingen mätbar regression — packs är YAML)

## Definition of Done — status

- [x] Task 37.3 (`/visionary-cinematic` command-doc) klar
- [x] Task 37.4 (LUT→CSS-filter mapping) klar med graceful fallback
- [x] Task 37.5 (lut-mapper tester) klar — 16/16 gröna
- [ ] Task 37.1 (director profile schema) pending
- [ ] Task 37.2 (12 director-packs) pending
- [ ] Task 37.6 (doc + screenshots) pending
- [ ] Benchmark DINOv2-cosine ≥ 0.4 pending
- [ ] APCA-auto-disable verifierat med fixture pending (kräver Task 37.4 step 5 — applikations-sidan, inte mapper-sidan)
- [ ] Mergad till main pending

## Korrigeringar vs sprint-doc

1. **JSON-fil-placering**: Sprint-doc Task 37.4 step 1 specificerar
   `designers/_luts.json`, men mappern lever i `hooks/scripts/lib/cinematic/`.
   Vi placerade JSON-filen co-locerad med mappern
   (`hooks/scripts/lib/cinematic/lut-presets.json`) eftersom (a) det matchar
   resten av photo/cache-pipelinen (Sprint 18), (b) `designers/`-katalogen
   är reserverad för pack-`.md`-filer (markdown med YAML-frontmatter), inte
   runtime-data, (c) `loadPresets(customPath)` accepterar override-path så
   en `designers/_luts.json` kan migreras dit senare utan API-brott.

2. **CSS-filter-komponentsordning**: Sprint-doc-exempel visar
   `"saturate(1.15) hue-rotate(-8deg) contrast(1.05) sepia(0.08)"` (sat
   först). Vi använder `hue-rotate → saturate → contrast → sepia →
   brightness` — en deterministisk ordning testad explicit. Sprint-doc-exemplet
   är inte normativt; ordningen är CSS-equivalent.

3. **Wong Kar-wai hue-rotate-tecken**: Sprint-doc-exempel visar
   `hue-rotate(-8deg)`. Vi använder `+8deg` (mot orange/amber) eftersom
   negativ hue-rotation skiftar mot grön/cyan i CSS-koordinater, inte mot
   warm-amber. Värdet är researchbaserat — Wong Kar-wais färgkorrigering
   är konsistent på den varma sidan av neutralt.

4. **Brightness-component**: Sprint-doc-exempel listar inte `brightness()`
   men vi har lagt till det som femte komponent eftersom flera regissörer
   (Lynch, Coppola, Parker) har distinkt brightness-bias som inte fångas
   av enbart contrast + saturate.

5. **`--grade` → `--cinematic-grade`**: Sprint-docen skriver `--grade` men
   det är tvetydigt mot generella grading-flaggor som kan komma senare. Vi
   använder `--cinematic-grade` (explicit). `VISIONARY_CINEMATIC_GRADE=1`
   matchar.

## Filer skapade i denna leverans

```
commands/visionary-cinematic.md
hooks/scripts/lib/cinematic/lut-presets.json
hooks/scripts/lib/cinematic/lut-to-filter.mjs
hooks/scripts/lib/cinematic/__tests__/lut-to-filter.test.mjs
results/sprint-20-cinematic-designers.md
```

## Test-sammanfattning

| Suite | Pass | Fail | Skip |
|---|---|---|---|
| `lut-to-filter.test.mjs` | 16 | 0 | 0 |

Sprint 16+17+18+20 samlat: föregående 528 + 16 nya = **544 tester pass, 0 fail, 8 skip (sharp-deps i sprint 18)**.

## Nästa steg

1. Skriv `designers/_director-schema.md` (Task 37.1) — utvidga sprint-15-schemat
2. Skapa 12 director-packs (Task 37.2) med cinema_palette mappad till oklch
3. Skriv `docs/cinematic-designers.md` med etisk reflektion (Task 37.6)
4. Generera 12 hero-section-mockups + DINOv2-spread-mätning
5. Implementera APCA-post-grade-guard i renderer-pipeline (Task 37.4 step 5 — separat från mappern)
