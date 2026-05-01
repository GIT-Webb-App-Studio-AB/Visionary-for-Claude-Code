# Visionary Sprint Roadmap

28-veckors implementationsplan över 9 faser och 15 sprints. Sprint 1–8 var den ursprungliga 14-veckors-planen baserad på 50-sökningars research syntetiserad i `../RESEARCH_SYNTHESIS.md`. Sprint 9–15 tillkom 2026-05-01 efter ytterligare 80 sökningar fördelade på 9 specialiserade research-agenter; ger en kvalitets-fokuserad andra halva av roadmappen där varje sprint motiveras av en konkret kvalitetshöjare i output (inte distribution, business eller runtime-feature).

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
| [08](./sprint-08-distinctiveness-gate.md) | 13–14 | 4 | Hard slop-reject + Negative visual anchors | 22, 23 | Medium |
| [09](./sprint-09-motion-scoring-2.md) | 15–16 | 5 | Motion Scoring 2.0 (6 sub-dim + Maturity Model) | 24 | Medium-High |
| [10](./sprint-10-mcp-server-extraction.md) | 17–18 | 6 | MCP-server-extraction (Cursor/Windsurf/Cline/Zed) | 25 | Medium-High |
| [11](./sprint-11-visual-embeddings-dinov2.md) | 19–20 | 5 | DINOv2 ONNX visual embeddings + OOD-detection | 26 | High |
| [12](./sprint-12-mllm-judge.md) | 21–22 | 5 | MLLM Judge tie-breaker (multimodal Claude på screenshots) | 27 | Medium-High |
| [13](./sprint-13-vibe-motion-editor.md) | 23–24 | 7 | Vibe Motion Editor (NL → motion-tokens) | 28 | Medium |
| [14](./sprint-14-active-governance.md) | 25–26 | 8 | Active Governance Hook (pre-commit + CI drift-gate) | 29 | Medium |
| [15](./sprint-15-taste-inheritance.md) | 27–28 | 9 | Taste Inheritance (designer-as-subagent) | 30 | Medium-High |

## Faser i en mening

- **Fas 1 (Sprint 1–2):** sänk tokenkostnaden 55–65 % per generation utan att röra output-kvaliteten.
- **Fas 2 (Sprint 3–4):** lyft benchmark från 18.35/20 → ≥ 19.3 genom mätbar, calibrerad kritik + Baseline-2026 web-primitiver.
- **Fas 3 (Sprint 5–7):** bygg taste-flywheel och content-resilience som konkurrenter inte kan kopiera utan att bygga om sitt fundament.
- **Fas 4 (Sprint 8):** bryt konvergensen mot generisk AI-design — stoppa slop vid källan (preventivt) istället för att sänka scoret i efterhand (reaktivt).
- **Fas 5 (Sprint 9, 11, 12):** uppgradera signalkvaliteten i kritikslingan — Motion Scoring 2.0 fixar svagaste dim (3.55/5), DINOv2 ONNX adderar visuell off-style-detektion, MLLM Judge breakar ties där numerisk + heuristisk stack är osäker.
- **Fas 6 (Sprint 10):** distribution utanför Claude Code — extrahera kärnan till `@visionary/mcp-server` så Cursor/Windsurf/Cline/Zed kan installera. 5–10× marknadsexpansion.
- **Fas 7 (Sprint 13):** stäng feedback-loopen mellan Motion Scoring 2.0 och faktisk fix — `/visionary-motion "mer energiskt"` re-tunar tokens deterministiskt.
- **Fas 8 (Sprint 14):** multi-page-konsistens som AI-konkurrenter inte klarar — pre-commit + CI gate avvisar PR vid token-drift mot locked style.
- **Fas 9 (Sprint 15):** designer-packs blir co-authors, inte styles — Rams/Vignelli/Greiman argumenterar i arbitration-tabellen per dim.

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
