# Sprint 02 — Architecture notes

**Datum:** 2026-04-22
**Status:** SDK-prerequisite kvar från Sprint 01. Scope anpassad så 80 % av sprintens värde levereras SDK-oberoende.

## Sammanfattning

Sprint 02 bygger vidare på Sprint 01:s prerequisite-gap (se `sprint-01-architecture-gap.md`). Eftersom `benchmark/adapters/claude-headless.mjs` fortfarande är en CLI-wrapper runt `claude -p`, går det inte att sätta `response_format: { type: "json_schema" }` eller mäta schema-retry-events från själva API-svaret. Den delen av Task 4.2 stannar blockad.

Allt annat i sprinten — schemas, early-exit-predikat, diff-applier, loop-integrationstest, dokumentation — är rent bibliotekarbete. Det är levererat och fullt testat.

## Leveranskarta per task

| Task | Status | Notering |
|---|---|---|
| 4.1 — JSON-schema för critique-output | ✅ Klar | `skills/visionary/schemas/critique-output.schema.json` |
| 4.2 — Aktivera structured outputs | ⚠️ Partiell | Schema-referens + loop-control injicerad i hook `additionalContext`. Faktisk `response_format`-enforcement kräver SDK-adapter. |
| 4.3 — Övriga structured endpoints | ✅ Klar | `style-selection.schema.json`, `taste-signal.schema.json`, `annotate-edit.schema.json` |
| 5.1 — Confidence-gated early exit | ✅ Klar | `hooks/scripts/lib/loop-control.mjs` + 21 unit-tester |
| 6.1 — Diff-prompt + apply-diff | ✅ Klar | `hooks/scripts/lib/apply-diff.mjs` + 10 unit-tester, `skills/visionary/diff-refine.md` |
| 6.2 — Round-1-full-regen-option | ✅ Klar | `shouldUseDiffRegen` i loop-control, integrationstestad |
| 6.3 — Diff-statistik i metrics | ⚠️ Partiell | `benchmark/results/_schema.md` dokumenterar fältet `diff_stats`; runtime-population i `benchmark/runner.mjs` kräver SDK-adaptern (samma blocker som Sprint 01 Task 1.7) |
| 6.4 — Integrationstest | ✅ Klar | `benchmark/tests/loop-integration.mjs` — alla 5 scenarier gröna |

**Total:** 6 tasks fullt klara, 2 partiella (båda pending SDK).

## Schema-migration: 0-10 vs 1-5

Sprint 02:s schema specificerar ett **nytt format** som skiljer sig från det som dokumenteras i `agents/visual-critic.md` och `skills/visionary/critique-schema.md` pre-Sprint-02:

| Aspekt | Pre-Sprint 02 | Sprint 02 (nytt) |
|---|---|---|
| Score-skala | 1-5 integer | 0-10 number |
| Toppnivå-struktur | `meta`-nested + `scores` som `{score, rationale}` objekt | Flat: `round`, `scores` (numbers), `confidence`, `top_3_fixes`, `convergence_signal`, `slop_detections`, `axe_violations_count` |
| `top_3_fixes` | Array av strängar | Array av objekt `{dimension, severity, proposed_fix, selector_hint?}` |
| `confidence` | Inte definierat | 1-5 integer per dimension |
| `slop_detections` | `design_slop_flags` (array av strängar) | Array av `{pattern_id, severity}` objekt |
| `axe_summary` | Nestad med counts per impact-nivå | Ersatt av enkel `axe_violations_count: integer` |

**Konsekvens:** `agents/visual-critic.md` och `skills/visionary/critique-schema.md` har fått Sprint 02-sektioner som pekar på schemat som kanoniskt, men rubric-prosan i `visual-critic.md` behåller 1-5-exemplen. En följdmigration krävs:

1. Omskrivning av `agents/visual-critic.md` så subagenten emitterar schemat natively.
2. Spot-check att alla nedströms-konsumenter (annotator, /apply, export-flödet) läser det nya formatet.
3. Re-baseline av benchmark-rubrikern — det är **bara critique-loopen** som byter skala; `benchmark/rubric/rubric.md` och scorers (`scan-slop`, `a11y-scorer` osv) stannar på 1-5.

Det är 0.5–1 dags arbete som ligger utanför denna sprint. Amendmenten nedan loggar det som uppföljning.

## Testmatris (status)

52 tester gröna:

```
$ node --test hooks/scripts/lib/__tests__/*.mjs benchmark/tests/loop-integration.mjs
loop-control.test.mjs         21 ✓
apply-diff.test.mjs           10 ✓
validate-schema.test.mjs      16 ✓
loop-integration.mjs           5 ✓
─────────────────────────────────
                              52 ✓
```

- `loop-control`: alla permutationer av shouldEarlyExit/shouldEscalateToReroll/shouldUseDiffRegen
- `apply-diff`: multi-hunk, fuzz, CRLF, trailing-newline, Unicode, failure, dry-run
- `validate-schema`: positiva + negativa fall per schema (4 scheman × ≥ 3 cases)
- `loop-integration`: de 5 scenarierna ur Sprint 02 Task 6.4

## Vad som behövs från Sprint 01-uppföljning (eller dedicated task)

För att låsa ut resterande Sprint 02-värde:

1. **SDK-adapter** (Sprint 01 Task 2.0): `benchmark/adapters/claude-sdk.mjs` + `package.json` med `@anthropic-ai/sdk`. När den finns:
   - Task 4.2 Steg 1 körs — `response_format: { type: "json_schema", schema: <loaded> }` i API-calls
   - Task 4.2 Steg 3 körs — retry-på-schema-failure-path
   - Task 4.2 Steg 4 körs — `schema_violations`-metric populeras
   - Task 6.3 runtime-delen körs — `diff_stats`-fält populeras i `summary.json` från runtime-events

2. **visual-critic-migration** (0.5 dag): skriv om `agents/visual-critic.md` så subagenten emitterar Sprint 02-schemat direkt, inte 1-5/meta-nested.

3. **Pricing-tariff** (Sprint 01 Task 1.7): `benchmark/pricing.json` behöver en 2026-04-tariff för att mäta `$-savings` från diff-refine. Token-count-delta går att mäta utan priset, men `cost_usd` fält i `summary.json` förblir `null` tills priset finns.

## Kvarvarande beslut för nästa sprint-ägare

- **Ska migration av `visual-critic.md` ske i samma PR som SDK-adaptern, eller som separat PR?** Rekommendation: samma PR — de testas bäst ihop genom att köra 10-prompt-suiten end-to-end på det nya flödet.
- **Ska vi behålla 1-5 rubric-output i benchmark även efter loop-migrationen?** Rekommendation: ja. Rubric är publik mätpunkt; byta skala skulle ogiltigförklara jämförelser mot tidigare snapshots.
- **`schema_violations`-metric: ska retries räknas per prompt eller per round?** Rekommendation: per round (mer granulärt); summera per prompt i rapporteringsvyn.
