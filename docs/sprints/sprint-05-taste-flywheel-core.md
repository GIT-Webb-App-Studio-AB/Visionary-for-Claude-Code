# Sprint 05 — Taste flywheel core: facts.jsonl + FSPO pairs + git-harvest

**Vecka:** 7–8
**Fas:** 3 — Moat-building
**Items:** 14, 15, 16 från roadmap
**Mål:** Ersätt binära 3-rejection-flaggan med en strukturerad taste-profil som lär sig från både explicita signaler och passiva (git-historia).

## Scope

- Item 14 — Ersätt `system.md` med `taste/facts.jsonl` + Mem0-style extractor
- Item 15 — FSPO-pairs lagring + few-shot injection i algoritm-steg 4
- Item 16 — `harvest-git-signal.mjs` SessionStart-hook

## Pre-flight checklist

- [ ] Sprint 4 mergad — 2026-primitiver + BoN live
- [ ] Beslut fattat om backward-compat för existerande `system.md`-användare (rekommendation: auto-migrate)
- [ ] Feature-branch: `feat/sprint-05-taste-core`

---

## Task 14.1 — Designa `taste/facts.jsonl` schema [M]

**Fil:** `skills/visionary/schemas/taste-fact.schema.json` (ny)

**Schema:**
```json
{
  "type": "object",
  "required": ["id", "scope", "signal", "evidence", "confidence", "created_at"],
  "properties": {
    "id": { "type": "string", "description": "ULID" },
    "scope": {
      "type": "object",
      "properties": {
        "level": { "enum": ["global", "project", "component_type", "archetype"] },
        "key": { "type": "string", "description": "e.g. 'dashboard', 'fintech-trust', or '*'" }
      },
      "required": ["level", "key"]
    },
    "signal": {
      "type": "object",
      "properties": {
        "direction": { "enum": ["avoid", "prefer"] },
        "target_type": { "enum": ["style_id", "palette_tag", "motion_tier", "typography_family", "density_level", "color", "pattern"] },
        "target_value": { "type": "string" }
      },
      "required": ["direction", "target_type", "target_value"]
    },
    "evidence": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "kind": { "enum": ["explicit_rejection", "explicit_approval", "git_delete", "git_heavy_edit", "git_kept", "pairwise_pick"] },
          "quote_or_diff": { "type": "string" },
          "at": { "type": "string", "format": "date-time" }
        }
      }
    },
    "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
    "last_seen": { "type": "string", "format": "date-time" },
    "created_at": { "type": "string", "format": "date-time" },
    "flag": { "enum": ["active", "permanent", "decayed"] }
  }
}
```

**Exempel facts:**
```jsonl
{"id":"01HXY...","scope":{"level":"project","key":"*"},"signal":{"direction":"avoid","target_type":"pattern","target_value":"glassmorphism-on-dashboards"},"evidence":[{"kind":"explicit_rejection","quote_or_diff":"nej det här känns generiskt","at":"2026-04-10T..."}],"confidence":0.8,"last_seen":"2026-04-10T...","created_at":"2026-04-10T...","flag":"active"}
{"id":"01HXZ...","scope":{"level":"global","key":"*"},"signal":{"direction":"prefer","target_type":"typography_family","target_value":"editorial-serif"},"evidence":[{"kind":"pairwise_pick","quote_or_diff":"valt bauhaus-dessau över neobrutalism-softened","at":"2026-04-12T..."}],"confidence":0.6,"last_seen":"2026-04-12T...","created_at":"2026-04-12T...","flag":"active"}
```

**AC:**
- Schema publicerat, exempel dokumenterade
- Migrationsplan från `system.md` (se Task 14.4)

---

## Task 14.2 — Mem0-style extractor [L]

**Fil:** `hooks/scripts/lib/taste-extractor.mjs` (ny)

**Flöde:**
```
Trigger: UserPromptSubmit-hook detekterar rejection/approval-fras
  → Kör extractor som LLM-call (Haiku 4.5 för kostnad)
  → Extractor returnerar kandidat-facts eller edits till existerande facts
  → Validator: är det en duplicate? update confidence på existing istället
  → Appenda ny fact till facts.jsonl OR patcha existing (JSONL-kompatibel append-only)
```

**Extractor-prompt (system):**
```
Du läser en användares konversation med Visionary och extraherar
strukturerade "taste facts" enligt taste-fact.schema.json.

Returnera ALLTID en array (kan vara tom).

Varje fact måste:
- citera evidens från texten (quote_or_diff)
- scope:as korrekt (global om inte projektspecifikt kontext)
- sättas med confidence rimlig för signalstyrka (0.3 för ambivalent, 0.9 för explicit)

Upptäck duplicates: om användaren säger samma sak som tidigare → foreslå
update av existing fact istället för ny.
```

**Steg:**
1. Implementera `extractFactsFromTurn(userMessage, recentContext, existingFacts) → Fact[]`
2. Validator tar bort duplicates via (scope + signal)-nyckel
3. Atomic append till `taste/facts.jsonl` (fsync)

**AC:**
- 10 syntetiska conversations ger förväntade facts (test fixtures)
- Duplicate-detection fungerar (rekör samma message 2× → 1 fact, inte 2)

---

## Task 14.3 — Fact-promotion: active → permanent → decayed [M]

**Regler:**

```
PROMOTION: active → permanent
  IF confidence ≥ 0.9
  AND evidence.length ≥ 3
  AND unique(evidence.kind) ≥ 2  // bevis från ≥ 2 källor
  THEN flag = "permanent"

DECAY: active → decayed
  IF last_seen > 30 days ago
  AND no new evidence
  THEN flag = "decayed", confidence *= 0.5
  IF confidence < 0.2 → delete

REACTIVATION: decayed → active
  IF new evidence arrives
  THEN flag = "active", confidence = max(existing, 0.5)
```

**Fil:** `hooks/scripts/lib/taste-aging.mjs` + scheduled weekly via SessionStart

**AC:**
- 3 unit-test-scenarios covered (promotion, decay, reactivation)
- Aging-run dokumenterad i `taste/aging.log`

---

## Task 14.4 — Migrering från `system.md` [S]

**Fil:** `scripts/migrate-system-md-to-facts.mjs` (ny)

**Steg:**
1. Parsa existerande `system.md`-entries (förmodat linjer med `AVOID: ... — user rejected YYYY-MM-DD`)
2. Konvertera varje till Fact med `scope.level="project"`, `signal.direction="avoid"`, `confidence=0.7`, `evidence=[explicit_rejection]`
3. Skriv till `taste/facts.jsonl`
4. Behåll `system.md` som read-only legacy file (inkludera en header "MIGRATED — do not edit, see taste/facts.jsonl")
5. Runtime: om `taste/facts.jsonl` existerar → ignorera `system.md`; annars kör auto-migration

**AC:**
- Migration på faktisk system.md-sample fungerar
- Runtime-fallback existerar

---

## Task 14.5 — Integrera facts.jsonl i algoritm-steg 4.5 [M]

**Fil:** `skills/visionary/context-inference.md` + runtime

**Nuvarande:** "permanent flag after 3 rejections" — binär check.
**Nytt:**

```
1. Ladda facts.jsonl (stream, filter flag != "decayed")
2. För varje kandidat style: beräkna taste-match-score
   For each fact matching scope:
     If signal.direction == "avoid" AND signal matches candidate → -confidence
     If signal.direction == "prefer" AND signal matches candidate → +confidence
3. Applicera till weighted-random: w_i *= exp(taste_match_score / τ) där τ är exploration-temperatur
4. Hard-block: fact.flag == "permanent" AND avoid AND direct-match → exklud
```

**AC:**
- 10-prompt-suite med 3 hand-curated facts demonstrerar mätbar beteende-förändring (specifika styles undviks/preferras)

---

## Task 15.1 — `taste/pairs.jsonl` schema [S]

**Fil:** `skills/visionary/schemas/taste-pair.schema.json` (ny)

**Schema:**
```json
{
  "type": "object",
  "required": ["id", "chosen", "rejected", "context", "created_at"],
  "properties": {
    "id": { "type": "string" },
    "chosen": { "type": "object", "properties": { "style_id": "string", "variant_index": "integer" } },
    "rejected": { "type": "array", "items": { "type": "object", "properties": { "style_id": "string", "variant_index": "integer" } } },
    "context": {
      "type": "object",
      "properties": {
        "brief_summary": { "type": "string" },
        "product_archetype": { "type": "string" },
        "component_type": { "type": "string" },
        "audience_density": { "type": "string" }
      }
    },
    "created_at": { "type": "string", "format": "date-time" }
  }
}
```

**AC:**
- Schema + exempel publicerade

---

## Task 15.2 — Lagring efter `/variants`-pick [M]

**Fil:** `commands/variants.md` + runtime

**Steg:**
1. När användaren anger val (t.ex. "jag tar #2") → hook extraherar chosen + rejected
2. Lagra pair i `taste/pairs.jsonl`
3. Lagra brief-summary (LLM-komprimerad till ≤ 60 tokens så den kan few-shot:as senare)

**AC:**
- Test: kör 3 `/variants`-sessions → 3 pairs lagrade

---

## Task 15.3 — FSPO few-shot injection i algoritm-steg 4 [M]

**Fil:** `skills/visionary/context-inference.md`

**Flöde:**
```
När algoritm-steg 4 ska köras:
1. Ladda alla pairs från pairs.jsonl
2. Embedda current brief
3. Retrieve top-8 mest-relevanta pairs (combination of similarity + diversity för att täcka olika axlar)
4. Injecta i systemprompten som few-shot-examples:

   "User's prior picks under similar context:
    - Pref brief: 'dashboard for a fintech'
      Picked: swiss-muller-brockmann
      Over: fintech-trust, glassmorphism
    - ..."

5. Modellen använder dessa som taste-ankare
```

**AC:**
- On 10-prompt benchmark: selection converges toward historically-preferred styles ≥ 30 % oftare vs icke-FSPO

---

## Task 15.4 — Pair-diversity-sampler [M]

**Fil:** `hooks/scripts/lib/pair-sampler.mjs`

**Syfte:** undvik att alla 8 few-shots är samma variant av taste-signal.

**Algoritm:**
1. För varje pair: beräkna 8-dim embedding av (chosen - rejected_mean)
2. Greedy: välj 1st pair (closest to brief), sen varje efterföljande pair ska vara maximal cosine-distance från redan-valda
3. Stoppa vid 8 eller tom pool

**AC:**
- Unit-test med 50 syntetiska pairs visar diversitet ≥ 0.4 mean cosine distance

---

## Task 16.1 — `harvest-git-signal.mjs` [L]

**Fil:** `hooks/scripts/harvest-git-signal.mjs` (ny)

**Trigger:** `SessionStart` hook (redan etablerad, se `check-for-updates.mjs`)

**Flöde:**
```
1. Lista alla filer som Visionary skapat (path-konvention: components/ui/*, app/**/page.tsx, etc.)
   Detekteringssignal: kommentar ".visionary-generated" i headern (som Sprint 5 task 19.2 tillför)
2. För varje fil: kör `git log --follow --numstat` sedan creation
3. Klassificera:
   - untouched 7d: kind="git_kept", confidence +0.1
   - modified > 50% lines before 7d: kind="git_heavy_edit" — extract diff to see vad ändrades
   - deleted within 7d: kind="git_delete", confidence +0.2 (stark negativ signal)
4. Emit som candidate-facts till extractor (Task 14.2)
5. Extractor deduplicerar vs existerande facts
```

**Steg:**
1. Implementera git-parsing via `git log --format=...` + node exec
2. Heavy-edit-diff-interpretation: kör Haiku-LLM-call för att extrahera *vad* ändrades (inte bara att det ändrades)
3. Batch: processa max 50 filer per session (tidbudget)

**AC:**
- Test-repo med 5 Visionary-filer + kända git-operations ger förväntade 5 facts
- Inga false positives på user-skrivna filer (saknar `.visionary-generated`-marker)

---

## Task 16.2 — Markera Visionary-genererade filer [S]

**Fil:** Uppdatera alla generator-mallar

**Steg:**
1. Lägg till som första kommentar i varje generated fil:
   ```tsx
   /**
    * .visionary-generated
    * style: bauhaus-dessau
    * brief: "dashboard for clinic"
    * generated_at: 2026-04-22T...
    * generation_id: <uuid>
    */
   ```
2. Detta är inte en kommentar som tar plats — den är byggnadsställning för feedback-loopar
3. Användare får rensa bort om de inte gillar, men då förlorar git-harvest signal

**AC:**
- Alla 15 stacks har uppdaterade templates
- Marker läses korrekt av harvest-scriptet

---

## Task 16.3 — Privacy-guards + opt-out [S]

**Fil:** `docs/taste-privacy.md` (ny)

**Innehåll:**
- Allt taste-data lagras lokalt under `taste/` i user-hem eller projekt
- Opt-out: `VISIONARY_DISABLE_TASTE=1` → ingen harvesting, facts.jsonl ignoreras, pairs.jsonl ignoreras
- Git-harvest läser ALDRIG filinnehåll utanför `.visionary-generated`-markerade filer

**AC:**
- Dokumentation länkad från README
- Opt-out-test: env-var gör att inga nya facts genereras

---

## Task 16.4 — Taste-debug-command [S]

**Fil:** `commands/visionary-taste.md` (ny)

**Kommandon:**
- `/visionary-taste status` — visa counts (active facts, permanent flags, pairs)
- `/visionary-taste show <scope>` — lista facts för given scope
- `/visionary-taste forget <fact-id>` — manually delete fact
- `/visionary-taste reset` — ta bort alla facts (kräver confirm)

**AC:**
- 4 kommandon fungerar
- Dokumenterat i README

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| Extractor hallucinerar facts från irrelevanta turns | Medium | Hög | Validator tvingar evidens-citat från faktisk text |
| Git-harvest felklassificerar user-skriven kod som Visionary | Low | Medium | Strict marker-check |
| facts.jsonl växer obundet | Medium | Medium | Aging-rule + max-size 5 MB med äldsta decayed-first-purge |
| FSPO-pairs blir inkonsistenta efter user byter taste | Medium | Medium | Recent-bias i sampler (decay äldre pairs) |
| Privacy-oro vid git-scanning | Hög | Hög | Opt-out + dokumentation + ALDRIG läs utanför markerade filer |

## Definition of Done

- [ ] Alla tasks klara
- [ ] Migration från `system.md` fungerar
- [ ] 10-prompt benchmark efter 5 explicita facts: ≥ 30 % av selections respekterar facts
- [ ] Git-harvest producerar facts på test-repo
- [ ] Privacy-opt-out testat
- [ ] `results/sprint-05-comparison.md` publicerad med ”taste adherence rate”-metric
- [ ] Benchmark-score oförändrad eller bättre
- [ ] Merged till `main`

## Amendments

### 2026-04-23 — Full scope levererad via heuristic-first-mönster

**Orsak:** Sprint 05:s Task 14.2 (LLM-baserad extractor) och Task 16.1 (Haiku-diff-interpretation) förutsätter en Anthropic SDK-yta som plugin-arkitekturen inte har (samma blocker som Sprint 01 dokumenterade). Istället för att skjuta upp båda tasks eller introducera en ny dep-stack valdes Sprint 02/04:s etablerade mönster: heuristic-first implementation med `--llm`-stub som seam för framtida LLM-upgrade. Fullständig analys: `artifacts/sprint-05-architecture-notes.md`.

**Ändrad scope:**

- Alla 14 tasks levererade. Heuristic-path är primär; LLM-path är förberedd men inte aktiverad.
- Task 15.4 pair-embeddings: använder Sprint 04:s `_embeddings.json` istället för embedding-API (sprint-planen specificerade inte källa).
- Task 16.2 "alla 15 stacks har uppdaterade templates": inga stack-specifika template-filer finns i repot — generation sker in-context via SKILL.md. Marker-formatet är dokumenterat kanoniskt i `SKILL.md` Stage 5 + refererat från stack-guidelines. Alla 15 stacks pekar implicit hit.

**Avvikelser mot DoD:**

- "10-prompt benchmark efter 5 explicita facts: ≥ 30 % selections respekterar facts" — benchmark-mätpunkten kräver runner-utbyggnad (passera facts-snapshot till generate-anrop per prompt). Skjuts till Sprint 06 som första item. Injekt-hooken är testad manuellt att facts når `additionalContext` med rätt score-tabell.
- "results/sprint-05-comparison.md publicerad" — blockad av ovanstående.
- "Benchmark-score oförändrad eller bättre" — kan inte mätas utan runner-utbyggnaden.

**Leveranser utöver plan:**

- `hooks/scripts/inject-taste-context.mjs` — sprint-planen beskrev injiceringen som runtime-logik men satte den inte i en konkret fil. Den blev en separat hook för att separera capture (update-taste) från read/inject — gör opt-out-ytan binär (ett enda env-flagga) och gör hook-ordningen explicit.
- `docs/taste-privacy.md` — utökad utöver Task 16.3:s kravlista med no-network-garanti, security posture och export/import-guide.

**Kvarstående beslut för Sprint 06-ägaren:**

1. SDK-adapter (kvar från Sprint 01/02) — när denna kommer, byt `extractor.extractFactsFromTurn` och `harvest.classify` till Haiku-calls via samma `--llm`-seam som `build-style-embeddings.mjs` etablerade.
2. Benchmark-runner-utbyggnad för fact-adherence-mätning.
3. Aging-schemaläggning — dagens `/visionary-taste age` är manuell; bör vävas in i ett `SessionStart`-hook med veckovis stamp.
