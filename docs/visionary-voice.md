# /visionary-voice — Röst som motion-design

## Varför detta finns

Att tweaka motion-tokens via text är en översättningsförlust. Du säger
"snappier" och hoppas att generatorn tolkar det som du menar; den
tolkar det som ett stiffness-bump och du tolkar det som "snabbare
duration utan overshoot". Mitt emellan ligger nyansen som inte ryms i
ord.

Röst löser det. Du säger "snap!" och attack-rampen i din egen volym-
kurva *är* den motion-rampen du vill ha. Du säger "smoooooth" och
sustain-tiden i din vokal *är* visualDuration. Du säger "wah-zip" och
pitch-höjningen i slutet *är* bouncen som ska finnas i utgången.

Det här är synesthesia som faktiskt funkar — pitch, envelope och
sustain är direkt observerbara prosodiska features med tydliga
matematiska motsvarigheter i Motion v12-spring-parametrar. Vi behöver
inte gissa vad du menar; vi mäter.

`/visionary-voice` är därför inte en "talad textprompt" — det är en
direkt kanal från ditt motoriska/perceptuella system till spring-
tokens. Mer naturligt än text för precis det här problemet.

## Mappning: prosodi → Motion v12

Mappningen är medvetet enkel så att den går att förklara i en receipt
till användaren och så att den är deterministisk (samma input → samma
output, alltid).

| Prosodisk feature      | Motion v12-token         | Utfall i upplevd rörelse                                |
| ---------------------- | ------------------------ | ------------------------------------------------------- |
| Pitch-kontur-varians   | `stiffness` (legacy)     | Stora pitch-svängar ⇒ snäppt fjäder                     |
| Envelope-attack-rate   | `mass`                   | Snabb attack ⇒ låg massa (lätt); långsam ⇒ hög massa    |
| Envelope-sustain       | `visualDuration`         | Lång sustain ⇒ token dröjer kvar (0.2 – 1.0 s)          |
| Pitch-slut-vs-medel    | `bounce`                 | Slutar uppåt ⇒ uplift (0 – 0.6); slutar nedåt ⇒ dämpad  |

Ett konkret exempel:

```ts
// Vokalisering: "smoooooth ... pop"  (lång mjuk sustain, snabb pitch-
//                                     stigning i slutet)
{
  type: 'spring',
  bounce: 0.35,             // pitch-tail > pitch-mean
  visualDuration: 0.8,      // sustain-median nära peak
  // legacy:
  stiffness: 280,           // moderat pitch-varians
  damping: 24,
  mass: 1.4,                // långsam attack ⇒ tyngre
}
```

```ts
// Vokalisering: "snap!"  (mycket kort, snabb attack, ingen sustain)
{
  type: 'spring',
  bounce: 0.0,              // pitch håller sig ihop, ingen tail-up
  visualDuration: 0.2,      // sustain ≈ 0
  stiffness: 460,           // pitch-varians via accent
  damping: 18,
  mass: 0.55,               // snabb attack ⇒ lätt
}
```

## Browser-permission-flow

Visionary kör röstinspelningen via Playwright eftersom hooks inte kan
prata direkt med MCP-servrar — hook-processen emitterar en
instruktions-block som agentens nästa tur följer.

```
hook → instruktions-block med outputPath + duration
       ↓
agent kör mcp__playwright__browser_navigate (about:blank)
       ↓
agent injicerar inspelnings-script via mcp__playwright__browser_evaluate
       ↓
browser kör navigator.mediaDevices.getUserMedia({audio: true})
       ↓
[OS prompt om mic-permission, eller --use-fake-ui-for-media-stream]
       ↓
MediaRecorder spelar in N sekunder (default 5s)
       ↓
audio-blob → ArrayBuffer → base64 → window.__visionary_voice__
       ↓
agent läser variabeln, decodar base64, skriver till outputPath
```

### Plattform-beteende

| Plattform           | Mic-läge                                 | Anmärkning                                 |
| ------------------- | ---------------------------------------- | ------------------------------------------ |
| Headless Chromium   | OK med `--use-fake-ui-for-media-stream`  | Launch-flag krävs för CI-headless          |
| Headed Chromium     | OS-prompt                                | Första gången; remember-decision sparas    |
| CI utan ljudkort    | File-only                                | Använd förbestämda audio-fixtures          |

### Fallback: pre-inspelad audio-fil

Om mic är otillgänglig (CI, ingen mic, permission denied) — kör med
en sökväg som första argument:

```
/visionary-voice path/to/sample.wav
/visionary-voice path/to/sample.webm --component src/Card.tsx
```

`prosodyToMotion()` bryr sig inte om var audio kommer ifrån — så länge
det går att decoda till mono Float32 i [-1, 1] med en känd sample-
rate. Hela mic-pathen är bara en bekvämlighet.

## Audio-format som stöds

Beslutet om vad som decodas ligger i agent-laget, inte i
`voice-to-motion.mjs`. Modulen tar Float32Array + sampleRate och bryr
sig inte om container.

Praktisk-stöd-tabell:

| Format        | Stöd  | Decode-väg                                  |
| ------------- | ----- | ------------------------------------------- |
| `.wav` (PCM)  | Ja    | Inbyggt — header-parsning + buffer-extract  |
| `.webm/opus`  | Ja    | Via `audio-decode` eller Web Audio API      |
| `.mp3`        | Ja    | Via `audio-decode` eller `mp3-parser`       |
| `.flac`       | Ja    | Via `audio-decode`                          |
| Raw Float32   | Ja    | `decodeAudioBuffer()` direkt                |

Default mic-recorder spelar in i `audio/webm;codecs=opus` (vad
MediaRecorder ger oss i Chromium). Fallback-formatet är browserns
default — Visionary förlitar sig på MIME-typen som `MediaRecorder`
rapporterar.

## Privacy

Audio lämnar aldrig din maskin. Här är hela databanan:

1. Mic-input → MediaRecorder (i browser, lokalt)
2. Blob → ArrayBuffer → base64-sträng (i browser-process)
3. Base64 → agent-process via Playwright eval-bridge (lokal IPC)
4. Agent skriver bytes till disk (eller decodar in-memory)
5. PCM Float32 → `prosodyToMotion()` returnerar siffror
6. Ljud-buffer släpps; receipt innehåller endast aggregerade metrics

Trace-events (sprint 22):

```jsonc
{
  "ts": "...",
  "kind": "voice_prosody_extracted",
  "data": {
    "pitchMean": 218.4,
    "pitchVariance": 1840.2,
    "attackTime": 0.34,
    "sustainMedian": 0.21,
    "voicedFrames": 38,
    "envelopeFrames": 100,
    "totalDurationS": 5.0
  }
}
```

Inget audio-content i traces. Inget upload. Ingen extern API-anrop.

## Accessibility

Röst är **alltid optional**. Visionary ser röst som en
extra-input-väg, inte en primär. Allt motion-tweaking går också via:

- **Keyboard-route**: `/visionary-motion <text-vibe>` med 12 namngivna
  vibes (energetic, softer, snappy, etc.). Helt deterministisk,
  inget mic-beroende.
- **Direct token-edit**: redigera `tokens/motion.tokens.json` direkt;
  source-of-truth ligger där.
- **`--preview`-flag**: testa effekten av en röstprompt utan att
  applicera den. Användbart för användare som vill se *vad* mappningen
  gör innan den får skriva-access.

WCAG 2.1 SC 2.5.4 (Motion Actuation): röst-input är en motion-
actuation-väg och måste ha alternativ. Vi uppfyller det via
text-pathen `/visionary-motion`.

WCAG 2.1 SC 2.3.3 (Animation from Interactions): genererat motion
respekterar `prefers-reduced-motion` oavsett om det skapades via röst
eller text. Den biten lever i den genererade komponentens CSS, inte
i tokens.

## Minimum-längd-kontrakt

Inspelningar < 2 s avvisas innan extraktion. Pitch-autocorrelation +
envelope-statistik kräver tillräckligt många frames för stabila värden.
Vid 30 frames/s pitch-extraction och 50 ms envelope-fönster ger 2 s
60 pitch-frames + 40 envelope-fönster — minimum för att medianer och
varians ska vara meningsfulla. Sub-2 s-samples ger volatil mappning
som upplevs godtycklig; early-fail är hederligare.

```
/visionary-voice  --duration 1
→ Error: minimum 2 sekunder krävs för stabil prosodi-extraktion.
  Spela in igen, eller passera --duration 5 (default).
```

Max-duration är 30 s — längre än så börjar prosodin medelvärdas till
intetsägande siffror, och Visionary vill inte att du läser upp ett helt
manus för att tweaka en spring.

## Setup-krav

För live-mic-inspelning:

1. Playwright installerat och tillgängligt via MCP
   (`mcp__playwright__*`-tools).
2. Chromium kan startas med `--use-fake-ui-for-media-stream` (för
   headless) eller med headed-mode + OS-permission.
3. Macbook + Chrome: ge Chrome mic-permission i System Settings →
   Privacy & Security → Microphone första gången.
4. Linux: PulseAudio eller PipeWire körande; ingen extra config.
5. Windows: ge Chrome mic-permission via Windows Settings första
   gången.

För file-mode: bara att passera en path. Ingen mic-konfig behövs.

## Källmoduler

- `commands/visionary-voice.md` — command-doc, argument-parsing
- `hooks/scripts/lib/voice/voice-to-motion.mjs` — pitch-, envelope-,
  prosodi-mappning
- `hooks/scripts/lib/voice/mic-recorder.mjs` — Playwright-instruktions-
  block + base64-decode
- `hooks/scripts/lib/voice/__tests__/*.test.mjs` — synthetic-signal-
  tester, edge-case-coverage

## Designprinciper

1. **Mätbarhet före tolkning**. Vi extraherar kvantifierbara prosodi-
   features, inte "känslan" av rösten. Det gör mappningen reproducerbar
   och förklarbar.
2. **Direkt mappning, inte ML**. Ingen modell tränad på par
   (audio, motion-token). Bara fysik: pitch-stat → stiffness-token,
   envelope-form → mass + visualDuration. Förstörbart i en pull-request,
   inte i en model-card.
3. **Gracefull-fallback överallt**. Mic-fail → file. File-fail →
   text-prompt. Text-fail → token-edit. Aldrig en återvändsgränd.
4. **Privacy-default**. Lokal databehandling, inga externa anrop.
   Receipt-data är aggregat, inte audio.
5. **Reduce-motion respekteras**. Det Visionary genererar via röst
   måste fortfarande passera samma reduced-motion-gates som allt annat.

## Definition av lyckad voice-tweak

1. Inspelning ≥ 2 s, ≤ 30 s, voiced > 0 frames
2. `prosodyToMotion()` returnerar valid Motion v12-spring
   (bounce ∈ [0, 1], visualDuration ∈ [0.2, 1.0] s)
3. Target-komponent identifierad (latest trace eller `--component`)
4. Spring-tokens applicerade (eller diff-rapporterad i `--preview`)
5. Receipt med raw_metrics + applied spring publicerad
