# Visionary Sprint Roadmap

12-veckors implementationsplan över 3 faser och 7 sprints. Baserad på 50-sökningars research syntetiserad i `../RESEARCH_SYNTHESIS.md` (eller conversation-output 2026-04-22).

## Översikt

| Sprint | Vecka | Fas | Tema | Items | Komplexitet |
|---|---|---|---|---|---|
| [01](./sprint-01-cache-arkitektur.md) | 1 | 1 | Cache + Index + Haiku | 1, 2, 3 | Low-Medium |
| [02](./sprint-02-loop-effektivitet.md) | 2 | 1 | Structured + Early-exit + Diff-rounds | 4, 5, 6 | Low-Medium |
| [03](./sprint-03-matbar-kvalitet.md) | 3–4 | 2 | Numerisk scorer + Rulers + Evidence-citations | 7, 8, 9 | Medium-High |
| [04](./sprint-04-generation-uppgraderingar.md) | 5–6 | 2 | Best-of-N + Orthogonal variants + 2026 web primitives | 10, 11, 12, 13 | Medium-High |
| [05](./sprint-05-taste-flywheel-core.md) | 7–8 | 3 | facts.jsonl + FSPO pairs + git-harvest | 14, 15, 16 | Medium |
| [06](./sprint-06-personalization-observability.md) | 9–10 | 3 | DesignPref RAG + Multi-agent critic + Trace logging | 17, 18, 19 | Medium-High |
| [07](./sprint-07-platform-play.md) | 11–12 | 3 | `.taste` dotfiles + Content kits | 20, 21 | Medium |

## Faser i en mening

- **Fas 1 (Sprint 1–2):** sänk tokenkostnaden 55–65 % per generation utan att röra output-kvaliteten.
- **Fas 2 (Sprint 3–4):** lyft benchmark från 18.35/20 → ≥ 19.3 genom mätbar, calibrerad kritik + Baseline-2026 web-primitiver.
- **Fas 3 (Sprint 5–7):** bygg taste-flywheel och content-resilience som konkurrenter inte kan kopiera utan att bygga om sitt fundament.

## Läsordning

1. Börja med denna fil
2. Läs sprintens fil före första dagen i sprinten
3. Varje sprint har Pre-flight Checklist som måste vara grön före kickoff
4. Efter varje sprint: kör benchmarkjämförelse pre/post (se Sprint 1, task 1.7)

## Uppföljning

Efter varje sprint uppdateras `benchmark/results/sprint-NN.json` med:

- `tokens_per_generation` (input + output, median över 10-prompt-suite)
- `cache_hit_rate` (för Sprint 1+)
- `benchmark_score` (20-skalig, median)
- `motion_readiness` (svagaste dimensionen historiskt)
- `time_per_generation_ms`

## Terminologi

- **Item N** = numrerad post från 3-fas roadmap (1–21)
- **Task N.M** = M:te deltask inom Item N
- **DoD** = Definition of Done — allt måste vara grönt innan sprint räknas som klar
- **AC** = Acceptance Criteria — mätbara villkor per task
- **S/M/L/XL** = Small (≤ 2h) / Medium (½–1 dag) / Large (1–3 dagar) / Xtra-large (≥ 3 dagar)

## Avvikelser från planen

Sprint-dokumenten är levande. Ändringar dokumenteras som amendments i botten av respektive fil med datum och orsak. Aldrig redigera bort scope som var committad vid kickoff — lägg till scope-cut i amendment-sektionen istället.
