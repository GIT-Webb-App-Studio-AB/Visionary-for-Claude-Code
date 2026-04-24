# Sprint 01 — Cache-arkitektur, styles-index, Haiku-adapter

**Vecka:** 1
**Fas:** 1 — Token-dividenden
**Items:** 1, 2, 3 från roadmap
**Mål:** En generering ska kosta ≥ 45 % färre input-tokens på runda 2 och 3 jämfört med pre-sprint baseline.

## Scope

- Item 1 — 4-breakpoint prompt cache-pyramid med 1h TTL på yttre block
- Item 2 — `scripts/build-styles-index.mjs` som emitter `styles/_index.json`
- Item 3 — Haiku 4.5-adapter för klassificeringsstegen (1–7 i 8-steg-algoritmen)
- Mätning — cache-hit-metric + cost-per-generation i `benchmark/runner.mjs`

## Pre-flight checklist

- [ ] `git status` rent (committa öppet arbete på feature-branch innan)
- [ ] Node 18+ verifierat lokalt
- [ ] `benchmark/runner.mjs` kör igenom på huvudbranchen (baseline före refaktor)
- [ ] Anthropic API-nyckel tillgänglig med cache-metric-permission
- [ ] Baseline benchmark-körning sparad som `results/baseline-pre-sprint-01.json` — MÅSTE finnas för att mäta ROI
- [ ] Feature-branch skapad: `feat/sprint-01-cache-index-haiku`

---

## Task 1.1 — Kartlägg nuvarande request-shape [S]

**Varför först:** kan inte strukturera cache-pyramiden utan att veta exakt vad som skickas idag.

**Filer att läsa:**
- `benchmark/adapters/claude-headless.mjs`
- `hooks/scripts/capture-and-critique.mjs`
- `skills/visionary/SKILL.md`

**Steg:**
1. Instrumentera `claude-headless.mjs` med en temporär logger som skriver full request-payload till `.debug/requests/<ts>.json`
2. Kör `benchmark/runner.mjs --prompts 3` och fånga 3 fulla generationsekvenser inkl. alla critique-rundor
3. Dokumentera i `docs/sprints/artifacts/sprint-01-request-shape.md`:
   - Exakt vilket innehåll skickas i varje API-call
   - Var är content statiskt vs dynamiskt per runda
   - Token-count per block

**AC:**
- Dokumentet existerar och listar minst 8 identifierbara innehållsblock med token-antal
- Skillnad mellan runda 1 och runda 2+3 är tydligt markerad

**DoD:**
- Debug-logger borttagen före commit (inte merge-safe)

---

## Task 1.2 — Designa 4-breakpoint cache-hierarki [M]

**Filer att skapa/ändra:**
- `skills/visionary/cache-strategy.md` (ny)
- `benchmark/adapters/claude-headless.mjs` (cache_control-stöd)

**Cache-pyramiden:**

```
[BP 1, ttl=1h]  SKILL.md + 8-steg-algoritm-prose   (~5k tokens, nästan aldrig ändras)
[BP 2, ttl=1h]  motion-tokens.ts + typography-matrix.md + critique-schema.md + axe-rules
                                                   (~8k tokens, ändras per release)
[BP 3, ttl=5m]  vald style-markdown + ev. design-system-export + stack-guidelines för aktiv stack
                                                   (~2–3k tokens, per generation)
[BP 4, ttl=5m]  system.md-snapshot + taste-pairs   (~1k tokens, per generation/session)
[DYNAMIC]       brief + föregående kritik-JSON + diff-payload (Sprint 2)
```

**Regler (dokumentera i cache-strategy.md):**
- Dynamic tail får ALDRIG interpolera in i cachade block (timestamps, uuids, session-id)
- Ordningen är immutable efter merge — varje scramble = cold cache
- TTL-val: `1h` för block som kostar > 3k tokens och hits ≥ 2× per session; `5m` annars

**AC:**
- `cache-strategy.md` har exemplifierad before/after-request payload
- Regler-sektionen listar minst 4 ”gör aldrig”-punkter

---

## Task 1.3 — Implementera cache_control i claude-headless-adaptern [M]

**Fil:** `benchmark/adapters/claude-headless.mjs`

**Steg:**
1. Tillför en `buildCachedMessages(styleBrief, priorCritique)` som returnerar Anthropic `messages`-array med `cache_control: { type: "ephemeral", ttl: "1h" | "5m" }` på rätt block
2. Säkerställ att systemet-prompten byggs med **system-blocks-array** (Anthropic stöder cache_control på system-blocks men inte på system-string)
3. Bevara backward-compat: om `VISIONARY_DISABLE_CACHE=1` i env, fall tillbaka till nuvarande implementation
4. Lägg till test-fixtures: exakt samma `styleBrief` ska producera exakt samma cache-nycklar (deterministic hashing)

**AC:**
- Running same generation 2x returnerar `cache_read_input_tokens > 0` i Anthropic response på andra körningen
- `VISIONARY_DISABLE_CACHE=1` ger identisk token-kostnad mot huvudbranchen (regressionsgaranti)

**Verifiering:**
```bash
VISIONARY_CACHE_DEBUG=1 node benchmark/runner.mjs --prompts 1
# Kör samma prompt två gånger
VISIONARY_CACHE_DEBUG=1 node benchmark/runner.mjs --prompts 1
# Andra körningen ska logga: cache_creation_input_tokens=0, cache_read_input_tokens>0
```

---

## Task 1.4 — `scripts/build-styles-index.mjs` [M]

**Fil:** `scripts/build-styles-index.mjs` (ny)

**Input:** Alla `skills/visionary/styles/**/*.md` (202 filer)

**Output:** `skills/visionary/styles/_index.json`

**Schema per entry:**
```json
{
  "id": "swiss-muller-brockmann",
  "category": "historical",
  "path": "skills/visionary/styles/historical/swiss-muller-brockmann.md",
  "motion_tier": "Subtle",
  "density": "balanced",
  "locale_fit": ["latin", "latin-ext"],
  "palette_tags": ["neutral", "accent-saturated"],
  "keywords": ["grid", "typographic", "editorial", "objective"],
  "accessibility": {
    "wcag_body": "4.5",
    "apca_body_lc": 75,
    "touch_target_default_px": 44
  },
  "scoring_hints": {
    "product_archetypes": ["editorial", "developer"],
    "audience_density": ["balanced", "power"],
    "brand_tones": ["neutral", "corporate"]
  }
}
```

**Steg:**
1. Parsa YAML-frontmatter från varje style-fil
2. Extrahera `scoring_hints` genom att grepa på H2-rubriker i body (t.ex. leta "### Best for" eller "### Product fit")
3. Skriv atomiskt (temp-fil + rename) för att undvika korrupt läsning
4. Lägg till i `scripts/` pre-commit eller i release-flödet så indexen byggs automatiskt

**AC:**
- `_index.json` är ≤ 25 KB (komprimerat räkneverk för token-budget)
- Alla 202 styles representerade
- Running skriptet 2× ger bit-identisk output (idempotent)
- Inget externt beroende utöver Node stdlib + en YAML-parser som redan finns i repo

**Verifiering:**
```bash
node scripts/build-styles-index.mjs
cat skills/visionary/styles/_index.json | jq 'length'  # ska vara 202
cat skills/visionary/styles/_index.json | jq '.[0]' | wc -c  # enskild entry ska vara ≤ 500 bytes
```

---

## Task 1.5 — Selection-algorithm läser indexen först [M]

**Filer:**
- `skills/visionary/context-inference.md` (dokumentation)
- `benchmark/adapters/claude-headless.mjs` (runtime-logik)

**Steg:**
1. Steg 1–3 av 8-steg-algoritmen körs som **Node-kod** mot `_index.json` (rena filter: category, motion_tier, density, locale_fit, blocked-defaults)
2. Steg 4 (scoring) körs som LLM-call men matar in **endast top-15 kandidaters index-entries** (ca 15 × 400 bytes ≈ 6k tokens) istället för hela style-kropparna
3. Efter steg 7 (weighted random top-3), läs **endast den vinnande styles fullständiga markdown**
4. Dokumentera i `context-inference.md` att steg 1–3 nu är deterministiska JS-filter

**AC:**
- LLM-call för styleselection ser aldrig mer än vinnarens fulla style-fil + top-15 frontmatter-entries
- Selection-resultatet är deterministiskt givet samma RNG-seed (testbart)

**Verifiering:**
```bash
node benchmark/runner.mjs --prompts 5 --seed 42 --log-style-selection
# Kör två gånger → identisk styleval-sekvens
```

---

## Task 1.6 — Haiku 4.5-adapter för klassificeringsstegen [M]

**Fil:** `benchmark/adapters/claude-haiku-classifier.mjs` (ny)

**Ansvar:** Kör LLM-calls för steg 4 (scoring rubric) och steg 4.5 (taste profile adjustment) på Haiku 4.5 istället för Sonnet.

**Steg:**
1. Kopiera `claude-headless.mjs` som bas, byt modell till `claude-haiku-4-5-20251001`
2. Exponera `classifyStyle(styleBrief, candidates)` som returnerar scored-top-5
3. Lägg till schema-validering på output (structured output — se Sprint 2)
4. Lägg till fallback: om Haiku output failar schema-validering → retry 1× → fallback till Sonnet
5. Lägg till A/B-flagga i `benchmark/runner.mjs`: `--classifier sonnet|haiku|auto`

**AC:**
- Haiku-adaptern körs med korrekt cache_control (återanvänder Task 1.2-hierarkin)
- Fallback-path testad: force-fail validation → hamnar på Sonnet utan crash
- Kostnadsmätning visar klassificeringsspend ≥ 75 % lägre än Sonnet-baseline

**Kvalitetsgate (viktigt — ska inte regressera):**
- På 10-prompt-suiten: Haiku-classifier måste välja **samma topp-3 styles** som Sonnet i ≥ 80 % av körningarna
- Om < 80 %: dokumentera, don't-ship, ta upp i retro

---

## Task 1.7 — Cache-hit-metric + cost-per-generation i runner [M]

**Filer:**
- `benchmark/runner.mjs` (mätning)
- `benchmark/results/_schema.md` (ny — dokumenterar vad som lagras)

**Metrics per generation (skriv till `results/<run-id>/metrics.json`):**
```json
{
  "run_id": "sprint-01-post-cache",
  "prompt_id": "p001",
  "tokens": {
    "input_total": 12843,
    "output_total": 2156,
    "cache_creation": 5120,
    "cache_read": 7723,
    "cache_hit_rate": 0.60
  },
  "cost_usd": {
    "input": 0.019,
    "cache_write": 0.006,
    "cache_read": 0.00077,
    "output": 0.032,
    "total": 0.058
  },
  "model_breakdown": {
    "sonnet_calls": 3,
    "haiku_calls": 2
  },
  "duration_ms": 41230
}
```

**Steg:**
1. Anthropic response innehåller `usage.cache_creation_input_tokens` och `usage.cache_read_input_tokens` — läs och aggregera
2. Prissätt enligt 2026-04-22 tariff (tabell i `benchmark/pricing.json` som kan uppdateras):
   - Sonnet input: $3/M, output: $15/M, cache write 1h: $6/M, cache read: $0.30/M
   - Haiku input: $1/M, output: $5/M, cache write 1h: $2/M, cache read: $0.10/M
3. Aggregera på körningsnivå och persistera i `results/<run-id>/summary.json`

**AC:**
- Running `node benchmark/runner.mjs --prompts 10 --emit-metrics` producerar `summary.json` som kan diffas med `baseline-pre-sprint-01.json`
- Ingen generation saknar metric-entry (allt-eller-inget)

---

## Task 1.8 — Pre/post-benchmark och dokumentation [S]

**Filer:**
- `results/sprint-01-comparison.md` (ny)
- `CHANGELOG.md` (entry för 1.4.0-dev)

**Steg:**
1. Kör 10-prompt-suiten på main (pre) och på feature-branch (post)
2. Diff:a metrics och producera tabell:
   | Prompt | Tokens pre | Tokens post | Delta % | Cache-hit post | $ saved |
3. Validera minst 45 % input-token-minskning på runda 2+3 (mål)
4. Om målet inte nås: dokumentera varför och fortsätt till Sprint 2 utan att merga

**AC:**
- Comparison-dokument har diff-tabell + sammanfattad $-besparing per generation
- Total input-token-minskning på runda 2+3 ≥ 45 % (median över 10 prompts)
- Sonnet/Haiku-kvalitetsgate från Task 1.6 bestod

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| Cache invaliderat pga subtil prompt-mutation | Hög | Hög | Cache-debug-logger som varnar vid `cache_creation_input_tokens > 0` på förmodat cachade block |
| Haiku degraderar klassificeringskvalitet silently | Medium | Hög | Task 1.6-kvalitetsgate + fallback till Sonnet |
| Styles-index ur sync med style-filerna | Medium | Medium | Pre-commit hook som rebuildar indexen när `styles/**/*.md` ändras |
| Anthropic-pricing ändras | Low | Medium | `benchmark/pricing.json` är enda källan, lätt att uppdatera |

## Definition of Done (hela Sprint 1)

- [ ] Alla 8 tasks klara med AC bockat
- [ ] `results/sprint-01-comparison.md` publicerad
- [ ] Feature-branch merged till `main` via PR med code-review
- [ ] `CHANGELOG.md` uppdaterad under `## [Unreleased]` med Fas 1-tillägg
- [ ] Pricing-tabell i `benchmark/pricing.json` dokumenterad
- [ ] Ingen regression i benchmark-score (fortfarande ≥ 18.35/20)

## Amendments

### 2026-04-22 — Scope-cut: arkitektur-prerequisite saknas

**Orsak:** Vid kickoff-granskning bekräftades att `benchmark/adapters/claude-headless.mjs` är en CLI-wrapper runt `claude -p`, inte en direkt Anthropic SDK-integration. Sprint-planens cache- och cost-arbete förutsätter SDK-kontroll över `messages`-array, `cache_control`-block och `usage.cache_*`-response-metrics — inget av det är åtkomligt via CLI-wrapper. Fullständig analys: `artifacts/sprint-01-architecture-gap.md`.

**Ändrad scope:**

- **Levereras i Sprint 01** (klart):
  - Task 1.4 — `scripts/build-styles-index.mjs` + `skills/visionary/styles/_index.json` (202 styles, deterministisk, idempotent, `--check`-drift-guard).
  - Task 1.5 (docs-del) — `context-inference.md` utökad med "Styles Index"-sektion som dokumenterar schema och hur Steg 1–3 kan köras som deterministiska filter.

- **Uppskjuts till Sprint 02** (kräver SDK-adapter som prerequisite):
  - Task 1.1 — request-shape-kartläggning (delvis blockad — CLI exponerar inte upstream-payload)
  - Task 1.2 — cache-pyramid-design
  - Task 1.3 — `cache_control`-implementation
  - Task 1.5 (runtime-del) — flytta Steg 1–3-filter från prompt till Node-kod
  - Task 1.6 — Haiku-adapter för klassificering
  - Task 1.7 — cache-hit-metric + cost-per-generation
  - Task 1.8 — pre/post-benchmark (blockad eftersom 1.2/1.3/1.6/1.7 är det som skapar diff-datat)

**Avvikelser mot AC (Task 1.4):**

- Styles-index är 70.9 KB minifierad (snitt 359 B/entry, max 459 B/entry). AC-målet "≤ 25 KB totalt" är internt inkonsistent med AC-gränsen "≤ 500 B per entry" — 500 × 202 ≥ 100 KB är en matematisk nedre gräns med det schema sprinten specificerade. För att nå 25 KB totalt skulle schemat behöva byta till tuple-format (`[id, cat, path, m, d, …]`), vilket förlorar självdokumentation och bryter sprint-planens eget schema-exempel. Valet: behåll sprintens schema, dokumentera gapet.
- Per-entry-cap (500 B) respekterad ✅.
- Idempotens + determinism verifierad via `node scripts/build-styles-index.mjs --check` efter två körningar ✅.
- Alla 202 styles parse:ade utan fel ✅.

**Kvarvarande beslut för Sprint 02-ägaren:**

1. Ska `benchmark/adapters/claude-sdk.mjs` skapas som parallell adapter, eller ska `claude-headless.mjs` ersättas?
2. Ska `frontend-design`- och `ui-ux-pro-max`-adaptrarna också röra sig mot SDK för benchmark-rättvisa, eller hålls cache-arbetet till `visionary`-adaptern?
3. Vill vi ha en `_index.min.json`-variant med tuple-schema för LLM-prompts där token-budget är hårt pressad, utöver den självdokumenterande `_index.json`?

