# Sprint 16 — Anti-Typicality Foundation: Implementation Status

**Branch:** `feat/sprint-16-anti-typicality`
**Status:** Implementation klar, benchmark pending live-runs

## Implementerade tasks

### Task 31.1 — Verbalized Sampling partial ✅
- `skills/visionary/partials/verbalized-sampling.md` — prompt-partial med strikt JSON-format-spec
- `skills/visionary/schemas/verbalized-sampling.schema.json` — draft 2020-12 schema
- `hooks/scripts/lib/verbalized-sampling.mjs` — validateVsOutput, detectConvergence, pickWithAntiTypicality
- 22 tester gröna (schema-valid + invalid fixtures, jaccard-konvergens, monte carlo-boost, edge cases)

### Task 31.2 — Pipeline Stage 1.5 i SKILL.md ✅
- Ny Stage 1.5 (Verbalized Sampling) injicerad mellan Stage 1 och Stage 2
- Stage 4 utökad med round 2+ originality-critic + anti-pattern-context-instruktion
- Sub-Document Loading-tabell uppdaterad

### Task 31.3 — Anti-typicality critic ✅
- `agents/critic-originality.md` — agent-persona för 9:e dimensionen
- `hooks/scripts/lib/critics/originality.mjs` — calculateOriginalityScore + cosineSimilarity8D + readRecentAccepted + loadGlobalPriors
- `hooks/scripts/lib/critic-merge.mjs` — additivt utökad med ORIGINALITY_DIMENSIONS + mergeOriginality (icke-breaking)
- `skills/visionary/priors/global-aesthetic-history.json` — 10 kuraterade fallback-entries
- 23 tester gröna (round-gating, fallback, top-3 collisions, AC-tester)

### Task 31.4 — Echo-chamber break ✅
- `hooks/scripts/lib/anti-pattern-context.mjs` — buildAntiPatternContext med token-cap + cache
- 17 tester gröna (round 1 skip, fallback, filtering, cache, token-cap)
- Integration i `capture-and-critique.mjs`:
  - Anti-pattern-context injiceras i additionalContext för round 2+
  - Originality-critic-instruktion i additionalContext för round 2+
  - Trace event `anti_pattern_context_injected` med metadata
  - `brief_embedded` event utökat med `anti_typicality_enabled` + `anti_pattern_method`

### Task 31.5 — Konfiguration ✅
- `skills/visionary/anti-typicality.json` — default-config (NY fil — calibration.json är runtime-output, ej config)
- `skills/visionary/schemas/anti-typicality.schema.json` — JSON-schema-validering
- `hooks/scripts/lib/anti-typicality-config.mjs` — loadConfig med 3-stages merge (defaults ← file ← env)
- 25 tester gröna (defaults, missing/malformed file, env-overrides, alias, clamping)
- Env-overrides: VISIONARY_VS_ALPHA, VISIONARY_VS_DISABLED, VISIONARY_DISABLE_VS, VISIONARY_ORIGINALITY_WEIGHT, VISIONARY_HISTORY_WINDOW

### Task 31.6 — Tester ✅
- 87 tester över 4 nya test-filer, alla gröna
- Existing critic-merge-tester (15) fortfarande gröna efter additiv ändring
- Smoke-test: capture-and-critique.mjs laddar och hanterar stub-input

### Task 31.7 — Dokumentation ✅
- `docs/anti-typicality.md` — 290+ rader på svenska, alla källor refererade
- `README.md` — sektion under Sprints 13-15 + 4 nya env-flaggor i tabellen

## Pending — kräver live-run

### Benchmark (utförs när Sprint 16 mergas till main + pluggas in i live preview)

50 prompts × 2 conditions = 100 generations. Behöver Spotify/Playwright-environment + DINOv2 (om tillgängligt) eller 8D-fallback.

**Förväntade siffror (Zhang 2025):**
- Diversity: 1.5-2× (pairwise DINOv2-cosine sjunker från ~0.72 till ~0.45-0.55)
- Quality-drop: ≤ 0.3 avg score
- Token-overhead: +10-15%
- Wall-clock-overhead: +2-4 s per generation
- Statistisk signifikans: two-tailed t-test p < 0.05

## Definition of Done — status

- [x] Alla tasks (31.1–31.7) klara
- [x] `partials/verbalized-sampling.md` finns och är invokerad i Stage 1.5
- [x] `agents/critic-originality.md` skriven; 9:e dim integrerad i critic-merge
- [x] Anti-pattern context injiceras i round 2+ i `capture-and-critique.mjs`
- [x] `anti-typicality.json` har valida defaults med schema
- [x] `node --test` grön på 87 nya tester + 15 existerande critic-merge
- [ ] **Benchmark pending** — `results/` rapport uppdateras post-merge med live-data
- [x] `docs/anti-typicality.md` reviewed med korrekta källor
- [ ] **Mergad till main** — väntar på user review

## Amendments till sprint-doc

1. **Config-fil-byte:** Task 31.5 specade `calibration.json` men den filen är runtime-genererad regression-output. Konfig flyttades till ny dedikerad `anti-typicality.json` (samma directory). Schema och loader uppdaterade konsekvent.

2. **Schema-bound critic-output:** Originality-dim kunde inte läggas i `scores`-blocket utan att bryta `additionalProperties: false`. Lösning: `mergeCritics` producerar 10-dim schema-valid output; `mergeOriginality` är separat 11:e-dim merge som körs av hook efter att critic-merge är klart. Ger task 31.4 en clean integration-punkt och behåller schema-validitet.

3. **Doc-språk:** anti-typicality.md skriven på svenska enligt explicit instruktion. Övriga docs/-filer är på engelska — möjlig översättning vid behov för konsistens.
