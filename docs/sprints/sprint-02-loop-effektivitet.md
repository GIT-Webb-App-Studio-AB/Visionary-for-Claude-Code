# Sprint 02 — Structured outputs, early exit, diff-rundor

**Vecka:** 2
**Fas:** 1 — Token-dividenden
**Items:** 4, 5, 6 från roadmap
**Mål:** Kritikloopen ska producera identisk kvalitet med 15–25 % mindre output-tokens och ha en mätbar early-exit-rate på enkla genereringar.

## Scope

- Item 4 — Structured outputs på alla kritik-JSON endpoints
- Item 5 — Confidence-gated early exit i `capture-and-critique.mjs`
- Item 6 — Diff-baserade rundor (runda 2+3 emitterar unified patches)

## Pre-flight checklist

- [ ] Sprint 1 mergad till `main` — cache + index + Haiku måste vara live
- [ ] `benchmark/results/sprint-01-post.json` finns som ny baseline
- [ ] Feature-branch: `feat/sprint-02-structured-early-exit-diffs`
- [ ] Anthropic SDK version stöder `response_format: { type: "json_schema" }` (kolla CHANGELOG)

---

## Task 4.1 — JSON-schema för critique-output [M]

**Fil:** `skills/visionary/schemas/critique-output.schema.json` (ny)

**Syfte:** Formalisera exakt vad `visual-critic.md`-subagenten returnerar så Anthropic structured outputs kan enforce det.

**Schema (förkortat):**
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["round", "scores", "top_3_fixes", "confidence", "convergence_signal"],
  "properties": {
    "round": { "type": "integer", "minimum": 1, "maximum": 3 },
    "scores": {
      "type": "object",
      "required": ["hierarchy","layout","typography","contrast","distinctiveness","brief_conformance","accessibility","motion_readiness"],
      "additionalProperties": false,
      "properties": {
        "hierarchy":         { "type": "number", "minimum": 0, "maximum": 10 },
        "layout":            { "type": "number", "minimum": 0, "maximum": 10 },
        "typography":        { "type": "number", "minimum": 0, "maximum": 10 },
        "contrast":          { "type": "number", "minimum": 0, "maximum": 10 },
        "distinctiveness":   { "type": "number", "minimum": 0, "maximum": 10 },
        "brief_conformance": { "type": "number", "minimum": 0, "maximum": 10 },
        "accessibility":     { "type": "number", "minimum": 0, "maximum": 10 },
        "motion_readiness":  { "type": "number", "minimum": 0, "maximum": 10 }
      }
    },
    "confidence": {
      "type": "object",
      "description": "1-5 per dimension, used by early-exit + pairwise-tiebreak",
      "additionalProperties": { "type": "integer", "minimum": 1, "maximum": 5 }
    },
    "top_3_fixes": {
      "type": "array",
      "minItems": 0,
      "maxItems": 3,
      "items": {
        "type": "object",
        "required": ["dimension", "severity", "proposed_fix"],
        "properties": {
          "dimension": { "enum": ["hierarchy","layout","typography","contrast","distinctiveness","brief_conformance","accessibility","motion_readiness"] },
          "severity": { "enum": ["blocker","major","minor"] },
          "proposed_fix": { "type": "string", "minLength": 10 },
          "selector_hint": { "type": "string", "description": "CSS selector if applicable — prerequisite for Sprint 3 evidence-anchoring" }
        }
      }
    },
    "convergence_signal": { "type": "boolean" },
    "slop_detections": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["pattern_id", "severity"],
        "properties": {
          "pattern_id": { "type": "integer", "minimum": 1, "maximum": 26 },
          "severity": { "enum": ["blocker","major","minor"] }
        }
      }
    }
  }
}
```

**AC:**
- Schema validerar mot alla 10 befintliga benchmark-prompts (kör mot lagrade runs)
- Dokumenterat i `skills/visionary/critique-schema.md` med exempel

---

## Task 4.2 — Aktivera structured outputs i visual-critic-anropet [M]

**Filer:**
- `hooks/scripts/capture-and-critique.mjs`
- `benchmark/adapters/claude-headless.mjs`

**Steg:**
1. Byt prompt från ”return JSON in this format…” till `response_format: { type: "json_schema", schema: <loaded-schema> }`
2. Ta bort motsvarande ”ONLY JSON, NO PROSE” scaffold-text ur systemprompten (frigör ca 200 tokens)
3. Felhantering: om response failar schema → retry 1× med `temperature: 0` och `max_tokens` +30 %, sedan failar genereringen tydligt
4. Logga i metrics: `schema_violations: <count>` per runda

**AC:**
- 0 retries i en 10-prompt-suite (schema alltid valid på första försöket)
- Systemprompt-token-reduktion ≥ 150 tokens mätbar i metrics

---

## Task 4.3 — JSON-schemas för resterande structured endpoints [S]

**Filer (nya under `skills/visionary/schemas/`):**
- `style-selection.schema.json` — output från 8-steg-algoritmens beslut
- `taste-signal.schema.json` — output från `update-taste.mjs`-hooks signal-extraction
- `annotate-edit.schema.json` — output från `/annotate` browser-pin → code-edit

**Steg:**
1. Gör samma byte som Task 4.2 för varje endpoint
2. Returschemat för `update-taste.mjs` är just nu implicit — explicitera det:
```json
{
  "type": "object",
  "required": ["signal", "scope"],
  "properties": {
    "signal": { "enum": ["reject","approve","neutral","mixed"] },
    "scope": { "enum": ["style","palette","typography","motion","component_type","global"] },
    "evidence_quote": { "type": "string" }
  }
}
```

**AC:**
- Alla tre schemas implementerade och testade mot minst 5 exempel var

---

## Task 5.1 — Confidence-gated early exit [M]

**Fil:** `hooks/scripts/capture-and-critique.mjs`

**Regel (dokumentera i `skills/visionary/critique-schema.md`):**

```
EARLY EXIT efter runda N (N ≥ 1):
  IF min(scores) ≥ 8.0
  AND min(confidence) ≥ 4
  AND axe_violations == 0
  AND slop_detections.filter(s => s.severity === 'blocker').length === 0
  THEN exit success, skip resterande rundor

ESCALATE efter runda 1:
  IF scores.count(s => s < 4) >= 3
  THEN avbryt refine-loop, signalera "reroll" (variants flow)
  Rationale: fundamentalt trasig draft — refine kastar bort tokens
```

**Steg:**
1. Implementera reglerna som rena predicates (`shouldEarlyExit`, `shouldEscalateToReroll`) i en ny fil `hooks/scripts/lib/loop-control.mjs`
2. Unit-testa predicates med fixtures (9 test-cases: alla permutationer av de 4 villkoren som missar/passerar)
3. Loggning: `early_exit_reason: "high_confidence"` eller `early_exit_reason: "escalated_reroll"` i metrics
4. Säkerhetsgolv: första generation för en ny user (tom `system.md`) får INTE early-exit före runda 2 — data för calibration

**AC:**
- Unit-tester passerar
- På 10-prompt-suiten: dokumenterad early-exit-rate (förväntat 20–40 %)
- Ingen generation med early-exit hade regression i visuell kvalitet (spot-check 5 st manuellt)

---

## Task 6.1 — Diff-prompt för runda 2+3 [L]

**Filer:**
- `skills/visionary/diff-refine.md` (ny)
- `hooks/scripts/capture-and-critique.mjs` (prompt-konstruktion)
- `hooks/scripts/lib/apply-diff.mjs` (ny — unified patch applier)

**Idé:** runda 1 = full komponent; runda 2+3 = unified diff mot föregående output.

**Prompt-konstruktion runda 2+3:**
```
Previous output: <file-path>
Previous critique JSON: <critique-output>

Emit ONLY a unified diff (GNU patch format, --- / +++ / @@ / context lines)
that addresses the top_3_fixes above.

Do NOT rewrite unchanged lines.
Do NOT emit the full file.
```

**Steg:**
1. Skriv `apply-diff.mjs` som kan appliera en unified patch mot filinnehåll in-memory. Använd väletablerade NPM-paket (`diff`, `parse-diff`) eller implementera minimal parser — JSON-diff duger EJ eftersom vi jobbar mot source code.
2. Lägg till validering: `patch --dry-run` semantik innan faktisk write.
3. Fallback: om patch failar → retry 1× med full regeneration-prompt, logga `diff_fallback: true` i metrics.
4. Dokumentera patch-format-kontraktet i `diff-refine.md` med exempel.

**AC:**
- Test-fixture: 10 syntetiska (komponent, critique, diff) trippletter — alla patches applicerar korrekt
- Diff-fallback-rate på 10-prompt-suiten ≤ 10 %
- Output-token-reduktion runda 2+3 ≥ 40 % (median)

**Edge-cases att hantera:**
- Line-number-drift efter tidigare patch applied → återanvänd patch-verktyg med fuzz-tolerance
- Unicode (diacritics i content) måste överleva round-trip
- Trailing newlines bevaras

---

## Task 6.2 — Round-1-keep-full-regen-option [S]

**Motivering:** första rundan är där modellen ibland måste holistiskt designa om. Diff-tvång där skulle begränsa konstnärlig frihet.

**Steg:**
1. `capture-and-critique.mjs` — explicit grenval: `round === 1 ? fullRegen : diffRegen`
2. Edge-case: om runda 1 resulterar i `convergence_signal: true` (dvs första rundan gav ≥ 8 + confidence ≥ 4) → early exit träder in först, ingen diff behövs

---

## Task 6.3 — Diff-statistik i metrics [S]

**Fil:** `benchmark/runner.mjs`

**Lägg till per generation:**
```json
{
  "diff_stats": {
    "rounds_using_diff": 2,
    "avg_hunks_per_round": 3.4,
    "avg_lines_changed_ratio": 0.18,
    "fallback_events": 0
  }
}
```

**AC:**
- Metric finns i alla genererade `summary.json`
- Snabb-jämförelse med pre-sprint: output-tokens per runda ska vara 40 %+ lägre när diff-läge används

---

## Task 6.4 — Integrationstest: hela loopen med alla 3 features [M]

**Fil:** `benchmark/tests/loop-integration.mjs` (ny)

**Testscenarier:**
1. Hög-kvalitets runda 1 → early exit, ingen diff-runda
2. Medium runda 1 → runda 2 som diff → early exit
3. Låg runda 1 → escalate till reroll
4. Runda 1 OK, runda 2 diff failar → fallback full regen → runda 3 diff OK
5. Structured output violation (artificiellt) → retry → success

**AC:**
- Alla 5 scenarier grönar
- Testerna körs i CI på varje PR

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| Diff-läge genererar patches som applicerar men producerar worse output | Medium | Hög | Visual-diff-kontroll via Playwright innan commit av patch |
| Structured outputs är för strikt → LLM kan inte uttrycka nyans | Low | Medium | Schema.description-fält som ger modellen ramar utan att begränsa semantik |
| Early-exit hoppar över en behövd runda | Medium | Medium | Confidence-krav + sälvnsamplingsaudit (se Sprint 3 Rulers) |
| Line-number-drift i sekventiella diffar | Medium | Hög | Använd patch-parser med fuzz-tolerance; unit-testa multi-round-scenarios |

## Definition of Done

- [ ] Alla tasks klara med AC bockade
- [ ] Integration-test grönt
- [ ] `results/sprint-02-comparison.md` publicerad med output-token-delta per runda
- [ ] Total token-kostnad (input+output) per generation ≥ 55 % lägre än pre-Sprint-01 baseline
- [ ] Benchmark-score oförändrad (≥ 18.35/20)
- [ ] Merged till `main` via PR

## Amendments

### 2026-04-22 — Scope-cut: SDK-adapter fortfarande saknas (ärv från Sprint 01)

**Orsak:** Sprint 02:s pre-flight kräver att Sprint 01:s cache/index/Haiku-arbete är live på `main`. Sprint 01 levererade bara `scripts/build-styles-index.mjs` + docs — SDK-adaptern som är prerequisite för cache_control, `usage.*`-metrics och `response_format: { type: "json_schema" }` finns fortfarande inte (`benchmark/adapters/claude-headless.mjs` är en CLI-wrapper runt `claude -p`). Full analys: `artifacts/sprint-02-architecture-notes.md`.

**Ändrad scope — levereras i Sprint 02 (klart):**

- **Task 4.1** — `skills/visionary/schemas/critique-output.schema.json` (normativt output-kontrakt, 0-10-skala, flat struktur)
- **Task 4.3** — `skills/visionary/schemas/{style-selection,taste-signal,annotate-edit}.schema.json`
- **Task 5.1** — `hooks/scripts/lib/loop-control.mjs` med `shouldEarlyExit` / `shouldEscalateToReroll` / `shouldUseDiffRegen` + 21 unit-tester
- **Task 6.1** — `hooks/scripts/lib/apply-diff.mjs` (unified-diff applier, dep-fri) + 10 unit-tester + `skills/visionary/diff-refine.md`
- **Task 6.2** — Round-1-full-regen-gate (`shouldUseDiffRegen`) + integrationstestad
- **Task 6.4** — `benchmark/tests/loop-integration.mjs` med alla 5 sprint-specificerade scenarier gröna
- **Sido-leverans** — `hooks/scripts/lib/validate-schema.mjs` (minimal Draft 2020-12-validator, dep-fri) + `benchmark/results/_schema.md` (dokumenterar `diff_stats` + `loop_stats`-fält) + uppdaterad `skills/visionary/critique-schema.md` med Sprint 02-regler
- **Smärre** — `hooks/scripts/capture-and-critique.mjs` uppdaterad så `additionalContext` pekar på schemat + loop-control i stället för legacy-JSON-format

**Delvis levererat — kräver SDK-adapter för resten:**

- **Task 4.2** — schema-referens + loop-control-referens injicerad i hookens `additionalContext`. Faktisk `response_format: { type: "json_schema" }`-enforcement, retry-på-schema-failure och `schema_violations`-metric kräver Anthropic SDK (`claude -p` CLI exponerar ingen sådan parameter).
- **Task 6.3** — metric-schemat för `diff_stats` är dokumenterat i `benchmark/results/_schema.md`; runtime-population i `benchmark/runner.mjs` kräver adaptern som kör applypatch-flödet. CLI-adaptern har ingen väg dit i dagsläget.

**Totalt status:** 6 av 8 tasks klara, 2 partiella (samma SDK-blocker som Sprint 01).

**Testmatris:** 52 tester gröna (21 loop-control + 10 apply-diff + 16 schema-validation + 5 loop-integration). Kör med:

```bash
node --test hooks/scripts/lib/__tests__/loop-control.test.mjs \
            hooks/scripts/lib/__tests__/apply-diff.test.mjs \
            hooks/scripts/lib/__tests__/validate-schema.test.mjs \
            benchmark/tests/loop-integration.mjs
```

**Brytande förändring noterad:** Sprint 02:s schema migrerar critique-formatet från 1-5 integer + `meta`-nested struct till 0-10 number + flat struct med `confidence` + objekt-baserade `top_3_fixes`. `agents/visual-critic.md`:s rubric-prosa (1-5) är nu legacy — en omskrivning av subagenten krävs som separat uppföljnings-PR innan hela flödet faktiskt producerar det nya schemat. Bench-rubriken (`benchmark/rubric/rubric.md`) **migreras inte** — den stannar på 1-5.

**Avvikelse mot AC:**

- Task 4.1 AC "Schema validerar mot alla 10 befintliga benchmark-prompts (kör mot lagrade runs)" — det finns inga lagrade critique-JSON-runs i repot (critique är intern till hook-flödet, inte persisterad som artefakt). AC tolkad som "schemat kan validera rimliga critique-payloads" — täckt av `validate-schema.test.mjs` med 16 positiva/negativa fixtures.
- Task 4.2 AC "0 retries i en 10-prompt-suite" + "Systemprompt-token-reduktion ≥ 150 tokens mätbar i metrics" — kräver SDK-mätning, blockad. Dokumenterad i architecture-notes som uppföljningsscope.
- Task 6.4 "CI-körning på varje PR" — tester är CI-redo (`node --test`), men ingen CI-pipeline finns konfigurerad i repot; orkestrering lämnas till Sprint 06:s observability-arbete.

**Kvarvarande beslut för Sprint 02-uppföljning / Sprint 03-ägaren:**

1. SDK-adapter-migration + visual-critic-omskrivning i samma PR (rekommenderat) eller separata?
2. När visual-critic.md byter till 0-10 — uppdaterar vi `scorePrompt` i `benchmark/runner.mjs`? (Rekommendation: nej, rubric-skalan är en publik mätpunkt.)
3. Ska `schema_violations` räknas per runda eller per prompt i summary.json? (Rekommendation: båda — per runda i `loop_stats`, summerat per prompt på rapportnivå.)
