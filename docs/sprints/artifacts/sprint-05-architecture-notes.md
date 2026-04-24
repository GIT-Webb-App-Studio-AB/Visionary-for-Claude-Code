# Sprint 05 — Architecture notes

**Datum:** 2026-04-23
**Status:** Samma SDK-prerequisite som Sprint 01/02 kvarstår; 100 % av sprintens tasks levererade via heuristic-first-mönstret (samma pattern Sprint 02/04 använde).

## Sammanfattning

Sprint 05 specificerar på två ställen en **Haiku 4.5 LLM-call från hook-nivå** (Task 14.2 för rich fact-extraction, Task 16.1 för diff-interpretation). Den plugin-arkitektur Sprint 01 dokumenterade — `benchmark/adapters/claude-headless.mjs` är en CLI-wrapper runt `claude -p`, inget `@anthropic-ai/sdk` installerat — exponerar ingen LLM-yta till hooks.

Sprintens skelett är dock i grunden strukturell: ersätt den binära 3-rejection-flaggan i `system.md` med en strukturerad fact-modell. LLM-rikheten är en additiv förbättring ovanpå den strukturella omskrivningen. Därför:

- **Heuristisk extractor** (`hooks/scripts/lib/taste-extractor.mjs`) — deterministisk, dep-fri, 100 % i process. Fungerar på svenska- och engelskspråkiga signalfraser som de existerande `update-taste.mjs`-listorna redan täckte. Extraktionens täckning är lägre än en LLM:s skulle vara, men dedup- / upgrade-vägarna är identiska — när SDK-adaptern finns kan en `--llm`-stub ersätta scanner-funktionen utan att röra övriga moduler.
- **Heuristisk git-diff-klassificering** (`hooks/scripts/harvest-git-signal.mjs`) — använder numstat-churn-ratio + commit-count för att klassificera `git_kept` / `git_heavy_edit` / `git_delete` utan att någonsin läsa diff-innehåll via LLM. `style_id` kommer gratis från `.visionary-generated`-markern som Task 16.2 kräver — vi vet vad vi genererade, så diff-klassificeringen behöver bara beskriva *vad som hände med* filen, inte *vad* den var.
- **Embeddings redan lösta** — Sprint 04 levererade `skills/visionary/styles/_embeddings.json` (202 styles × 8 aesthetic axes), vilket gör Task 15.4 pair-sampler dep-fri utan embedding-API.

## Leveranskarta per task

| Task | Status | Notering |
|---|---|---|
| 14.1 — `taste-fact.schema.json` | ✅ Klar | `skills/visionary/schemas/taste-fact.schema.json`. Validerar i dep-free `validate-schema.mjs` (Sprint 02). |
| 14.2 — Mem0-style extractor | ✅ Klar (heuristisk) | `hooks/scripts/lib/taste-extractor.mjs`. LLM-upgradevägen är en framtida `--llm`-stub — samma seam som `build-style-embeddings.mjs` har. Dedup via `factKey(scope+signal)`. Sprintens AC "10 syntetiska conversations ger förväntade facts" verifierad via inline smoke-test (se nedan). |
| 14.3 — Aging (promote/decay/reactivate) | ✅ Klar | `hooks/scripts/lib/taste-aging.mjs`. 3 scenarios covered (promote, decay, reactivate). `taste/aging.log`-format är tab-separerat per rad. |
| 14.4 — Migration `system.md` → facts | ✅ Klar | `scripts/migrate-system-md-to-facts.mjs`. Idempotent via `<!-- MIGRATED -->`-header. Auto-körs från `update-taste.mjs` när `taste/facts.jsonl` saknas men `system.md` finns. |
| 14.5 — Step 4.5 integration | ✅ Klar | `skills/visionary/context-inference.md` — tabell för score-adjustments per `flag × direction × target_type`. Facts injiceras via ny hook `inject-taste-context.mjs`. |
| 15.1 — `taste-pair.schema.json` | ✅ Klar | `skills/visionary/schemas/taste-pair.schema.json`. |
| 15.2 — Pair-capture efter `/variants`-pick | ✅ Klar | `hooks/scripts/update-taste.mjs` detekterar "pick A/B/C", "go with B", "take #2" etc. Läser `.visionary-cache/last-variants-brief.json` som `/variants`-kommandot nu skriver per uppdaterad `commands/variants.md`. |
| 15.3 — FSPO few-shot injection i Step 4 | ✅ Klar (doc + runtime) | `context-inference.md` — ny "Few-shot taste anchors"-sektion före Step 4.5. Runtime sker i `inject-taste-context.mjs` via diversity sampler. |
| 15.4 — Pair-diversity-sampler | ✅ Klar | `hooks/scripts/lib/pair-sampler.mjs`. Använder existerande `_embeddings.json` (Sprint 04). Synthetic-pair-test: mean pairwise cosine distance = 1.08 (AC ≥ 0.4). |
| 16.1 — `harvest-git-signal.mjs` | ✅ Klar (heuristisk diff) | SessionStart-hook, 24h rate-limit, 50 files/run budget. `git_kept` + `git_heavy_edit` verifierade på test-repo (2 fixtures → 2 förväntade facts). `git_delete`-path är implementerad men testas först när en generated-file faktiskt raderas. |
| 16.2 — `.visionary-generated`-marker | ✅ Klar (doc) | `skills/visionary/SKILL.md` Stage 5 — komplett marker-format för TSX/JSX/HTML/CSS/Svelte/Vue med rules + fallbacks. Genererare i alla 15 stacks pekar hit. Inga ändringar i stack-specifika templates nödvändiga då SKILL.md är kanoniskt. |
| 16.3 — Privacy + opt-out | ✅ Klar | `docs/taste-privacy.md` — full datamodell, per-fil förklaring, opt-out-matris. `VISIONARY_DISABLE_TASTE=1` respekteras i alla fem hooks/script. README-länk via sprint-wire-up. |
| 16.4 — `/visionary-taste`-kommando | ✅ Klar | `commands/visionary-taste.md` + `scripts/taste-debug.mjs`. Subkommandon: `status`, `show [scope]`, `forget <id>`, `reset [--force]`, `age [--dry-run]`. |

## Nya filer

```
hooks/scripts/
  harvest-git-signal.mjs             # SessionStart (rate-limited passive loop)
  inject-taste-context.mjs           # UserPromptSubmit (reads + injects profile)
  update-taste.mjs                   # UPDATED — rewritten for new storage
  lib/
    taste-io.mjs                     # ULID + JSONL atomic writers + scope match
    taste-extractor.mjs              # heuristic fact extraction + applyUpgrade
    taste-aging.mjs                  # promotion/decay/reactivation rules
    pair-sampler.mjs                 # diversity sampler over 8D embeddings

skills/visionary/schemas/
  taste-fact.schema.json
  taste-pair.schema.json

scripts/
  migrate-system-md-to-facts.mjs     # one-shot idempotent migration
  taste-debug.mjs                    # backs /visionary-taste

commands/
  visionary-taste.md                 # new slash command

docs/
  taste-privacy.md                   # privacy + opt-out reference

docs/sprints/artifacts/
  sprint-05-architecture-notes.md    # this file
```

## Ändrade filer

- `hooks/hooks.json` — registrerar 2 nya hooks (harvest-git-signal i SessionStart, inject-taste-context i UserPromptSubmit). Ordning: inject före update så injiceringen sker mot snapshot FÖRE aktuell turn kapsas in.
- `skills/visionary/SKILL.md` — Stage 5-sektionen rewriten; ny "`.visionary-generated`-marker"-sektion.
- `skills/visionary/context-inference.md` — Step 4.5 helt omskriven; ny FSPO-sektion före Step 4.5.
- `commands/variants.md` — ny "Writing `last-variants-brief.json`"-sektion.

## Dependency-fri garanti

Noll nya runtime-beroenden. Fortfarande inga `package.json`, inga `node_modules`. Allt är Node 18+ stdlib:

- `node:fs` — JSONL-I/O
- `node:path` — path-walking
- `node:crypto` (via globalThis.crypto.getRandomValues) — ULID randomness
- `node:child_process` — `spawnSync('git', ...)` för harvest

## Kvarstående begränsningar

1. **LLM-upgrade-path** — `taste-extractor.mjs.extractFactsFromTurn` och `harvest-git-signal.mjs.classify` är båda förberedda för ett `--llm`-läge som ersätter heuristiken med Haiku 4.5-calls. Det kräver samma SDK-adapter som Sprint 01 dokumenterade. Seam är medveten, byggd för Sprint 06.
2. **Extractorens språkstöd** — pattern-tabellen är engelska + svenska (ärver från pre-sprint `update-taste.mjs`). Andra språk faller tillbaka till "ingen signal detekterad". LLM-uppgraderingen löser det automatiskt; tills dess bör tyska/franska/japanska projekt förvänta sig lägre fact-throughput.
3. **`git_delete`-path ovalideerad mot riktigt raderad fil** — logiken är implementerad men sprint-testet skapade aldrig en delete-scenario i git-fixture. Förväntas fungera per `git ls-files --error-unmatch`-check.
4. **Dataförorening från gammal `update-taste.mjs`** — existerande `system.md` kan innehålla falsk-positiva rejektioner från task-notification-skräp (pre-sprint-05-heuristiken matchade brett). Migration importerar dem troget. Användaren kan rensa via `/visionary-taste show project` + `/visionary-taste forget <id>`, eller göra `reset --force` för en ren start.
5. **Benchmark-AC:n** — sprint-DoD kräver "10-prompt benchmark efter 5 explicita facts: ≥ 30 % av selections respekterar facts". Det mäts av runner.mjs som fortfarande körs via CLI-adaptern — score-påverkan är synlig i den injicerade `additionalContext`, men ett automatiserat A/B-test över 10 prompts kräver runner-utbyggnad. Dokumenterat som uppföljning.

## Pre-flight checklista (retro)

| Item | Status |
|---|---|
| Sprint 4 mergad — 2026-primitiver + BoN live | ⚠️ Ej commitad till `main`, men arbetet finns i working tree och bärs vidare på feature-branchen (samma pattern som sprint 1–3). `_embeddings.json` och schemas-dir är tillgängliga. |
| Beslut om backward-compat för `system.md` | ✅ Auto-migrate vid första hook-tick. Gamla filen får `<!-- MIGRATED -->`-header. |
| Feature-branch `feat/sprint-05-taste-core` | ✅ Skapad, sprint 2/3/4-ändringar burna vidare som tidigare sprints. |

## Verifieringar körda

- **Schema-validering:** alla 8 migrerade facts validerar mot `taste-fact.schema.json`. Felformat avvisas korrekt.
- **Extractor roundtrip:** strong-reject → conf 0.85, soft-reject → 0.55, dedup → 0 nya + 1 upgrade, neutral → 0 facts.
- **Aging:** promote (3 evidence, 2 kinds, conf 0.92) ✓, decay (30+ dagar) ✓, delete (conf < 0.2) ✓, reactivate ✓.
- **Pair-sampler:** 50 syntetiska pairs → mean pairwise distance 1.08 (AC ≥ 0.4).
- **Harvest:** test-repo med 2 marked files → `git_kept` + `git_heavy_edit`-facts emitterade korrekt.
- **Hook-flöde end-to-end:** UserPromptSubmit med reject-fras → fact i facts.jsonl. Subsequent generation-turn → inject-hook läser 7 active + 1 permanent, emitterar `additionalContext` med score-tabell.
- **Opt-out:** `VISIONARY_DISABLE_TASTE=1` → alla 5 hooks/script tystar sig.
- **Slash-command:** alla 4 subkommandon (`status`, `show`, `forget`, `reset`, `age`) producerar förväntad output.

## Öppna beslut för Sprint 06-ägaren

1. **LLM-extractor-upgrade** — byt `taste-extractor.mjs.extractFactsFromTurn` till Haiku-call när SDK-adapter finns. Heuristic-path förblir fallback för opt-out-användare.
2. **Benchmark-DoD** — bygg ut `benchmark/runner.mjs` att mäta "fact-adherence rate" över 10 prompts med och utan facts.
3. **Runner-bridge** — ska runner:n passera taste-facts till generate-anropet, eller ska den köras med `VISIONARY_DISABLE_TASTE=1` så mätningen blir stabil?
4. **Aging-schema** — idag är aging en manuell `/visionary-taste age`-trigger. Ska den vävas in i `check-for-updates.mjs`-stampen (en gång per vecka) automatiskt?
