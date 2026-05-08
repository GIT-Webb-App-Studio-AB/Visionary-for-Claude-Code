# Sprint 21 — Constraint-Injection & Coined Styles: anti-katalog-läget

**Vecka:** 33–34
**Fas:** 10 — Generativ diversitet
**Items:** 38, 39
**Beräknad tid:** 8 dagar
**Mål:** Tvinga generation att producera oväntade former via constraint-injection (40+ atomära regler som "no-rectangles", "single-color", "asymmetry-only"). Komplettera med coined-styles-promotion: när användaren accepterar samma blend (sprint 17) 3+ gånger, promota till officiell katalog-stil med auto-genererad markdown. Visionary blir självväxande.

Wild idea: "Generera en hero-section, men inga rektanglar får finnas" producerar något du aldrig sett. Constraints är ofta starkare creative-driver än stilval. Och om jag som användare alltid blandar swiss+liminal till 70/30 — låt det bli "swiss-liminal" som egen stil i min privata katalog efter 3 acceptanser.

## Scope

- Item 38 — Constraint-injection: katalog (40+ atomära regler), pipeline-stage 2.6, validator-pass post-generation, retry-budget 3 med drop-on-fail.
- Item 39 — Coined-styles-promotion: persistens av accepterade blends, threshold-baserad promotion till `styles/extended/`, auto-naming via Haiku-batch, `/visionary-coined` management-command.

## Pre-flight checklist

- [ ] Sprint 17 mergad — blend-foundation (slerp + token-resolver) stable; coined-promotion bygger direkt på blend-recept-formatet
- [ ] Sprint 5 Haiku-batch-stub aktiv — auto-naming återanvänder samma motor som style-embeddings
- [ ] `skills/visionary/styles/_embeddings.json` är current
- [ ] Feature-branch: `feat/sprint-21-constraints-coined`

---

## Task 38.1 — Constraint-katalog [L]

**Fil:** `skills/visionary/constraints.md` (ny) + `skills/visionary/constraints/` (40 enskilda constraint-filer)

**Vad det gör:** Etablerar en katalog med ~40 atomära designregler där varje regel är en testbar invariant, inte en stil-bias. En constraint är en *hård negation* eller *hård tvång* som omformar generation-rymden: "ZERO rectangles" är inte "prefer organic forms" — det är en post-generation-validerbar invariant.

**Schema per constraint (YAML-fil):**
```yaml
id: no-rectangles
category: form  # form|color|typography|layout|motion
css_rules:
  - "border-radius: 50% 30% 70% 40% / 60% 30% 70% 40% (organic blob)"
  - "clip-path: polygon(...) acceptabelt"
invariants:
  - "ZERO elements with computed border-radius < 12px AND aspect closest to rectangle"
conflict_set: ["pixel-perfect-grid", "swiss-rationalism-strict"]
rationale: "Forces designer to think in organic forms..."
examples: ["See Bruno Simon 2026 portfolio"]
```

**Steg:**
1. Skriv schema-doc `constraints.md` som förklarar fält, kategorier, conflict-set-syntax.
2. 40 constraints över 5 kategorier:
   - **form** (8): no-rectangles, single-shape, fractured-edges, viewport-bleeds, text-as-shape, no-icons, sculptural-only, anti-card.
   - **color** (8): single-color, monochrome-only, no-gradients, max-3-colors, complementary-only, desaturated-only, neon-on-black, paper-only.
   - **typography** (8): single-typeface, monospace-headlines, all-italic, vertical-only, broken-baselines, type-as-image, no-uppercase, weight-200-only.
   - **layout** (8): asymmetry-only, broken-grid, every-section-breaks, no-center, full-bleed-mandatory, off-screen-anchors, diagonal-only, vertical-stack-only.
   - **motion** (8): no-transitions, infinite-loop-mandatory, scroll-driven-only, paused-by-default, gesture-only, parallax-extreme, easing-overshoot, motion-as-content.
3. Validator-rules per constraint: DOM-traversal-checks som kan exekveras via Playwright `browser_evaluate` och returnera `{passed, evidence}`.
4. Conflict_set för minst 15 constraints (de som direkt motsäger katalogstilar).

**AC:**
- 40 constraints med fullt schema validerade mot `constraints.md`
- Conflict_set definierat för minst 15 av dem
- Kategorierna täcker alla 5 dimensioner
- Validator-rule-syntax dokumenterad och testbar

---

## Task 38.2 — Constraint-injection i pipeline [M]

**Fil:** `hooks/scripts/lib/constraints/inject.mjs` (ny) + uppdatering i `SKILL.md`

**Vad det gör:** Ny pipeline-stage 2.6 (efter blend i sprint 17, före generation): vid `--constrain` flagga, sample 1–3 icke-konfliktande constraints, injicera som hårda invarianter i Design Reasoning Brief och i generation-prompten.

**Steg:**
1. Sampling-algoritm: `sampleConstraints(n, mode)` — `random.choice` respekterande `conflict_set`. Backtrack om ingen kombination går att uppfylla.
2. Prompt-injection: lägg constraints som `MUST hold` i Design Reasoning Brief, inklusive `rationale` så modellen förstår *varför*.
3. Trace-event `constraints_injected` med `{ids: [...], rationale: [...], sampled_at: ISO}`.
4. CLI: `--constrain` autoselect (1–3 random) eller explicit `--constrain "no-rectangles, single-color"`.
5. Backwards-compat: ingen flagga → ingen injection (existerande generation oförändrad).

**AC:**
- Sampling respekterar `conflict_set` — 10 körningar har 0 konflikter
- Constraints synliga i prompt under generation
- Trace-event loggas med fullständigt payload
- Test: explicit `--constrain "X, Y"` där X+Y är konfliktande → fail-fast med tydligt error

---

## Task 38.3 — Constraint-validator [L]

**Fil:** `hooks/scripts/lib/constraints/validate.mjs` (ny)

**Vad det gör:** Post-generation: kör validator-rules per constraint mot generated DOM/CSS via Playwright `browser_evaluate`. Om en constraint bröts: retry-budget 3, sedan drop offending constraint och flag i output. Detta är ryggraden i hela mekanismen — utan validator är constraints bara prompt-vibe, inte invarianter.

**Steg:**
1. Per-constraint validator-funktion: DOM-traversal, computed-style-check, returnerar `{passed: bool, evidence: string}`.
2. Aggregator `validateAll(constraints, page)` som kör alla aktiva constraints och returnerar matrix.
3. Retry-loop: vid fail → escalation-prompt med konkret evidence ("element X has border-radius 4px, constraint requires ≥12px") → regen → re-validate.
4. Trace-event `constraint_validation` med `{id, passed, evidence, attempt}`.
5. Drop-on-fail efter 3 attempts: ta bort constraint från active-set, flagga i output, logga `constraint_dropped`.

**AC:**
- Validator-funktion existerar för alla 40 constraints
- Test 5 PASS-fixtures + 5 FAIL-fixtures för subset (10 constraints à 10 fixtures = 100 tester)
- Retry-loop fungerar e2e (simulerad fail → corrective prompt → pass)
- Drop-mekanism aktiveras efter exakt 3 attempts

---

## Task 38.4 — Coined-styles-promotion [M]

**Fil:** `hooks/scripts/lib/coined-styles.mjs` (full impl, sprint 17 hade stub)

**Vad det gör:** När en blend accepteras (signal från sprint 17/sprint 5 taste-flywheel), persistera till `taste/coined-styles.jsonl`. Vid 3+ acceptanser av samma blend (≥85% vector-similarity), promota till `styles/extended/coined-<hash>-<auto-name>.md`. Auto-namn via Haiku-batch.

**Steg:**
1. Persistens-schema:
   ```jsonl
   {"hash": "...", "vector": [8D], "anchor_recipe": [{id, weight}], "accepted_count": N, "first_seen": ISO, "last_seen": ISO}
   ```
2. Threshold-check: `count ≥ 3 AND last_seen − first_seen ≥ 7 days` (mognad-gate mot user-noise i samma session).
3. Auto-name-generation via Haiku: `prompt = "Given this 8D blend vector + 3 anchor IDs, return a 2-word name"`. Returnera `<adj>-<noun>` form (t.ex. "calm-arcade", "feral-grid").
4. Auto-markdown-skapelse från template: projicera vector → palette/typografi/motion-sektioner via samma resolver som sprint 17.
5. Index-uppdatering: `skills/visionary/styles/_index.json` och `_embeddings.json` får ny entry automatiskt.
6. Coined styles bor i `${CLAUDE_PLUGIN_DATA}` (per sprint 15 storage-konvention), inte i project repo.

**AC:**
- Test: 3 simulerade acceptanser av samma blend → fil skapas under `styles/extended/`
- Auto-namn är distinkt från katalog-stil-namn (case-insensitive uniqueness check)
- Markdown validerar mot existerande style-format
- Mognad-gate håller: 3 acceptanser inom 1 dag → ingen promotion
- Index-update sker atomärt (skydd mot race-conditions vid parallella sessions)

---

## Task 38.5 — `/visionary-coined` management command [S]

**Fil:** `commands/visionary-coined.md` (ny)

**Vad det gör:** Användaren kan inspektera, omdöpa och kasta ut sina coined styles utan att behöva editera filer manuellt.

**Sub-commands:**
- `/visionary-coined list` — visa alla promoverade coined styles med count + first/last seen
- `/visionary-coined view <id>` — visa full markdown + recipe
- `/visionary-coined rename <id> <new-name>` — uppdatera filnamn + index
- `/visionary-coined eject <id>` — ta bort från `styles/extended/`, behåll i taste-history (för möjlig re-promotion)

**AC:**
- Command-doc + alla 4 sub-commands fungerar
- `eject` är reversibel (record stays in `taste/coined-styles.jsonl`)
- `rename` uppdaterar både fil och index atomärt

---

## Task 38.6 — Tester [M]

**Fil:** `hooks/scripts/lib/constraints/__tests__/*.test.mjs`, `hooks/scripts/lib/__tests__/coined-styles.test.mjs`

**Coverage:**
- Sampling: 100 körningar respekterar `conflict_set`
- Conflict-resolution: explicit konfliktande input → fail-fast
- Validators: subset (10 constraints × 10 fixtures = 100 fall)
- Coined-promotion-logic: threshold + mognad-gate
- Auto-name-mock: Haiku-call mockad, verifiera prompt-format
- Index-update atomicity (parallella writes)

**AC:**
- `node --test` grön
- ≥80 % coverage på `lib/constraints/` och `lib/coined-styles.mjs`

---

## Task 38.7 — Dokumentation [S]

**Fil:** `docs/constraints.md` (ny), `docs/coined-styles.md` (ny)

**Innehåll:**
- `constraints.md`: katalog med exempel-output per kategori, hur man skriver en ny constraint (PR-flöde), hur conflict-sets resoneras, validator-DSL.
- `coined-styles.md`: hur promotion fungerar, threshold + mognad-rationale, hur edit/rename/eject fungerar, integritet (allt bor i `${CLAUDE_PLUGIN_DATA}`, inte i project repo).

**AC:**
- Båda docs reviewed
- Konkreta exempel per constraint-kategori
- Storage-policy klart: coined styles är *user-private*, inte project-shared

---

## Benchmark-verifiering

**Fil:** `results/sprint-21-constraints-coined.md`

**Mätningar:**
- 30 prompts × constraint vs no-constraint: visuell distinktion via DINOv2-cosine (förvänta ≥0.5 spread)
- Coined-promotion-flöde: simulera 3 acceptanser → verifiera fil skapas korrekt + index uppdateras
- Validator FP-rate: 100 fixtures, ≤5 % false-positives
- Constraint-LLM-comply-rate: andel generations som passerar validator vid första försöket

**AC:**
- Constraints producerar synligt mer divers output (DINOv2-cosine ≥0.5)
- Coined-promotion fungerar e2e
- Validator-FP ≤5 %

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| Constraint-validators FP-rate hög på edge-case-DOMs | Hög | Medel | Test-fixtures-bibliotek + tunable strict-mode per constraint |
| Coined auto-namn ger stötande/genériska namn | Medel | Låg | Profanity-filter + manuell rename via `/visionary-coined` |
| Coined styles fyller disk när taste evolverar | Låg | Låg | LRU-eviction efter 100 coined; threshold-config |
| Constraint-LLM-comply-rate <70 % (modellen ignorerar invariants) | Medel | Hög | Retry-budget 3, escalation-prompt med explicita exempel, fallback drop |
| Coined promotion triggas på user-noise (snabba acceptanser i samma session) | Medel | Medel | Mognad-threshold 7 dagar mellan första och tredje acceptans |

---

## Definition of Done

- [ ] Alla tasks (38.1–38.7) klara
- [ ] 40 constraints + validators + conflict-sets
- [ ] Pipeline-stage 2.6 + retry-budget 3 + drop-on-fail
- [ ] Coined-promotion + auto-naming + atomär index-update
- [ ] `/visionary-coined` med 4 sub-commands
- [ ] Tester gröna, ≥80 % coverage
- [ ] `results/sprint-21-constraints-coined.md` publicerad
- [ ] 2 docs publicerade
- [ ] Mergad till `main`

## Amendments

_Tomt._
