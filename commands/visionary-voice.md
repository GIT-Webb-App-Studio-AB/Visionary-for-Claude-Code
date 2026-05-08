---
description: Re-tune motion tokens on the most recent generated component using vocal prosody. User vocalises a movement ("smoooth ... snap") and Visionary maps pitch/envelope/sustain to Motion v12 spring tokens.
allowed-tools: Read, Edit, Write, Bash, Glob, mcp__playwright__browser_navigate, mcp__playwright__browser_evaluate
argument-hint: [audio-path] [--duration <seconds>] [--component <path>] [--preview]
---

# /visionary-voice

Speak the motion you want. Visionary listens, extracts the prosodic shape
of your vocalisation, and maps it onto the Motion v12 spring tokens of
your most recently generated component. Backed by
`hooks/scripts/lib/voice/voice-to-motion.mjs` and
`hooks/scripts/lib/voice/mic-recorder.mjs`.

## Usage

```
/visionary-voice                              # records 5s from the mic
/visionary-voice --duration 8                 # records 8s from the mic
/visionary-voice path/to/sample.webm          # uses a pre-recorded file
/visionary-voice path/to/sample.wav --preview # dry-run, no edits applied
/visionary-voice --component src/Card.tsx     # target a specific file
```

The audio source can be:

- **Live mic** (default) — Playwright captures from `navigator.mediaDevices.getUserMedia`
- **Pre-recorded file** — pass any path. webm/wav/mp3 work as long as the agent can decode them.

## What gets mapped

| Prosodic feature      | Maps to Motion v12 token        | Intuition                                                |
| --------------------- | ------------------------------- | -------------------------------------------------------- |
| Pitch contour variance| `stiffness` (legacy proxy)      | Wide pitch swings ⇒ snappy spring                        |
| Envelope attack rate  | `mass`                          | Quick attack ⇒ light/airy; slow attack ⇒ heavy/weighted  |
| Envelope sustain      | `visualDuration` (0.2 – 1.0 s)  | Long sustain ⇒ token lingers                             |
| Pitch end-vs-mean     | `bounce` (0 – 0.6)              | Voice ends up ⇒ uplift; voice ends down ⇒ damped         |

Output is a Motion-v12 spring object:

```ts
{
  type: 'spring',
  bounce: 0.32,
  visualDuration: 0.42,
  // legacy fallback for v11 styles:
  stiffness: 480,
  damping: 22,
  mass: 0.85,
}
```

## Pipeline

1. **Resolve audio source.**
   - If an argument is provided AND it's a path that exists on disk, use it.
   - Otherwise fall through to live mic-capture (see step 2).

2. **Capture (live-mic path).** The hook emits an instruction-block via
   `buildMicInstructions({ outputPath, durationS })`. The agent's next
   turn:
   - calls `mcp__playwright__browser_navigate` to a blank page,
   - injects the recorder script via `mcp__playwright__browser_evaluate`,
   - reads `window.__visionary_voice__`,
   - decodes base64 → bytes → writes them to the resolved output path.

3. **Decode → PCM Float32.** Whatever the container (webm/opus, wav,
   mp3, raw), the agent decodes the audio to mono Float32 in [-1, 1]
   plus the source sample-rate. (For `.wav`, no external dep needed; for
   `.webm` an audio-decode library is the simplest path.)

4. **Extract prosody.**
   ```js
   const contour = extractPitchContour(samples, sampleRate);
   const envelope = extractEnvelope(samples, sampleRate, 50);
   const motion = prosodyToMotion({
     pitchContour: contour,
     envelope,
     totalDurationS: samples.length / sampleRate,
   });
   ```

5. **Resolve target component.**
   - `--component <path>` overrides
   - otherwise read latest `traces/*.jsonl` for the most recent
     `generation_complete` event (same heuristic as `/visionary-motion`)

6. **Apply the spring tokens.** Locate the existing transition spec
   (DTCG `tokens/*.tokens.json`, JSX `transition={…}`, or CSS shorthand)
   and replace its spring values. With `--preview`, emit a side-by-side
   report instead of writing changes.

## Permission flow + cross-platform

| Platform | Mic-capture mode | Notes                                                   |
| -------- | ---------------- | ------------------------------------------------------- |
| Headless Chromium | OK with `--use-fake-ui-for-media-stream` | Required: launch flag must be set |
| Headed Chromium   | OS prompt        | First run prompts; remember-decision persists |
| CI (no audio device) | File-only       | Fall back to `/visionary-voice <path>` |

If `getUserMedia` rejects (permission denied, no device, headless
without the flag), the agent prints the file-fallback instruction and
exits cleanly — never silently records 5 s of silence.

## Privacy

The audio never leaves your machine. The Playwright base64 transport
crosses only the in-process eval-bridge; the agent decodes it locally
and discards the buffer once `prosodyToMotion()` returns its summary.
Receipts contain only the derived numerical metrics
(`pitchMean`, `attackTime`, `sustainMedian`, etc.), never the raw audio.

## Accessibility

Voice is **always optional**. Every motion-tweak `/visionary-voice`
performs is also reachable via:

- `/visionary-motion <text-vibe>` — keyboard-only, 12 named vibes
- direct token edits — DTCG `tokens/motion.tokens.json` is the source of truth

Users who can't (or don't want to) vocalise lose nothing.

## Minimum-length contract

Recordings shorter than 2 s get rejected before extraction — pitch
autocorrelation + envelope statistics need a meaningful number of frames
to produce stable values. Sub-2 s samples produce noisy mappings that
feel arbitrary; the early-fail is more honest.

## How Claude should drive this

When the user invokes `/visionary-voice`:

1. Read the user's argument string (after the command name).
2. If an arg looks like a path AND the path exists, skip step 3.
3. Otherwise emit `buildMicInstructions(...)` output and follow the
   numbered steps in the next turn.
4. Decode audio → run `extractPitchContour` + `extractEnvelope` →
   `prosodyToMotion`.
5. Resolve target component (latest trace or `--component`).
6. Apply patches via Edit (unless `--preview`).
7. Print a human-readable summary including the four mapped values and
   the chosen target file.
