# Sprint 16 — Anti-Typicality Foundation: Verbalized Sampling + Echo-Chamber Break

**Vecka:** 29
**Fas:** 10 — Generativ diversitet (ny fas)
**Items:** 31, 32 från roadmap (nya)
**Mål:** Attackera root cause för designkonvergens. RLHF-tränade modeller (Claude inkluderat) lider av *typicality bias* (α ≈ 0.57–0.65 enligt Zhang 2025) som drar generation mot fördelningens topp — det "förväntade", det "trygga", det vi redan sett. Sprint 16 implementerar två träningsfria interventioner som tillsammans bryter konvergensen: (1) **Verbalized Sampling** — tvinga modellen att verbalisera 5 distinkta tolkningar med sannolikhetsvikter innan generation, så låg-prob-koncept får luft, och (2) **Echo-chamber break** — en originality-dimension i critic-loopen som explicit jämför mot accepted history i `taste/facts.jsonl` istället för en abstrakt "bra design", så Self-Refine slutar förstärka konvergens.

Wild idea från forskningen: det räcker inte att ha 202 stilar i en katalog om generationen alltid drar mot de 20 mest "förväntade". Be modellen istället ge oss 5 distinkta koncept med sannolikhetsvikter och sampla probabilistiskt — då kommer låg-sannolikhetstolkningar fram. Och sluta låt critic-loopen jämföra mot en abstrakt "bra design"; jämför explicit mot vad användaren ACCEPTERAT förut. Resultat: 1.5–2× diversity utan kvalitetsförsämring.

## Scope

- Item 31 — Verbalized Sampling: ny prompt-partial, ny pipeline-stage 1.5, JSON-schema för koncept-array, anti-typicality boost-formel, konvergens-check, integration i SKILL.md.
- Item 32 — Echo-chamber break: ny `critic-originality.md`-agent, 9:e dimension i arbitration-tabellen, dynamisk anti-pattern-context-injection round 2+, trace-events, konfig.

## Pre-flight checklist

- [ ] Sprint 6 mergad — multi-critic + arbitration-table stable (krävs för 9:e dimension)
- [ ] Sprint 11 (DINOv2) optional men preferred — om aktiv används visuell similarity för originality, annars 8D-embedding-cosine
- [ ] Sprint 15 mergad rekommenderas — designer-as-subagent + originality samspelar i arbitration-tabellen
- [ ] `taste/facts.jsonl` med ≥ 10 accepted entries finns för meningsfull originality-baseline (annars: fallback till global aesthetic-cluster history)
- [ ] Feature-branch: `feat/sprint-16-anti-typicality`

---

## Task 31.1 — Verbalized Sampling partial [M]

**Fil:** `skills/visionary/partials/verbalized-sampling.md` (ny)

**Vad:** Skapa ny prompt-partial som instruerar Claude att returnera en JSON-array med 5 distinkta tolkningar **innan** generation startar. Probabilities summerar till ~1.0 men är medvetet *anti-flat* (Zhang 2025: α = 0.6–0.7 ger 1.6–2.1× diversity-ökning utan quality-loss).

**JSON-format:**
```json
{
  "concepts": [
    {
      "concept": "minimal editorial card with single accent line",
      "probability": 0.34,
      "rationale": "matches calm-tone signal + density:spacious",
      "suggested_style_id": "swiss-international"
    },
    {
      "concept": "asymmetric grid with overprint typography",
      "probability": 0.22,
      "rationale": "alternative tied to Greiman bias if user has any history",
      "suggested_style_id": "new-wave-greiman"
    },
    "... (3 more)"
  ]
}
```

**Steg:**
1. Skriv prompt-template med strikt format-spec (system-mässig instruktion: "before any code, return ONLY this JSON object").
2. Ange max-token-budget för 5 koncept: 50 tokens rationale × 5 + struktur ≈ 400 tokens cap.
3. **Konvergens-check**: om 3+ koncept har cosine-similarity > 0.85 i 384-dim embedding-rymden (eller fallback: token-set-jaccard > 0.7) → re-prompt med systemmessage "explicit divergens: dina 5 förslag liknar varandra för mycket; ge mig 5 som är från olika design-traditioner".
4. **Anti-typicality boost**: vid weighted random val, multiplicera kandidatens vikt med `(1/typicality)^α` där α = 0.65 (default) och `typicality = probability`. Detta ger låg-prob-kandidater (probability < 0.15) en faktor 1.3–1.6× chans, högt-prob-kandidater (probability > 0.4) ~0.8× chans.
5. Validera mot JSON-schema: `skills/visionary/schemas/verbalized-sampling.schema.json` (ny — concept: string len 10–120, probability: number [0,1], rationale: string len 10–200, suggested_style_id: string matching existing _index.json).

**AC:**
- Test med 10 prompts visar 5 distinkta koncept (pairwise cosine < 0.85 efter konvergens-check).
- JSON validerar mot schema i ≥ 95 % av runs (≤ 5 % retry-rate på malformed JSON).
- Boost-faktor verifierad numeriskt: kandidater med probability ∈ [0.05, 0.15] får 1.3–1.6× weighted-pick-frekvens över 1000 samplings.
- Konvergens-check triggar re-prompt i unit-test med 5 nästan identiska koncept.

---

## Task 31.2 — Pipeline-integration i SKILL.md [M]

**Fil:** `skills/visionary/SKILL.md`, `skills/visionary/schemas/critique-output.schema.json` (utöka)

**Vad:** Ny **Stage 1.5 — Verbalized Sampling**, mellan existing Stage 1 (Context Inference) och Stage 2 (Design Reasoning Brief). Skiljer sig från `/variants` (som genererar 3 fullständiga renders) genom att VS sker INNAN kod skrivs och kostar bara 400 tokens — det styr vilket koncept Stage 2 utvecklar.

**Steg:**
1. Lägg till Stage 1.5 i pipeline-beskrivningen i SKILL.md:
   - Aktiveras default i v1.0 (kan stängas av med `--no-vs` eller env `VISIONARY_DISABLE_VS=1`).
   - Tar emot `StyleBrief` från Stage 1.
   - Anropar VS-partial → få JSON-array.
   - Applicerar konvergens-check + anti-typicality boost → väljer 1 koncept.
   - Det valda konceptet blir input till Stage 2 (anrikar Design Reasoning Brief).
2. Flagga `--vs` (default ON) eller `--no-vs` (skipa hela stagen, gå direkt Stage 1 → Stage 2 som idag).
3. Utöka receipt-output med fält:
   ```json
   "vs_concepts": [
     { "concept": "...", "probability": 0.34, "picked": false },
     { "concept": "...", "probability": 0.22, "picked": true },
     "..."
   ],
   "vs_alpha": 0.65,
   "vs_skipped": false
   ```
4. **Backwards-compat**: gamla flows utan Stage 1.5 fungerar — om `vs_concepts` saknas i receipt, render reciept-renderer faller tillbaka till v1.5.x-format.
5. Skillnad från `/variants` dokumenteras: `/variants` = 3 fullständiga renders för user-pick EFTER stil-val; `/vs` = 5 koncept-vikter INNAN render för internal sampling. Båda kan komboas (`/variants --vs` ger 3 renders × varsitt VS-pick).

**AC:**
- SKILL.md beskriver nya Stage 1.5 i samma format som existing stages.
- Receipt-schema validerar både gamla (utan vs_*) och nya (med vs_*) format.
- Test: `/visionary --no-vs` skippar Stage 1.5 helt (ingen extra token-cost, vs_skipped: true i receipt).
- Test: default `/visionary` aktiverar Stage 1.5 (vs_concepts har 5 entries i receipt).

---

## Task 31.3 — Anti-typicality critic-prompt [M]

**Filer:** `agents/critic-originality.md` (ny), uppdatera `agents/critic-aesthetic.md` + `agents/critic-craft.md` (kort note att 9:e dim hanteras separat).

**Vad:** Lägg till 9:e critic-dimension `originality_vs_history` parallell med befintliga 8 (Hierarchy / Contrast / Motion-Coherence / Density / Brand-Fit / Originality / Accessibility / Polish). Den existerande "Originality"-dimensionen i visual-critic mäter *generic AI slop* (gradient + Inter), medan denna nya `originality_vs_history` mäter *similarity to user's own accepted history* — det är två olika problem.

**Critic-input:**
- Top-10 senaste **accepted** designsignaturer från `taste/facts.jsonl` (utesluter rejected, utesluter `git_delete`-classified entries).
- Aktuell render (screenshot eller embedding-vector).
- Round-counter (round 1 = ingen historik att jämföra mot, hoppa över).

**Score-formel:**
```
originality_vs_history = 10 - (max(similarity_to_history) * 10)
```

- Om Sprint 11 (DINOv2) är aktiv: similarity = DINOv2-cosine mellan render-screenshot och history-thumbnails.
- Annars: similarity = 8D-aesthetic-embedding-cosine (extraherad från Sprint 6 critic-output: `{hierarchy, contrast, motion, density, brand_fit, originality, accessibility, polish}` som vektor).
- Score-range [0, 10]: helt nytt → 10, identisk kopia av tidigare accepted → 0.

**Round-gating:**
- **Round 1**: `originality_vs_history` returnerar `null` (no history to compare). Critic-merge ignorerar dimensionen → arbitration-tabell fortsätter med 8 dims.
- **Round 2+**: dimensionen aktiv. Default-vikt i arbitration: 0.8 (lägre än craft/aesthetic 1.0 men högre än designer 0.25).

**Steg:**
1. Skriv `agents/critic-originality.md` agent-template (samma format som `critic-aesthetic.md`, mindre prompt eftersom det bara mäter en dim).
2. Critic-merge-modulen (`hooks/scripts/lib/critic-merge.mjs` från Sprint 6) får ny dim med round-gate-logik.
3. Implementera båda similarity-vägar: DINOv2-väg om `process.env.VISIONARY_DINOV2_ENABLED === '1'`, annars 8D-fallback.
4. Trace-event `originality_score` med payload `{round, score, top_collisions: [{generation_id, similarity}], used_method: "dinov2" | "embedding-8d"}`.
5. **Top collisions**: rapportera top-3 mest liknande historiska entries så användaren kan se *vad* den nya designen liknar.

**AC:**
- Test 1: ny design liknar tidigare accepted (cosine 0.95) → originality_vs_history ≈ 0.5 → arbitration kommenterar "near-duplicate of generation_id X".
- Test 2: helt nytt koncept (cosine ≤ 0.4 mot all history) → originality_vs_history ≈ 6+.
- Test 3: round 1 hoppar över originality, returnerar null, critic-merge fungerar med 8 dims.
- Test 4: round 2 med tom `taste/facts.jsonl` → fallback till global aesthetic-cluster history (Task 31.5 risk-mitigering).

---

## Task 31.4 — Echo-chamber break i critique-loop [M]

**Fil:** `hooks/scripts/capture-and-critique.mjs`

**Vad:** Round 2+ får dynamiskt injicerad context som explicit säger till critic-modellen: "score-höjningar via konvergens mot mainstream räknas inte; bara via ovanlighet i facts.jsonl-historik". Detta är **echo-chamber break** — Self-Refine (Madaan 2023) förstärker bias när samma modell både genererar och kritiserar; vi bryter loopen genom att ge critic-prompten en explicit *anti-pattern context*.

**Implementation:**
1. Vid round N ≥ 2:
   - Läs `taste/facts.jsonl` (filtrerad: status ∈ {active, permanent}, signal ∈ {git_kept, picked, accepted}).
   - Ta top-10 senaste (sorted by `last_seen DESC`).
   - För varje: extrahera designsignatur (screenshot-thumbnail-hash om Sprint 11 aktiv, annars 8D-embedding-vector från senaste critic-run).
2. **Bygg anti-pattern context** för critic-prompten:
   ```
   ANTI-PATTERN CONTEXT (round 2+):
   The user has previously accepted these 10 designs (their taste pattern is stabilized).
   Do NOT reward this generation for converging toward those patterns. Reward it ONLY when
   it explores territory the user has not yet seen. Score originality_vs_history accordingly.

   Reference signatures (top-10):
   1. generation_id: 01HXY... | dom_palette: oxblood | density: dense | motion: subtle
   2. ...
   ```
3. Inject anti-pattern-context **före** critic-prompten i round 2+ (round 1 oförändrad).
4. Trace-event `anti_pattern_context_injected` med `{round, history_count, history_window_days, used_method}`.

**Steg:**
1. Modul `hooks/scripts/lib/anti-pattern-context.mjs` (ny) bygger context-sträng från facts.jsonl.
2. Hook `capture-and-critique.mjs` invokerar modulen vid round ≥ 2.
3. Cap context-storlek vid 1500 tokens (10 entries × ~150 tokens hash+meta).
4. Cache per session: samma round samma facts.jsonl → reuse context-sträng.

**AC:**
- Test: round 2 critic-output har lägre `originality_vs_history` om generation embedding-liknar history (cosine > 0.85).
- Test: round 2 critic-output har högre `originality_vs_history` om generation är tydligt new territory.
- Test: `anti_pattern_context_injected` event finns i trace för round 2+, saknas för round 1.
- Test: tom `taste/facts.jsonl` → context-modul returnerar fallback-text "no user history yet, use global aesthetic priors", inget crasch.

---

## Task 31.5 — Konfiguration + flaggor [S]

**Fil:** `skills/visionary/calibration.json` (utöka), `docs/anti-typicality.md` (refererar)

**Vad:** Lägg till sektion `anti_typicality` i calibration.json med default-värden valida mot Zhang 2025 + 2026-baseline.

**Konfig-struktur:**
```json
{
  "anti_typicality": {
    "enabled": true,
    "vs_alpha": 0.65,
    "vs_concept_count": 5,
    "vs_convergence_threshold": 0.85,
    "originality_weight": 0.8,
    "originality_history_window": 10,
    "originality_history_max_age_days": 90,
    "boost_factor_cap": 1.6,
    "min_concept_quality_threshold": 0.3
  }
}
```

**Env-overrides** (matchar existing taste-pattern):
- `VISIONARY_VS_ALPHA` → vs_alpha
- `VISIONARY_VS_DISABLED=1` → enabled: false
- `VISIONARY_ORIGINALITY_WEIGHT` → originality_weight
- `VISIONARY_HISTORY_WINDOW` → originality_history_window

**Default-rationale (referenser i `docs/anti-typicality.md`):**
- `vs_alpha: 0.65` → mid-point på Zhang 2025 [0.6, 0.7] sweet spot.
- `vs_concept_count: 5` → balans mellan diversity och token-cost (3 = för få, 7 = mediokert distribuerat).
- `vs_convergence_threshold: 0.85` → empirisk gräns där designs börjar vara samma sak i olika ord.
- `originality_history_window: 10` → match till `taste/facts.jsonl` aging-window.
- `originality_history_max_age_days: 90` → samma som decay-threshold för `active → decayed`.

**AC:**
- `calibration.json` validerar mot ny schema-extension.
- Env-overrides parsas till floats/booleans korrekt (test för bad input → fallback till default).
- Default-värden från Zhang-papret är referenced i `docs/anti-typicality.md`.

---

## Task 31.6 — Tester [M]

**Filer:**
- `hooks/scripts/lib/__tests__/verbalized-sampling.test.mjs` (ny)
- `hooks/scripts/lib/__tests__/originality-critic.test.mjs` (ny)
- `hooks/scripts/lib/__tests__/anti-pattern-context.test.mjs` (ny)

**Coverage:**

**verbalized-sampling.test.mjs:**
- VS schema-validering (10 fixturer: valid + 5 olika invalid-format).
- Anti-typicality boost-matematik: 1000-sample monte carlo, verifiera att probability ∈ [0.05, 0.15]-kandidater får 1.3–1.6× viktad pick-frekvens.
- Konvergens-check: 5 distinkta koncept passerar; 5 nästan-identiska triggar re-prompt.
- Token-budget cap: prompt + response ≤ 800 tokens i typical case.
- Backwards-compat: `--no-vs`-flag skippar hela modulen.

**originality-critic.test.mjs:**
- Round 1 returnerar null (no history).
- Round 2+ med liknande history → low score (≤ 4).
- Round 2+ med distinct generation → high score (≥ 7).
- Empty `taste/facts.jsonl` → fallback till global priors, no crash.
- DINOv2-mode + 8D-embedding-mode båda fungerar (gated på env).
- Top-3 collisions rapporterade korrekt.

**anti-pattern-context.test.mjs:**
- Context-string byggs från facts.jsonl korrekt (top-10 sorted).
- Cap vid 1500 tokens även med 50 entries i history.
- Cache reuse: samma round samma facts → samma context-string.
- Empty facts → fallback-message, no crash.

**AC:**
- `node --test hooks/scripts/lib/__tests__/` grön.
- Coverage ≥ 80 % på alla tre nya moduler (mätt med c8).
- Inga regressioner i existing test-suite.

---

## Task 31.7 — Dokumentation [S]

**Fil:** `docs/anti-typicality.md` (ny), uppdatera `README.md` (kort sektion).

**Innehåll:**
1. **Konceptet** — vad typicality bias är, varför RLHF-träning ger α ≈ 0.57–0.65, varför Self-Refine förstärker den.
2. **Två interventioner** — VS (proactive: före generation) + originality-dim (reactive: under critique).
3. **Hur VS skiljer sig från `/variants`** — VS = 5 koncept-vikter internt, `/variants` = 3 fullständiga renders för user-pick. Båda kan komboas.
4. **Hur originality-dim funkar** — round-gating, score-formel, top collisions, DINOv2 vs 8D fallback.
5. **När att stänga av** — mycket likformig produkt-katalog där konsistens > nytänkande (e.g. enterprise SaaS-suite med 200 sidor som måste se identiska ut), early-stage-projekt med < 5 entries i facts.jsonl, debugging-sessioner där deterministisk output önskas.
6. **Källor:**
   - Verbalized Sampling: arxiv.org/abs/2510.01171 (Zhang et al. 2025)
   - Creative Homogeneity in LLMs: arxiv.org/html/2501.19361
   - Self-Refine: arxiv.org/abs/2303.17651 (Madaan et al. 2023)
7. **Jämförelsetabell** — diversity-mätningar baseline vs sprint-16 (placeholder, fylls i efter benchmark).

**AC:**
- Doc reviewed och förståelig för läsare som inte läst Zhang-papret.
- Källor refererade med stabila arxiv-links.
- README.md har 1-paragraf-sektion med länk till `docs/anti-typicality.md`.

---

## Benchmark-verifiering

**Fil:** `results/sprint-16-anti-typicality.md`

**Mätningar:**
- 50 prompts × 2 conditions (baseline utan VS+originality, sprint-16 med båda) = 100 generations totalt.
- Prompt-set: blandning av domains (10 SaaS, 10 editorial, 10 e-commerce, 10 portfolio, 10 dashboard).
- Diversity-metric: **pairwise DINOv2-cosine medel** mellan alla 50 generations inom samma condition. Lägre medel = högre diversity.
- Quality-metric: avg per-dim critic-score över alla 8 originaldimensioner (originality_vs_history utesluten för fair comparison).
- Token-cost: avg input + output tokens per generation.
- Wall-clock-tid: avg sek per generation inkl. critique loop.

**Förväntade resultat (Zhang 2025-baseline):**
- Diversity: 1.5–2× ökning (pairwise cosine sjunker från ~0.72 till ~0.45–0.55).
- Quality: avg score ≥ baseline − 0.3 (acceptabelt drop, "no quality regression").
- Token-cost: +10–15 % (VS-stage adderar ~400 tokens per generation).
- Wall-clock: +2–4 s per generation (VS-anrop till Claude + originality-anrop round 2+).

**Statistisk signifikans:**
- Two-tailed t-test på pairwise cosine mellan baseline och sprint-16.
- p < 0.05 över 50 prompts krävs för att deklarera framgång.
- Confidence interval på diversity-skillnad rapporteras (95 % CI).

**AC:**
- Rapport publicerad i `results/sprint-16-anti-typicality.md`.
- Diversity-skillnad statistiskt signifikant (p < 0.05).
- Quality-drop ≤ 0.3 avg score.
- Token + wall-clock-overhead inom budget.

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| VS ger 5 mediokra koncept istället för 3 starka | Medel | Hög | Konvergens-check vid cosine > 0.85 + min-quality-threshold per koncept (rationale len ≥ 10 chars, suggested_style_id måste matcha _index.json). Konvergens-fail triggar re-prompt med "explicit divergens"-instruktion. |
| Originality-dim straffar legitima refinement-iterations | Hög | Medel | Endast round 2+, bara mot **accepted** history (ej rejected). Refinement på round 2 av samma generation jämförs mot history utanför nuvarande generation_id. Default-vikt 0.8 (lägre än craft/aesthetic 1.0) så den inte dominerar arbitration. |
| Token-cost ökar 30 %+ per generation | Medel | Medel | Cap på 5 koncept × 50 tokens rationale = 400 tokens VS-overhead. VS endast vid första render (inte vid round 2+ regenerationer). Anti-pattern context cap 1500 tokens, cached per session. Mätt overhead i benchmark; om > 25 % → reducera vs_concept_count till 3. |
| `taste/facts.jsonl` tom på nya projekt → originality alltid neutral | Hög | Låg | Fallback till global aesthetic-cluster history (top-10 från ett kuraterat shipped-design-set i `skills/visionary/priors/global-aesthetic-history.json`). Explicit logged i trace: `originality_used_fallback: true`. |
| Modellen hittar på JSON som inte validerar | Medel | Medel | Strict schema-validering + 1 retry med systemmessage "förra svaret bröt mot schema, returnera ENBART JSON-objekt". Om 2 retries misslyckas → skippa Stage 1.5 och logga `vs_skipped: true, reason: "schema_validation_failed"`. |
| Sprint 11 (DINOv2) inte aktiv → 8D-embedding-fallback ger sämre similarity | Låg | Låg | 8D-embedding är coarse men fungerar för echo-chamber-detection (cosine på 8 dims > 0.85 är fortfarande en stark signal). Doc:a att DINOv2-mode ger 1.2–1.4× bättre originality-precision. |
| Anti-pattern context förvirrar critic-modellen i edge cases | Låg | Medel | A/B-test i benchmark: 25 prompts med context, 25 utan, jämför critic-rationale-kvalitet manuellt. Om context försämrar rationale → reducera till bara hash-listan utan natural-language-prefix. |

---

## Definition of Done

- [ ] Alla tasks (31.1–31.7) klara
- [ ] `skills/visionary/partials/verbalized-sampling.md` finns och är invokerad i Stage 1.5
- [ ] `agents/critic-originality.md` skriven; 9:e dim integrerad i critic-merge
- [ ] Anti-pattern context injiceras i round 2+ i `capture-and-critique.mjs`
- [ ] `calibration.json` har `anti_typicality`-sektion med valida defaults
- [ ] `node --test` grön; coverage ≥ 80 % på nya moduler
- [ ] `results/sprint-16-anti-typicality.md` publicerad med p < 0.05 diversity-ökning
- [ ] `docs/anti-typicality.md` reviewed med korrekta källor (Zhang 2025, Madaan 2023)
- [ ] Mergad till `main`

## Amendments

_Tomt._
