// mic-recorder.mjs — Sprint 22 Task 40.4
// Browser-mic recording orchestrator for `/visionary-voice`.
//
// Hooks cannot directly invoke MCP tools — they run in the harness's
// pre/post-tool process and only emit `additionalContext` for the next
// agent turn. This module therefore builds an instruction-block that the
// hook prints; the agent's next turn picks it up, runs the Playwright
// browser_evaluate calls, decodes the audio, and feeds it into
// voice-to-motion.
//
// The instruction-block is deliberately self-contained and copy-paste
// safe. We pin a small inline recorder script so behaviour doesn't drift
// when Playwright versions change.

const DEFAULT_DURATION_S = 5;
const MIN_DURATION_S = 2;
const MAX_DURATION_S = 30;

/**
 * Build a step-by-step instruction-block that the agent's next turn must
 * follow to capture mic audio via Playwright.
 *
 * @param {{outputPath: string, durationS?: number}} opts
 * @returns {string} instruction text (UTF-8, multi-line, human-readable)
 */
export function buildMicInstructions({ outputPath, durationS = DEFAULT_DURATION_S }) {
  if (!outputPath || typeof outputPath !== 'string') {
    throw new Error('buildMicInstructions: outputPath is required');
  }
  const duration = clampDuration(durationS);
  const ms = duration * 1000;

  return `
VOICE RECORDING REQUEST (Sprint 22 — /visionary-voice)
======================================================

Target output: ${outputPath}
Duration:      ${duration}s (clamped to [${MIN_DURATION_S}, ${MAX_DURATION_S}])

NEXT-TURN ACTIONS for the agent:

1. Grant mic permission to the Playwright context (one-time per session):
     await context.grantPermissions(['microphone']);
   When invoking via mcp__playwright__browser_navigate, ensure the launch
   args include --use-fake-ui-for-media-stream OR rely on a previously-
   granted system-level permission.

2. Navigate to a blank page (or the current preview):
     mcp__playwright__browser_navigate { url: "about:blank" }

3. Inject the recording script via mcp__playwright__browser_evaluate:

\`\`\`js
async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise((res) => { recorder.onstop = res; });
  recorder.start();
  await new Promise((r) => setTimeout(r, ${ms}));
  recorder.stop();
  await stopped;
  stream.getTracks().forEach((t) => t.stop());
  const blob = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' });
  const buf = await blob.arrayBuffer();
  let bin = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  window.__visionary_voice__ = { b64: btoa(bin), mime: blob.type, bytes: bytes.length };
  return window.__visionary_voice__;
}
\`\`\`

4. Read the captured payload and decode it to ${outputPath}:
     - mcp__playwright__browser_evaluate \`() => window.__visionary_voice__\`
     - Decode base64 with Buffer.from(b64, 'base64') in the agent process
     - Write the bytes to ${outputPath}

5. (Optional) Verify with ffprobe / file-size > 1KB.

PERMISSION FLOW:
- Headless Chromium: pass --use-fake-ui-for-media-stream so getUserMedia
  resolves without a UI prompt. Without that flag, getUserMedia rejects
  with NotAllowedError.
- Headed: the OS prompts the user; if denied, fall back to file mode.

FALLBACK:
- If the browser cannot capture mic (CI, no audio device, denied
  permission), the user can re-run as:
    /visionary-voice <path-to-pre-recorded-audio.wav|.webm|.mp3>
  voice-to-motion.mjs accepts any decoded Float32Array, so the source of
  the audio is irrelevant.

PRIVACY:
- Audio never leaves the user's machine. The blob is base64-encoded only
  to traverse the Playwright eval boundary; the agent decodes it locally
  and feeds it into voice-to-motion in-process.
`.trim();
}

/**
 * Decode a base64 string (as produced by buildMicInstructions step 3)
 * into a raw Buffer suitable for writing to disk.
 *
 * Kept tiny on purpose — the actual audio decode (webm/wav/mp3 → PCM)
 * happens downstream in voice-to-motion's caller, which knows what
 * format the recording used. This helper just round-trips the wire
 * format.
 *
 * @param {string} base64Audio
 * @returns {Buffer}
 */
export function decodeBase64ToBuffer(base64Audio) {
  if (typeof base64Audio !== 'string' || base64Audio.length === 0) {
    throw new Error('decodeBase64ToBuffer: input must be a non-empty base64 string');
  }
  return Buffer.from(base64Audio, 'base64');
}

/**
 * Decode a base64-encoded raw PCM mono Float32 stream into a Float32Array.
 * This is a fallback for callers who already have raw PCM (no container).
 * Real-world recordings will be webm/opus and need a separate decoder.
 *
 * @param {string} base64Pcm
 * @returns {Float32Array}
 */
export async function decodeAudioBuffer(base64Pcm) {
  const buf = decodeBase64ToBuffer(base64Pcm);
  // Treat as little-endian 32-bit floats. Length must be a multiple of 4.
  if (buf.length % 4 !== 0) {
    throw new Error('decodeAudioBuffer: byte length must be a multiple of 4 for Float32');
  }
  const out = new Float32Array(buf.length / 4);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = buf.readFloatLE(i * 4);
  }
  return out;
}

function clampDuration(d) {
  if (!Number.isFinite(d) || d <= 0) return DEFAULT_DURATION_S;
  return Math.max(MIN_DURATION_S, Math.min(MAX_DURATION_S, d));
}

export const __INTERNAL__ = {
  DEFAULT_DURATION_S,
  MIN_DURATION_S,
  MAX_DURATION_S,
  clampDuration,
};
