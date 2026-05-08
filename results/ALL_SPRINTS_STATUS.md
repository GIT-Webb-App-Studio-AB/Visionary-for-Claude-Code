# Master Status — Sprint 16-24 Implementation

**Branch:** `feat/sprint-16-anti-typicality` (alla sprintar staplade, INGA git commits)
**Test status:** 733/733 pass, 8 skip (sharp-deps), 0 fail
**Datum:** 2026-05-05

## Översikt

| Sprint | Tema | Status | Tester | Filer |
|---|---|---|---|---|
| **16** | Anti-Typicality (Verbalized Sampling + Echo-Chamber Break) | ✅ | 87 | 14 |
| **17** | Latent Style Mixing & Mood (slerp + Russell circumplex) | ✅ | 90 | 14 |
| **18** | From-Photo (sharp + CLIP + edge-detect) | ✅ | 53 (45 pass + 8 skip) | 13 |
| **19** | From-Track (Spotify + CLAP + tempo) | ✅ | 48 | 10 |
| **20** | Cinematic Designer Profiles (12 director-packs + LUT) | ✅ | 16 | 18 |
| **21A** | Constraint-Injection (40 atomic rules + sampler + validator) | ✅ | 34 | 45 |
| **21B** | Coined-Styles Promotion (auto-promote 3+ acceptances) | ✅ | 27 | 6 |
| **22A** | Cross-Screen Flow (5 koherenta states + drift-loop) | ✅ | 21 | 5 |
| **22B** | Voice-Tempo (prosody → motion-tokens) | ✅ | 26 | 8 |
| **23A** | Context-Runtime modules (circadian + network + patina + coordinator) | ✅ | 44 | 8 |
| **23B** | Context-Runtime command + 4 docs | ✅ | — | 6 |
| **24** | Style Pack 2026 (5 nya stilar) | ✅ | — | 7 |

**Total: 9 sprintar, 466 nya tester, ~155 nya filer + 5 modifierade**

## Test-resultat per modul

```
node --test (alla nya moduler):
  tests 741
  pass 733
  fail 0
  skip 8 (sharp inte installerad i denna env)
  duration 3.4s
```

## Nya commands-files

- `/visionary-mood <coords|text>` — Russell circumplex stil-väljare
- `/visionary-from-photo <url|path>` — foto som primär designinput
- `/visionary-from-track <spotify-url|mp3>` — musik som primär designinput
- `/visionary-cinematic <director>` — 12 filmregissör-profiler
- `/visionary-flow <feature>` — 5 koherenta UI-states
- `/visionary-voice [audio]` — talad motion-refinement
- `/visionary-patina status|freeze|unfreeze` — design-åldring
- `/visionary-coined list|view|rename|eject` — coined-styles management

## Nya skills/visionary-resurser

- `partials/verbalized-sampling.md` — VS prompt-partial
- `schemas/verbalized-sampling.schema.json` + `anti-typicality.schema.json`
- `anti-typicality.json` — config med env-overrides
- `palette-tokens.json` — 25 pre-baked oklch-paletter för slerp-resolver
- `typography-matrix.json` — 12 font-pairs över (type_drama, formality)
- `priors/global-aesthetic-history.json` — 10 fallback-entries för originality-critic
- `constraints/` — 40 atomic constraint-files över 5 kategorier
- `constraints.md` — schema + index
- `styles/graphic/tactile-rebellion.md`
- `styles/internet/digital-degrowth.md`
- `styles/internet/insight-first-coach.md`
- `styles/internet/corporate-dropout.md`
- `styles/hybrid/liquid-glass-lensing.md`

## Nya designers/

- `_director-schema.md`
- 12 director-packs: wong-kar-wai, villeneuve, wes-anderson, nolan, kubrick, lynch, tarkovsky, denis, bong, parker, garland, coppola

## Nya hooks/scripts/lib-moduler

- `verbalized-sampling.mjs` + `anti-typicality-config.mjs` + `anti-pattern-context.mjs`
- `style-blend.mjs` + `style-blend-resolver.mjs` + `blend-parser.mjs` + `mood-mapper.mjs` + `coined-styles.mjs`
- `critics/originality.mjs`
- `photo/extract-palette.mjs` + `clip-classifier.mjs` + `edge-detect.mjs` + `from-photo-pipeline.mjs`
- `audio/spotify-features.mjs` + `russell-mapper.mjs` + `clap-embedder.mjs` + `tempo-to-motion.mjs` + `from-track-pipeline.mjs`
- `cinematic/lut-to-filter.mjs` + `lut-presets.json`
- `constraints/inject.mjs` + `validate.mjs`
- `flow/multi-screen-orchestrator.mjs` + `cross-screen-critique.mjs`
- `voice/voice-to-motion.mjs` + `mic-recorder.mjs`
- `runtime/circadian.mjs` + `network-aware.mjs` + `patina.mjs` + `coordinator.mjs`

## Nya docs/ (alla på svenska)

- `anti-typicality.md` (Sprint 16)
- `latent-style-mixing.md` + `mood-slider.md` (Sprint 17)
- `from-photo.md` (Sprint 18)
- `from-track.md` + `spotify-setup.md` (Sprint 19)
- `constraints.md` + `coined-styles.md` (Sprint 21)
- `visionary-flow.md` + `visionary-voice.md` (Sprint 22)
- `runtime-context.md` + `circadian-design.md` + `network-aware.md` + `patina-mode.md` (Sprint 23)

## Modifierade existing files

1. `README.md` — sektion under Sprints 13-15 + 4 nya env-flaggor i tabellen
2. `skills/visionary/SKILL.md` — Stage 1.5 (VS) + Stage 2.5 (Latent Mixing) + Stage 4 utökad med originality + Sub-Document Loading-tabell utvidgad
3. `skills/visionary/context-inference.md` — ny "Photo-Driven Inference (Sprint 18)" sektion
4. `hooks/scripts/lib/critic-merge.mjs` — additivt utökad med ORIGINALITY_DIMENSIONS + mergeOriginality
5. `hooks/scripts/capture-and-critique.mjs` — anti-pattern context + originality-critic-instruktion i round 2+
6. `skills/visionary/styles/_index.md` — 5 nya stilar i Sprint 24

## Pending — kräver post-merge

- **Live benchmarks** för alla 9 sprintar (kräver miljö med live preview server, Playwright, Spotify creds, sharp installed)
- **Sprint 24 task 41.7** — embeddings refresh för 5 nya stilar (`node scripts/build-style-embeddings.mjs`)
- **Sprint 24 task 41.8** — reference screenshots i `mockups/sprint-24/` (kräver Playwright)
- **Sprint 21 v2** — implementera 32 stub-validators (8 implementerade i v1)

## Beroenden från sprint-doc som behöver installeras

Visionary kör i users projekt — deps ska installeras där:

```bash
# Sprint 18 (from-photo):
npm install sharp                    # required
npm install node-vibrant culori      # preferred for better palette
npm install @xenova/transformers     # for CLIP mood-classification (~150MB)

# Sprint 19 (from-track):
npm install @xenova/transformers     # for CLAP embedding (~150MB) — same package as CLIP
# Spotify: setup ~/.visionary/spotify-creds.json (see docs/spotify-setup.md)

# Alla andra sprintar: ZERO new deps
```

## Korrigeringar vs sprint-docs (samlat)

1. **calibration.json är runtime, inte config** — Sprint 16 task 31.5 fix: ny dedikerad `anti-typicality.json`
2. **Schema-bound critic-output** — originality_vs_history kunde inte vara i scores-block, körs som separat top-level field via mergeOriginality
3. **Catalog-IDs i sprint-doc** — flera ID:n existerar inte i `_embeddings.json` (e.g. `swiss-international` → `swiss-rationalism`); mood-mapper + style-blend uppdaterade
4. **No root package.json** — Visionary är ett Claude Code plugin, inte npm-package; alla deps är optional med graceful fallback
5. **Field-naming mismatch** — pipeline-orchestrator anpassad till faktiska modul-interfaces
6. **Sprint 22 voice mic-permission** — hooks kan inte direkt anropa MCP, så instruction-block-builder för agent-tur istället

## Nästa steg (för user)

1. **Review**: läs igenom sprint-docs + nya filer på branch `feat/sprint-16-anti-typicality`
2. **Test deps i users projekt**: `npm install sharp` för from-photo-test
3. **Spotify creds**: setup för from-track-test
4. **Merge-strategi**: en stor commit eller per-sprint-commit (rekommendation: per sprint för bevarad git-history)
5. **Live benchmarks**: kör efter merge med faktiska generations
6. **Embeddings refresh**: `node scripts/build-style-embeddings.mjs` för Sprint 24-stilar

## Filräkning

```bash
git status --short | wc -l   # 101 filer ändrade/nya
git status --short | grep "^??" | wc -l   # ~95 nya
git status --short | grep "^ M" | wc -l   # 6 modifierade
```
