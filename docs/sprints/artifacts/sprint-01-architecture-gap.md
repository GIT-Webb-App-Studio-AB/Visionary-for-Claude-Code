# Sprint 01 — Architecture gap

**Datum:** 2026-04-22
**Status:** Blocker identifierad vid kickoff. Scope reducerad via amendment.

## Sammanfattning

Sprint 01:s plan förutsätter en **direkt Anthropic SDK-integration** i `benchmark/adapters/`. Den finns inte. Nuvarande `claude-headless.mjs` är en CLI-wrapper som spawnar `claude -p <prompt>` via `execFile` — Claude Code CLI styr selv cache, modellval och request-struktur internt och exponerar inget API för fine-grained kontroll.

Detta gör 5 av 8 tasks oimplementerbara utan en prerequisite-refaktor som inte själv ligger i sprintens scope.

## Bevis

Granskning 2026-04-22 på commit `0849789` (branch `main`):

- `benchmark/adapters/claude-headless.mjs` importerar `node:child_process` och använder `execFile(BIN, ['-p', promptText, …])`. Ingen referens till `@anthropic-ai/sdk`, `messages.create`, `cache_control`, eller `usage.cache_*`-fält.
- Inget `package.json` i repo-rooten. Ingen npm-dep-tree alls. Alla befintliga scripts kör på ren Node stdlib.
- `grep -l 'anthropic|cache_control|messages\.create' benchmark/adapters/*.mjs` → tom match.

## Vilka tasks är blockade och varför

| Task | Beroende | Status |
|---|---|---|
| 1.1 — Kartlägg request-shape | Logga faktisk Anthropic API-payload | ❌ Blockad: CLI exponerar bara stdin-prompten, inte den upstream-payloaden efter att Claude Code har injicerat system prompt, skill-laddning, hook-context m.m. |
| 1.2 — Designa cache-pyramid | SDK-block-array med `cache_control` | ❌ Blockad: kan inte sätta cache-breakpoints på CLI-input |
| 1.3 — Implementera cache_control | Samma som 1.2 | ❌ Blockad |
| 1.4 — `build-styles-index.mjs` | Filsystem-arbete | ✅ **Levererad i denna sprint** |
| 1.5 — Selection-algoritm läser indexet | Dokumentation + (sekundärt) runtime-filter | ⚠️ **Dokumentation levererad**; runtime-filter kräver SDK-adapter (Sprint 02) |
| 1.6 — Haiku-adapter för klassificering | Separat Anthropic API-call per klassificeringssteg | ❌ Blockad: `claude -p`-anrop är hela pipelinen; kan inte rikta enskilda LLM-calls mot olika modeller utan att byta ut hela CLI-flödet mot SDK |
| 1.7 — Cache-hit-metric i runner | Läsa `usage.cache_*` från Anthropic response | ❌ Blockad: CLI-stdout innehåller den genererade koden, inte token-usage-metadata |
| 1.8 — Pre/post-benchmark | Kräver 1.2, 1.3, 1.6, 1.7 | ❌ Blockad: inga cache/cost-metrics att jämföra |

## Alternativ som övervägdes

**A. Refaktorera till SDK först** (inte i sprintens scope):  
Lägg till `package.json`, `@anthropic-ai/sdk`, skriv ny `anthropic-sdk.mjs`-adapter bredvid existerande CLI-adapter. ~1–2 dagars arbete före Task 1.1 kan börja. Påverkar även hur adaptrarna till `frontend-design` och `ui-ux-pro-max` ska jämföras — idag är alla adaptrar CLI-baserade, så en SDK-adapter gör jämförelsen ojämn.

**B. Kör bara det som fungerar (valt alternativ):**  
Leverera Task 1.4 + docs-delen av Task 1.5. Markera övriga tasks som uppskjutna. Sprint 02 får lösa SDK-adaptern som prerequisite innan den kan bygga vidare. Se amendment i `sprint-01-cache-arkitektur.md`.

**C. Omforma cache-arbetet till prompt-nivå:**  
Sprintens effekt (minimera inmatade tokens) kan delvis uppnås genom att krympa vad vi stoppar in i `claude -p`-prompten. Styles-index är en del av det. Detta är nu scope för Sprint 02 eller senare; sprint 01 levererar indexet som förutsättning.

## Leverans i denna sprint

- `scripts/build-styles-index.mjs` — 202 styles indexerade, deterministisk, idempotent, `--check`-flagga för CI-drift-guard.
- `skills/visionary/styles/_index.json` — 70.9 KB minifierad JSON, 359 B/entry i snitt, max 459 B/entry (under 500 B-cap). Totalstorleken (70.9 KB) överskrider sprintens 25 KB-mål — se amendment för motivering.
- `skills/visionary/context-inference.md` — ny sektion "Styles Index" som dokumenterar schema, kommandon och hur selection-algoritmens Steg 1–3 nu kan vara rena filter-operationer.

## Rekommenderad Sprint 02-justering

Lägg till som Task 2.0 (prerequisite):

- Skapa `benchmark/adapters/claude-sdk.mjs` som parallell adapter till `claude-headless.mjs`
- Lägg `package.json` + `@anthropic-ai/sdk` i repot (eller i `benchmark/`-subpaket för att isolera dep-kostnaden)
- Beslutspunkt: ska alla benchmark-adaptrar (visionary/frontend-design/ui-ux-pro-max) röra sig mot SDK, eller ska cache/cost-arbetet leva parallellt med CLI-pipelinen för faktisk skill-användning?

När Task 2.0 är klar: återöppna Sprint 01 tasks 1.1, 1.2, 1.3, 1.6, 1.7, 1.8 som Sprint 02 scope.
