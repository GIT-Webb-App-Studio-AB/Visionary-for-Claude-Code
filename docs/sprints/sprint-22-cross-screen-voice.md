# Sprint 22 — Cross-Screen Flow & Voice-Tempo Refinement

**Vecka:** 35
**Fas:** 14 — Multi-modal interaktion (ny fas)
**Items:** 40, 41
**Beräknad tid:** 6 dagar
**Mål:** Två separata signaturfeatures som båda utökar interaktionsytan: (1) `/visionary-flow` genererar list+detail+empty+error+loading som koherent set med cross-screen critique-loop som fångar tone/motion-drift mellan tillstånd. (2) `/visionary-voice` accepterar talad refinement där prosodi (decay, stiffness, mass) mappas direkt till motion-tokens — mer naturligt än textprompt.

Wild idea: en komponent är inte färdig förrän alla dess tillstånd är koherenta. Om "loading" känns harder än "list" ser den hela funktionen sönder. Och röst som motion-design — tala "smoooth ... snap" och få exakt det stiffness/decay-pattern. Båda features lever av att designprocessen är multi-modal, inte enbart text-driven.

## Scope

- Item 40 — Cross-Screen Flow: ny command `/visionary-flow`, multi-screen-orchestrator, parallel Playwright-render i 5 viewports, cross-screen critique-modul, drift-detection per state-pair, corrective regen-loop.
- Item 41 — Voice-Tempo Refinement: ny command `/visionary-voice`, browser-mic-recording via Playwright, prosodi-extraktion (pitch/envelope/rhythm), mappning till Motion v12-parametrar, applicering på senast genererad komponents motion-tokens.

## Pre-flight checklist

- [ ] Sprint 11 (DINOv2-visuella embeddings) klar — används för cross-screen drift-metric
- [ ] Sprint 9 (motion-scoring v2) klar — voice-mappning återanvänder motion-token-schema
- [ ] Playwright-mic-permissions verifierade på Linux/macOS/Windows headless
- [ ] Motion v12 stable i project deps
- [ ] Feature-branch: `feat/sprint-22-cross-screen-voice`

---

## Task 40.1 — `/visionary-flow` command [L]

**Fil:** `commands/visionary-flow.md` (ny) + `hooks/scripts/lib/flow/multi-screen-orchestrator.mjs` (ny)

**Vad det gör:** Givet en feature-beskrivning, generera 5 koherenta tillstånd: list, detail, empty, error, loading. Använd EN gemensam stil-anchor + EN gemensam token-set + 5 olika content-shapes. Output är 5 .tsx-filer + en `flow.md` som länkar dem.

**Steg:**
1. Parse feature-prompten → identifiera den underliggande resursen ("todos", "users", "messages").
2. Generera 5 sub-prompts (en per state) med shared design-context: samma palette, typografi, motion-tier; varierande content-shape.
3. Parallel Playwright-render i 5 viewports (samma URL-bas, olika query-params eller mock-states).
4. Cross-screen critique (Task 40.2) → korrigerande iteration tills drift < threshold.
5. Output: `flow/<feature>/{list,detail,empty,error,loading}.tsx` + `flow/<feature>/flow.md` med screenshot-grid.
6. Single-shot fallback: vid `--single-state X` generera bara ett tillstånd (debug-mode).

**AC:**
- 5 filer producerade per flow
- Alla 5 använder samma palette + motion-tokens (verifierat via DTCG-extraction)
- `flow.md` länkar alla 5 + visar screenshot-grid
- Test: feature-prompt "todos" producerar fungerande mock-data per state

---

## Task 40.2 — Cross-screen critique-loop [L]

**Fil:** `hooks/scripts/lib/flow/cross-screen-critique.mjs` (ny)

**Vad det gör:** Specialcritic som tar 5 screenshots samtidigt och scorar konsistens *cross-screen*, INTE per skärm. Per-screen-quality täcks redan av existing critic; här mäter vi drift mellan tillstånd.

**Drift-dimensioner:**
- **Tone-shift**: palette-distans (CIEDE2000 i oklch) mellan par
- **Motion-velocity-shift**: dominant duration-band-skillnad (token-extraction från CSS)
- **Density-shift**: white-space-ratio per viewport
- **Palette-shift**: top-3-färg-frekvens-diff

**Steg:**
1. Aggregera 5 screenshots + extraherade tokens från Stage 4-output.
2. Per-pair drift-metric (10 par totalt: C(5,2)).
3. Top-3 worst-drifts → corrective prompt till regen ("loading-state använder oklch(0.65 0.18 280) men list använder oklch(0.72 0.12 220) — align loading till list-palette").
4. Trace-event `cross_screen_drift` per par med `{state_pair, drift_dims, scores}`.
5. State-typ-medvetna drift-rules: loading → relaxed visual-density (skeleton är OK), error → relaxed palette (red-accent legitim), empty → relaxed motion (stillness is the design).

**AC:**
- Test 1: 5 koherenta screenshots → drift-score låg (<0.3 på alla par)
- Test 2: avsiktligt inkoherenta → drift-score hög + corrective prompt genereras
- State-typ-rules: loading skeleton-density flaggar inte som drift
- Trace-events validerar mot schema

---

## Task 40.3 — `/visionary-voice` command [L]

**Fil:** `commands/visionary-voice.md` (ny) + `hooks/scripts/lib/voice/voice-to-motion.mjs` (ny)

**Vad det gör:** Användaren spelar in via mic en kort vokalisering ("smoooth ... snap", "wah-zip", "slooow-pause-fast"). Voice-to-motion-mappare extraherar prosodi och mappar till motion-tokens.

**Prosodi-features:**
- **Tonhöjdskontur** (intonation) — autocorrelation-pitch-detection
- **Längd-distribution** (rhythm) — onset-detection + duration-clustering
- **Volym-attack/decay** (envelope) — RMS over moving window

**Mappning till Motion v12 (`{bounce, visualDuration}`):**
- Attack-sharpness → `bounce` (sharp attack ≈ bounce 0.0–0.15; soft attack ≈ bounce 0.4–0.6)
- Release-time → `visualDuration` (kort release ≈ 0.15s; lång release ≈ 0.6s)
- Sustain-amplitude → mass-proxy (tyngd i bounce-känsla)

**Steg:**
1. Web Audio API för mic-recording (i Playwright-browser-context).
2. Pitch-detection (autocorrelation eller YIN-algoritm).
3. Envelope-detection (RMS over 50ms moving window).
4. Mappa till Motion v12-parametrar via lookup-table + smoothing.
5. Apply på senast genererad komponents motion-tokens (modify in place, regen).

**AC:**
- 5 voice-samples producerar 5 distinkta motion-patterns (bounce-spread ≥0.3)
- Generated CSS-keyframes har audible match (kvalitativ test, 3 reviewers)
- Sample <2s → fail-fast med "spela in minst 2s"

---

## Task 40.4 — Browser-mic-integration [M]

**Fil:** `hooks/scripts/lib/voice/mic-recorder.mjs` (ny)

**Vad det gör:** Playwright-driven mic-recording. Browser-side `navigator.mediaDevices.getUserMedia({audio})` → AudioContext → MediaRecorder → blob → tillbaka till Visionary för analys.

**Steg:**
1. Permission-handling i Playwright: `context.grantPermissions(['microphone'])`.
2. Recording-window 5s default, configurerable via `--duration`.
3. Blob → wav-format via Web Audio API decoding (för portability).
4. Skicka tillbaka via `mcp__playwright__browser_evaluate`-channel som base64.
5. Fallback: `--audio-file <path>` accepterar förinspelad fil (för CI + headless-test).

**AC:**
- 5s-recording fungerar i headless Chromium
- Output är valid wav (verifierat med ffprobe)
- Audio-file-fallback fungerar utan mic-permission
- Error-handling: ingen mic → tydligt error med fallback-instruktion

---

## Task 40.5 — Tester [M]

**Fil:** `hooks/scripts/lib/flow/__tests__/*.test.mjs`, `hooks/scripts/lib/voice/__tests__/*.test.mjs`

**Coverage:**
- Cross-screen drift-metric (synthetic fixtures: 5 koherenta + 5 inkoherenta sets)
- State-typ-medvetna rules (loading/error/empty exceptions)
- Voice-prosody-extraktion (synthetic audio-samples med kända features)
- Pitch-detect på pure tone (440Hz fixture) + complex tone
- Envelope-detect på AM-signal med känt envelope
- Motion-mapping-determinism (samma input → samma output)

**AC:**
- `node --test` grön
- ≥80 % coverage på `lib/flow/` och `lib/voice/`

---

## Task 40.6 — Doc + samples [S]

**Fil:** `docs/visionary-flow.md`, `docs/visionary-voice.md` (båda nya)

**Innehåll:**
- `visionary-flow.md`: hur använda, exempel-flow (todo-app: 5 states screenshot-grid), drift-rules, accessibility (5 states delar samma keyboard-flow + same focus-order).
- `visionary-voice.md`: hur använda, exempel voice-samples (audio-länkar i repo eller asciinema), prosodi-mappning-tabell, accessibility (voice är optional, alltid keyboard-fallback för token-tweaking, alltid text-prompt-fallback).

**AC:**
- Båda docs har konkreta exempel
- Voice-doc inkluderar permission-policy + privacy-disclaimer (ljud lämnar aldrig maskinen)

---

## Benchmark-verifiering

**Fil:** `results/sprint-22-cross-screen-voice.md`

**Mätningar:**
- 10 features × flow-mode: cross-screen drift-score post-iteration
- 20 voice-samples × motion-fidelity (kvalitativ 5-skala via 3 reviewers)
- Wall-clock-tid per flow-generation (förvänta <90s med parallel render)
- Wall-clock-tid per voice-tweak (förvänta <15s end-to-end)

**AC:**
- Drift-score <0.3 efter en iteration
- Reviewer-medel ≥4/5 för voice-fidelity
- Tid <90s per flow, <15s per voice

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| 5-screen render tar 5× tid | Hög | Medel | Parallel Playwright-pages, budget-cap, single-state-fallback |
| Voice-mic-permission krångel cross-platform | Hög | Hög | Headless-mode-default, visuell fallback med uppladdad audio-fil |
| Cross-screen drift-metric falsk-flaggar legitim variation (loading SKA visa skeleton) | Hög | Medel | State-typ-medvetna drift-rules (loading → relaxed visual-density) |
| Voice-prosody-mapping otillräcklig på korta samples (<2s) | Medel | Medel | Prompt om minimum-längd, fallback till textbeskrivning |
| Browser mic-API instabil i Playwright | Medel | Hög | Förinspelade audio-test-fixtures + manual real-mic-test före release |

---

## Definition of Done

- [ ] Alla tasks (40.1–40.6) klara
- [ ] `/visionary-flow` producerar 5 koherenta states
- [ ] Cross-screen drift-loop fungerar med state-typ-rules
- [ ] `/visionary-voice` mappar prosodi → motion-tokens
- [ ] Mic-permission + audio-file-fallback fungerar
- [ ] Tester gröna, ≥80 % coverage
- [ ] `results/sprint-22-cross-screen-voice.md` publicerad
- [ ] 2 docs publicerade
- [ ] Mergad till `main`

## Amendments

_Tomt._
