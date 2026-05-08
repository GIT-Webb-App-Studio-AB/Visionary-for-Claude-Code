# Sprint 22 — Cross-Screen Flow & Voice-Tempo Refinement: Implementation Status

**Branch:** `feat/sprint-16-anti-typicality` (Sprint 16/17/18/19/20/21/22 staplade tills user committar)
**Status:** Voice-modules + tester + docs klara. 26 nya voice-tester gröna. Cross-screen flow-modul väntar på Task 40.1-40.2 (separat scope).

## Implementerade tasks (Task 40.3-40.6 voice-spår)

### Task 40.3 — `/visionary-voice` command + voice-to-motion-modul ✅

- `commands/visionary-voice.md` — command-doc med argument-syntax,
  pipeline-steg, prosodi → Motion v12-mappnings-tabell, accessibility-
  fallback-väg, privacy-disclosure.
- `hooks/scripts/lib/voice/voice-to-motion.mjs` — three exports:
  `extractPitchContour`, `extractEnvelope`, `prosodyToMotion`.
  Inline autocorrelation-pitch-detection (ingen extern dep), RMS-
  envelope, mappning till Motion v12 `{bounce, visualDuration}` plus
  legacy v11 `{stiffness, damping, mass}`.
- Mappnings-heuristik:
  - Pitch-varians → stiffness-proxy (200..600)
  - Envelope-attack-rate → mass (0.5..2.0)
  - Envelope-sustain-median → visualDuration (0.2..1.0 s)
  - Pitch-tail-vs-mean → bounce (0..0.6)
- Deterministisk: samma input → samma output, alltid.

### Task 40.4 — Browser-mic-integration ✅

- `hooks/scripts/lib/voice/mic-recorder.mjs` — `buildMicInstructions`,
  `decodeBase64ToBuffer`, `decodeAudioBuffer`.
- Hook → instruktions-block → agent-tur kör Playwright-stegen.
  Hooks kan inte direkt kalla MCP-tools, så vi emitterar additional-
  context med fullt körschema (navigate → evaluate → läs window-var →
  decode → write).
- Duration-clamp: [2, 30] s med default 5 s.
- `--use-fake-ui-for-media-stream`-flagg-instruktion för headless.
- File-fallback för CI/permission-deny.

### Task 40.5 — Tester ✅

- `hooks/scripts/lib/voice/__tests__/voice-to-motion.test.mjs` —
  13 tester:
  - extractPitchContour på 220 Hz syntetisk sinusvåg → ±8 Hz tolerans
  - extractPitchContour på degenerate input → []
  - extractEnvelope på ramp-up signal → peak i 2:a halvan
  - prosodyToMotion: hög-varians pitch → hög stiffness (≥500)
  - prosodyToMotion: stigande pitch → bounce > 0
  - prosodyToMotion: fallande pitch → bounce = 0
  - prosodyToMotion: snabb attack → låg mass (<1.0)
  - prosodyToMotion: långsam attack → hög mass (>1.2)
  - Motion v12-spring-kontrakt (type, bounce ∈ [0,1], visualDuration ∈ [0.2, 1.0])
  - Determinism-check
  - All-unvoiced graceful handling
  - End-to-end syntetisk fast-attack signal
  - __INTERNAL__-konstanter
- `hooks/scripts/lib/voice/__tests__/mic-recorder.test.mjs` — 13 tester:
  - buildMicInstructions returnerar non-empty
  - Default duration 5 s embedded
  - Explicit duration honoreras
  - Duration-clamp [2, 30]
  - outputPath embedded verbatim
  - Playwright + permission hints inkluderade
  - File-fallback-instruktion present
  - Privacy-disclosure present
  - Throw på missing outputPath
  - decodeBase64ToBuffer round-trip
  - decodeBase64ToBuffer rejects empty/non-string
  - decodeAudioBuffer parses raw Float32 PCM
  - decodeAudioBuffer rejects misaligned bytes
- **26 tester gröna** via `node --test` (lokalt verifierat).

### Task 40.6 — Doc ✅

- `docs/visionary-flow.md` (~210 rader, svenska):
  varför cross-screen, pipeline-steg, state-typ-medvetna tolerance-
  regler, kombinationer med --blend/--vs/--mood, accessibility-
  koherens, wall-clock-budget, trace-events.
- `docs/visionary-voice.md` (~270 rader, svenska):
  varför röst-mappning, prosodi → Motion v12-tabell, browser-permission-
  flow, audio-format-stöd, privacy-databana, accessibility-fallbacks
  (WCAG 2.5.4 + 2.3.3), minimum-längd-kontrakt, setup-krav per
  plattform, designprinciper.

## Inte implementerat i denna leverans

Sprint 22 omfattar två separata signaturfeatures (Item 40 och Item 41).
Denna leverans täcker **Item 41 voice-spår + samtliga docs**. Kvarvarande
för full sprint-DoD:

- [ ] **Task 40.1** — `commands/visionary-flow.md` + `hooks/scripts/lib/flow/multi-screen-orchestrator.mjs`
- [ ] **Task 40.2** — `hooks/scripts/lib/flow/cross-screen-critique.mjs` med drift-dimensions
- [ ] Cross-screen tester (`hooks/scripts/lib/flow/__tests__/*.test.mjs`)

Doc-filen `docs/visionary-flow.md` är redan publicerad och beskriver
det fulla designkontraktet — den lär behöva minimal justering när
flow-modulen implementeras.

## Definition of Done — status

- [x] Task 40.3 (voice-to-motion + command) klar
- [x] Task 40.4 (mic-recorder) klar
- [x] Task 40.5 (voice-tester) klar — 26/26 gröna
- [x] Task 40.6 (docs) klar — båda doc-filer publicerade
- [ ] Task 40.1 (visionary-flow command + orchestrator)
- [ ] Task 40.2 (cross-screen critique-loop)
- [ ] Benchmarks (10 features × flow-mode + 20 voice-samples × motion-fidelity)
- [ ] Mergad till main

## Korrigeringar vs sprint-doc

1. **Hook → Playwright-koppling**: Sprint-docen beskrev mic-recording
   som om hooks kunde kalla `mcp__playwright__*` direkt. Det stämmer
   inte — hooks emitterar additionalContext för nästa agent-tur.
   `mic-recorder.mjs` exporterar därför en instruktions-block-builder,
   inte en direkt recording-funktion. Agentens tur följer instruktionerna
   när användaren invokar `/visionary-voice`.

2. **Audio-decode-strategy**: Sprint-docen krävde wav-format som
   ground-truth. Implementationen separerar istället koncerns:
   `voice-to-motion.mjs` tar Float32Array + sampleRate och bryr sig
   inte om container. Decode-laget (webm/wav/mp3 → PCM) ligger i
   agentens lap. Det matchar verkligheten — MediaRecorder ger oss
   webm/opus by default, inte wav, så wav-konvertering hade varit en
   omotiverad mellanlagring.

3. **prosodyToMotion-utfall**: Sprint-docens AC sa "5 voice-samples
   producerar 5 distinkta motion-patterns (bounce-spread ≥0.3)".
   Det är en kvalitativ test som kräver real audio. Den enhetstestet
   som körts i automation är mappnings-determinism + dimensions-
   spread (hög-varians → hög stiffness, stigande pitch → bounce > 0,
   etc.). Live-bounce-spread-mätning står på benchmarks-listan.

4. **Pitch-detection-precision**: Inline autocorrelation träffar inom
   ±8 Hz på en 220 Hz-fixture. YIN-algoritm hade gett bättre precision
   men kostat 2-3× komplexitet. För prosodi-mappning där variansen
   och kontursriktningen är det vi använder — inte exakt Hz — räcker
   autocorrelation.

## Wall-clock-mätningar (ej körda än)

Voice-tweak-budget enligt sprint-doc: < 15 s end-to-end. Förvänta
distribution:

- Mic-record (5 s default): ~5 s
- Playwright eval-roundtrip: ~2 s
- Audio-decode (webm → PCM): ~2 s
- prosodyToMotion: < 100 ms
- Component-edit + critic: ~5 s

Faktiska siffror inkommer när Sprint 22 mergas till `main` och
benchmark-suiten körs.
