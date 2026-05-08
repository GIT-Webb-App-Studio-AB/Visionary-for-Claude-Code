# Sprint 18 — From-Photo: foto som primär designinput

**Vecka:** 31
**Fas:** 11 — Cross-modal inputs (NY fas)
**Items:** 35 från roadmap (ny)
**Mål:** Användaren kan ge Visionary ett foto (URL eller fil) och få ett UI som ärver fotots palett, mood och visuell densitet. CLIP klassificerar mood, sharp + node-vibrant extraherar palette, edge-density mappar till motion-tier. Detta är en signaturfeature — varken v0, Lovable eller Stitch har den. Foto-input blir en första-klass-källa för `StyleBrief` jämte taste-profile, content-kit och prompt.

Wild idea från forskningen: visa Visionary ett foto av Saharas dyner, en betongbrutalist-byggnad eller en Jenny Holzer-installation. Få tillbaka ett UI med just den paletten, just det visuella tempot, just den texturen — och stilen i katalogen som bäst speglar fotot väljs som baseline. Foto blir ett "designspråk-frö" i stället för en moodboard-bild som användaren själv måste tolka.

## Scope

- Item 35 — From-Photo: foto-pipeline, CLIP-mood-klassificering, edge-density → motion-tier, `/visionary-from-photo` command, integration i context-inference, tester och dokumentation.

## Pre-flight checklist

- [ ] Node ≥ 18 (krävs av `@xenova/transformers`)
- [ ] `sharp`, `node-vibrant`, `culori`, `@xenova/transformers` tillagda i `package.json`
- [ ] `${CLAUDE_PLUGIN_DATA}` honoureras (Sprint 15.4-konvention) — foto-cache lagras under `${CLAUDE_PLUGIN_DATA}/photo-cache/`
- [ ] Sprint 11 (visual-embeddings) mergad — vi reuse:ar `_embeddings.json` för stil-mappning
- [ ] Feature-branch: `feat/sprint-18-from-photo`

---

## Task 35.1 — Foto-pipeline (sharp + node-vibrant) [M]

**Fil:** `hooks/scripts/lib/photo/extract-palette.mjs` (ny)

**Vad:** Givet foto-URL eller absolut path: ladda ner via `fetch`, normalisera via `sharp`, extrahera 5-färgs-palette via `node-vibrant` (Vibrant, LightVibrant, DarkVibrant, Muted, DarkMuted). Output: oklch-konverterad palette + dominant temperatur (warm/cool/neutral) + medel-saturation.

**Steg:**
1. Cache foto i `${CLAUDE_PLUGIN_DATA}/photo-cache/<sha256>.png` (sha256 av URL/path-input). Cachen är permanent — fotot är input, inte mellanlager.
2. `sharp(input).resize({ width: 800, fit: 'inside' }).toBuffer()` för perf — Vibrant-extraction är O(n) i pixlar, 800px är tillräckligt för palette-fidelity.
3. `Vibrant.from(buffer).getPalette()` → 5 swatches.
4. Konvertera varje swatch till oklch via `culori.converter('oklch')(swatch.hex)`. Spara som `{ l, c, h, hex_fallback }`.
5. Dominant-temperatur: medel-hue av Vibrant + LightVibrant + DarkVibrant. Hue 180–270 = `cool`; 0–60 OR 300–360 = `warm`; annars `neutral`.

**Output-form:**
```typescript
interface PhotoPalette {
  source: { kind: "url" | "path"; sha256: string; cached_at_path: string };
  palette: { vibrant: OkLch; light_vibrant: OkLch; dark_vibrant: OkLch; muted: OkLch; dark_muted: OkLch };
  temperature: "warm" | "cool" | "neutral";
  mean_saturation: number; // 0..1, från oklch.c-medel
}
```

**AC:**
- Test 10 stock-fotos: palette-extraction tar < 2 s per bild på utvecklingsmaskin
- Output har 5 valida oklch-färger (ingen `null`/`NaN`)
- Mood-temperatur matchar mänsklig bedömning på ≥ 8/10 fotos
- SHA256-cache: andra körningen på samma URL hoppar över nätverket

---

## Task 35.2 — CLIP-klassificering av mood [L]

**Fil:** `hooks/scripts/lib/photo/clip-classifier.mjs` (ny) + `scripts/download-clip-model.mjs` (setup)

**Vad:** Lokal CLIP ViT-B/32 via `@xenova/transformers` (transformers.js, ingen API-anrop, ~150 MB cache). Klassificera foto mot 16 mood-prompts ("calm minimal", "vibrant maximalist", "industrial brutalist", etc.) via zero-shot CLIP. Top-3 mood-labels returneras med softmax-konfidens.

**Steg:**
1. Setup-script `scripts/download-clip-model.mjs` lazy-laddar CLIP-modellen vid första körning. Cachar i `~/.visionary/models/Xenova/clip-vit-base-patch32/`. Visar progress-bar (`@xenova/transformers` exponerar progress callback).
2. Mood-vocabulary i `lib/photo/mood-prompts.json` — 16 prompts kopplade till stil-tags:

```json
[
  { "id": "calm_minimal",        "prompt": "a calm minimal interior, lots of whitespace",     "style_tags": ["zen-void", "japanese-minimalism", "scandinavian-nordic"] },
  { "id": "industrial_brutalist","prompt": "raw concrete brutalist building",                 "style_tags": ["architectural-brutalism", "concrete-brutalist-material", "neubrutalism"] },
  { "id": "vibrant_maximalist",  "prompt": "vibrant maximalist colorful poster",              "style_tags": ["memphis", "post-internet-maximalism", "south-asian-bollywood"] },
  { "id": "editorial_print",     "prompt": "editorial magazine spread with serif typography", "style_tags": ["newspaper-broadsheet", "editorial-serif-revival", "swiss-rationalism"] }
  // ... totalt 16 entries
]
```

3. Inferens: bild → image-embedding; alla prompts → text-embeddings (cachas en gång); cosine vs prompt-embeddings → softmax. Returnera top-3 `{ id, score, style_tags }`.
4. Felhantering: om model-load fail (offline / disk fullt), fallback till ren palette + edge-heuristik. Logga `clip_unavailable` trace-event men låt pipelinen fortsätta.

**AC:**
- Test 20 fotos visar logiskt rätt mood-klassificering på ≥ 16/20 (manuell review)
- Modell cachad efter första körning — andra körningen kallar inte ut till HuggingFace
- Inferens-tid < 3 s på CPU (M-serie / Ryzen 5 baseline); < 1 s på GPU
- Fallback-sökväg testad: model-load-fail → palette+edge-only resultat utan exception

---

## Task 35.3 — Edge-density → motion-tier-mappning [S]

**Fil:** `hooks/scripts/lib/photo/edge-detect.mjs` (ny)

**Vad:** Sharp Sobel-edge-detection → procent pixlar med high gradient. Edge-density är en proxy för "visuell hetta" som korrelerar med rätt motion-tier för ett UI som ärver bildens energi.

**Mappning:**

| Edge-density | Motion-tier | Rationale |
|---|---|---|
| < 5 % | 0 (Static) | Tomt foto (öken, monokrom yta) → still UI |
| 5–15 % | 1 (Subtle) | Lugn komposition → micro-interactions only |
| 15–30 % | 2 (Expressive) | Texturrik scen → spring-baserade entries |
| > 30 % | 3 (Kinetic) | Visuellt brus / dense pattern → kinetic layer ok |

**Steg:**
1. `sharp(input).greyscale().convolve({ width: 3, height: 3, kernel: [-1,0,1,-2,0,2,-1,0,1] })` (Sobel-x).
2. Samma med Sobel-y kernel `[-1,-2,-1,0,0,0,1,2,1]`.
3. Magnitude-sum: `sqrt(sx² + sy²)` per pixel; tröskel = 40/255; räkna pixlar över tröskel; dela med total-pixlar.
4. Bucket till motion-tier per tabellen ovan.

**AC:**
- 30 fotos kategoriserade
- Korrelation mot mänsklig motion-bedömning ≥ 0.7 (Spearman, informellt)
- Edge-detect-modulen är pure (in: Buffer, ut: number) — testbar utan filsystem

---

## Task 35.4 — `/visionary-from-photo` command [M]

**Fil:** `commands/visionary-from-photo.md` (ny) + `hooks/scripts/lib/photo/from-photo-pipeline.mjs` (ny)

**Vad:** Wrapper-pipeline som accepterar URL/path → kör `extract-palette` + `clip-classifier` + `edge-detect` parallellt → bygger `PhotoInferenceResult` → injicerar i `context-inference.md` som biased style-pool + palette-override.

**Command-syntax:**
```
/visionary-from-photo <url-or-path> [optional brief]
```

Exempel:
```
/visionary-from-photo https://example.com/desert.jpg
/visionary-from-photo ./moodboards/brutalist.png "landing page för betongkollektiv"
/visionary-from-photo C:\Users\me\Pictures\holzer.jpg
```

**Pipeline-output:**
```typescript
interface PhotoInferenceResult {
  source: PhotoPalette["source"];
  palette: PhotoPalette["palette"];
  temperature: PhotoPalette["temperature"];
  mood_top3: { id: string; score: number; style_tags: string[] }[];
  motion_tier: 0 | 1 | 2 | 3;
  inferred_density: "sparse" | "balanced" | "dense"; // härled från edge-density + Vibrant-distribution
  candidate_styles: string[]; // top-8 stil-IDn från katalog (union av mood_top3.style_tags, dedupliceras)
  duration_ms: number;
}
```

**Steg:**
1. Command-doc beskriver syntax + exempel + cache-beteende + `--motion-override`-flagga (Task 35.6 risk-mitigering).
2. Pipeline kör 3 sub-tasks parallellt via `Promise.all([extract, classify, edges])`.
3. `candidate_styles` byggs som union av `style_tags` från top-3 mood-prompts. Dessa fungerar som "soft anchors" till efterföljande Stage 1-inferens.
4. Receipt visar `source: "photo-inferred"` i Design Reasoning Brief, plus förhandsvisning av paletten.

**AC:**
- 10 test-fotos producerar visuellt-spårbara UIer (palette syns klart i output via DOM-color-pickning)
- Pipeline tar < 8 s totalt (parallell körning, första-gångs CLIP-load exkluderad)
- Receipt visar palette + mood_top3 + motion_tier för transparens

---

## Task 35.5 — Integration i context-inference [S]

**Fil:** `skills/visionary/context-inference.md`

**Vad:** Lägg till nytt avsnitt "Photo-driven inference" före Steg 1. När `PhotoInferenceResult` är aktiv:

- **Palette är HÅRD signal** — ingen palette-randomization i Step 4. Den valda stilens palette-tags måste vara kompatibel med fotots oklch-spektrum, annars regenereras paletten via Vibrant-output + stil-strukturella regler (proportions, dark-on-light osv).
- **Mood är MJUK signal** — `candidate_styles` får +20 boost i Step 4-scoring. Andra stilar får -5 om de inte är blocked-defaults. Detta är *styrning*, inte *tvång* — användaren ska kunna säga "ignorera fotot, ge mig swiss-rationalism" och få det.
- **Motion-tier är HÅRD signal** — overrider stil-default. `--motion-override <0|1|2|3>` på command-line vinner över foto-inferens.
- **Density är MJUK signal** — `inferred_density` används som tie-breaker mellan stilar med olika density-defaults.

**Bias-precedence (när foto + taste + content-kit alla är aktiva):**

1. **Permanent taste-facts (avoid)** — hard-block (oförändrat).
2. **Photo motion-tier override** — overrider stil-default.
3. **Photo palette** — overrider stil-default-palette när stilen inte declarerar palette-tags som förbjuder fotots temperature.
4. **Active taste-facts** — viktade adjustments (oförändrat).
5. **Photo mood** — `+20` boost till `candidate_styles`.
6. **Stil-default** — base score.

**AC:**
- Doc har sektion på minst 40 rader med tabell + precedence-lista
- Inferensregler är explicita
- Worked example uppdaterad med ett "från foto"-flöde

---

## Task 35.6 — Tester [M]

**Fil:** `hooks/scripts/lib/photo/__tests__/*.test.mjs`

**Coverage:**
- `extract-palette.test.mjs` — 3 fixtures (warm/cool/neutral), verifiera oklch-konvertering, verifiera SHA256-cache-hit på andra körningen
- `clip-classifier.test.mjs` — mocka `@xenova/transformers` Pipeline för CI-snabbhet; verifiera vocabulary-load, top-3-output, fallback-path när model-load kastar
- `edge-detect.test.mjs` — fixed-seed-Buffer in, deterministisk procent ut; verifiera bucket-gränser (4.99 % → 0, 5.01 % → 1, etc.)
- `from-photo-pipeline.test.mjs` — full pipeline e2e med fixture-foto; verifiera parallell-körning via `performance.now`-bracket

**AC:**
- `node --test` grön
- Coverage ≥ 80 % på `lib/photo/`
- CLIP-test mockar modellen — CI får inte ladda 150 MB
- Fixture-fotos är < 100 KB var (PNG-optimerade) och committade

---

## Task 35.7 — Doc + exempel [S]

**Fil:** `docs/from-photo.md` (ny)

**Innehåll:**
- Hur man använder (command-syntax, URL vs path, hur fotot väljs)
- 3 visuella exempel: foto + resulting UI screenshot bredvid (committa screenshots till `docs/from-photo/`)
- Kvalitetstips:
  - Foto-resolution > 800 px (kortare sida) — vi resize:ar ner men kan inte rädda lågupplöst input
  - Undvik tunga JPEG-kompressionsartefakter — banding förvirrar Vibrant
  - Aspect ratio spelar mindre roll — vi normaliserar internt
- Troubleshooting:
  - "CLIP-modellen laddar långsamt" — ~150 MB första gången, sedan cachat
  - "Paletten matchar inte fotot" — vanligt på låg-kontrast-foton; manuell `--palette-override` (framtida feature, dokumentera ej-tillgänglig)
  - "Motion-tier känns fel" — `--motion-override` finns
- Privacy-not: foto cachas lokalt under `${CLAUDE_PLUGIN_DATA}/photo-cache/`. Inget skickas till externa API:er — CLIP körs lokalt via transformers.js. URL-fotos laddas ner en gång och behandlas som lokala därefter.

**AC:**
- Doc har 3+ visuella exempel
- Privacy-sektion explicit
- Länkad från `README.md` under "Cross-modal inputs"

---

## Benchmark-verifiering

**Fil:** `results/sprint-18-from-photo.md`

**Mätningar:**
- 25 fotos × generation
- Per generation: palette-fidelity (Δoklch mellan extracted palette och dominanta UI-färger via Playwright color-pick), inferens-tid, mood-accuracy (manuell review)
- Dela upp resultatet per foto-typ: `architecture`, `nature`, `art`, `interior`, `abstract` — så vi ser var pipelinen är stark/svag

**AC:**
- Palette-fidelity ≥ 85 % (Δoklch < 0.1 i L och C på minst 3 av 5 swatches per UI)
- Tid < 8 s per generation (CLIP-load exkluderad — den är engångskostnad)
- Mood-accuracy rapporterad per foto-typ; min 14/25 totalt

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| `transformers.js` CLIP-modell laddar långsamt första gången (~150 MB) | Hög | Medel | Lazy-load + cache + tydlig progress-indicator + dokumentera disk-användning i `docs/from-photo.md` |
| `node-vibrant` ger mediokra paletter på låg-kontrast-foton (få distinkta swatches) | Medel | Medel | Fallback till histogram-baserad palette om Vibrant returnerar < 3 valida swatches; varna i receipt |
| Foto-URL kan peka på sensitive content (NSFW, deepfakes etc.) | Låg | Hög | Resize till thumbnail innan analys, ingen lagring av original utöver cache, ingen cloud-upload, dokumentera limitation |
| Edge-detection ger felaktig motion-tier för foton med mycket text (high edge-density utan visuell hetta) | Medel | Låg | Erbjud `--motion-override` flagga; dokumentera limitation |
| CLIP-mood-prompts är språkbaserade (engelska), missar kulturspecifika moods | Hög | Låg | Community-PR-mall för mood-vocabulary-tillägg; v2 kan introducera flerspråkig prompt-set |
| Användare laddar foton från okänd URL → SSRF-vektor | Låg | Medel | Validera URL-schema (endast http/https), respektera `VISIONARY_DISABLE_NETWORK=1` env-flag |

---

## Definition of Done

- [ ] Alla tasks (35.1–35.7) klara
- [ ] `extract-palette.mjs`, `clip-classifier.mjs`, `edge-detect.mjs`, `from-photo-pipeline.mjs` implementerade och testade
- [ ] `/visionary-from-photo` command fungerar end-to-end
- [ ] `context-inference.md` har "Photo-driven inference"-sektion med precedence-tabell
- [ ] Tester gröna, coverage ≥ 80 % på `lib/photo/`
- [ ] `docs/from-photo.md` publicerad med 3 visuella exempel
- [ ] `results/sprint-18-from-photo.md` publicerad med palette-fidelity ≥ 85 % och tid < 8 s
- [ ] Privacy-noten klar — inget foto-data lämnar maskinen
- [ ] Mergad till `main`

## Amendments

_Tomt._
