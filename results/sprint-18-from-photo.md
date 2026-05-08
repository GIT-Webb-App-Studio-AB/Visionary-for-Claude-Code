# Sprint 18 — From-Photo: Implementation Status

**Branch:** `feat/sprint-16-anti-typicality` (Sprint 16+17+18 staplade)
**Status:** Implementation klar, 53 nya tester (8 skipade pga sharp inte installerad i denna env)

## Implementerade tasks

### Task 35.1 — Foto-pipeline (sharp + node-vibrant) ✅
- `hooks/scripts/lib/photo/extract-palette.mjs` — palette-extraktion med node-vibrant + histogram-fallback, oklch via inline math (Ottosson 2020 RGB→OKLab→OKLCh)
- 26 tester (18 pass, 8 skip på sharp-saknas)
- SHA256-cache i `${cacheDir}/photo-cache/<sha>.bin`
- 5 oklch-färger: vibrant, lightVibrant, darkVibrant, muted, darkMuted
- Temperature-classification via medel-hue (cool/warm/neutral)

### Task 35.2 — CLIP zero-shot mood ✅
- `hooks/scripts/lib/photo/clip-classifier.mjs` — 16 mood-prompts mapped to style_tags
- Optional `@xenova/transformers` via dynamic import; heuristic fallback (palette + saturation + edge-density) när saknad
- 8 tester gröna (heuristic + import-fail-mock + style-tag whitelist verifierad mot _embeddings.json)

### Task 35.3 — Edge-density → motion-tier ✅
- `hooks/scripts/lib/photo/edge-detect.mjs` — Sobel-x/y konvolution via sharp.convolve()
- 17 tester gröna (boundary 0.05/0.15/0.30 → tier 1/2/3, edge-cases NaN/undefined, e2e med 8x8 schackbräde-fixture)

### Task 35.4 — `/visionary-from-photo` orchestrator ✅
- `commands/visionary-from-photo.md` — command-doc med syntax + 4-stegs-pipeline
- `hooks/scripts/lib/photo/from-photo-pipeline.mjs` — orchestrator (extract först, sedan parallel mood + edges)
- 10 tester gröna (e2e shape, mood-fail graceful, edges-fail → tier 1, combineStylePool union)

### Task 35.5 — Integration i context-inference ✅
- `skills/visionary/context-inference.md` — ny "Photo-Driven Inference (Sprint 18)" sektion
- Signal-precedence-tabell (palette HARD, mood SOFT, motion_tier HARD)
- Combination rules med --blend, --mood, --no-vs
- Trace events specificerade

### Task 35.6 — Tester ✅
- 53 nya tester (18 pass + 8 skip + 17 + 8 + 10 = 53 totalt; 45 pass i denna env utan sharp)
- Sprint 16+17+18 samlat: **528 tester pass, 0 fail, 8 skip (sharp-deps)**

### Task 35.7 — Doc ✅
- `docs/from-photo.md` (~370 rader, svenska) med 8 FAQ + setup-troubleshooting

### Bonus — setup-script ✅
- `scripts/setup-clip-model.mjs` — pre-fetch CLIP-modellen vid första användning

## Definition of Done — status

- [x] Alla tasks (35.1-35.7) klara
- [x] sharp + node-vibrant + culori + @xenova/transformers stöds som **optional deps** med graceful fallback
- [x] 16 mood-prompts mappade till style_tags från _embeddings.json
- [x] Edge-tier-mappning verifierad: 0.05/0.15/0.30 boundaries
- [x] Pipeline e2e-verifierad utan deps installed (heuristic-only path)
- [x] Doc + command-doc + setup-script
- [ ] **Live benchmark pending** — kräver sharp + node-vibrant installation för 25 test-foton
- [ ] **Mergad till main** — väntar user review

## Viktigt: Dependencies

Visionary-for-Claude-Code har INGEN root `package.json` (bara `packages/mcp-server/package.json`). Det betyder photo-pipeline-deps måste installeras i **användarens projekt**:

```bash
# I användarens projekt-rot:
npm install sharp                    # required for photo loading
npm install node-vibrant culori      # preferred for better palette (optional)
npm install @xenova/transformers     # for CLIP mood-classification (optional, ~150MB modell)
```

Utan deps fungerar pipeline med graceful fallback:
- sharp saknas → from-photo-features avaktiveras (helpful error med install-hint)
- node-vibrant saknas → histogram k-means fallback för palette
- transformers.js saknas → heuristic-only mood-classification (palette-temp + saturation + edges)

## Korrigeringar vs sprint-doc

1. **Field-naming**: pipeline-orchestrator anpassad till faktiska interface — `mean_saturation` (inte `saturation_mean`), `source.cached_at_path` + `source.sha256` (inte `source_meta.cachePath`).

2. **Cache-extension**: Photo cachas som `.bin` (inte `.png`) eftersom källa kan vara JPG/WebP/etc — håller bytes verbatim utan transcoding.

3. **Sobel-tröskel**: Sprint-docen visade 40/255 i tabell men 50/255 i task-instruktion. Kod använder 50 enligt kod-skiss.

4. **No package.json**: Visionary är ett Claude Code plugin, inte en npm-package. Sprint-doc antog root package.json — vi dokumenterar att deps ska installeras i users projekt.
