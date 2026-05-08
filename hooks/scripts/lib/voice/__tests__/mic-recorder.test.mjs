// mic-recorder.test.mjs — Sprint 22 Task 40.5
// node --test target.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMicInstructions,
  decodeBase64ToBuffer,
  decodeAudioBuffer,
  __INTERNAL__,
} from '../mic-recorder.mjs';

test('buildMicInstructions returns a non-empty string', () => {
  const out = buildMicInstructions({ outputPath: '/tmp/voice.webm' });
  assert.equal(typeof out, 'string');
  assert.ok(out.length > 200, 'instructions should be substantial');
});

test('buildMicInstructions includes the duration parameter (default 5s)', () => {
  const out = buildMicInstructions({ outputPath: '/tmp/voice.webm' });
  assert.ok(out.includes('5s'), 'default 5s should be embedded');
  assert.ok(out.includes('5000'), 'milliseconds should be embedded for setTimeout');
});

test('buildMicInstructions honours an explicit durationS', () => {
  const out = buildMicInstructions({ outputPath: '/tmp/voice.webm', durationS: 8 });
  assert.ok(out.includes('8s'), 'requested 8s should be embedded');
  assert.ok(out.includes('8000'), 'milliseconds should be embedded');
});

test('buildMicInstructions clamps duration to [MIN_DURATION_S, MAX_DURATION_S]', () => {
  const tooShort = buildMicInstructions({ outputPath: '/tmp/voice.webm', durationS: 0.5 });
  assert.ok(tooShort.includes(`${__INTERNAL__.MIN_DURATION_S}s`),
    `should clamp to MIN_DURATION_S=${__INTERNAL__.MIN_DURATION_S}`);

  const tooLong = buildMicInstructions({ outputPath: '/tmp/voice.webm', durationS: 999 });
  assert.ok(tooLong.includes(`${__INTERNAL__.MAX_DURATION_S}s`),
    `should clamp to MAX_DURATION_S=${__INTERNAL__.MAX_DURATION_S}`);
});

test('buildMicInstructions embeds the outputPath', () => {
  const out = buildMicInstructions({ outputPath: 'C:/tmp/abc/voice.webm' });
  assert.ok(out.includes('C:/tmp/abc/voice.webm'),
    'outputPath should appear verbatim in instructions');
});

test('buildMicInstructions includes Playwright + permission hints', () => {
  const out = buildMicInstructions({ outputPath: '/tmp/v.webm' });
  assert.ok(out.includes('mcp__playwright__browser_evaluate'));
  assert.ok(out.includes('grantPermissions'));
  assert.ok(out.includes('use-fake-ui-for-media-stream'));
});

test('buildMicInstructions includes the file-fallback path', () => {
  const out = buildMicInstructions({ outputPath: '/tmp/v.webm' });
  assert.ok(out.includes('/visionary-voice <path-to-pre-recorded-audio'),
    'fallback instruction should be present');
});

test('buildMicInstructions includes a privacy disclosure', () => {
  const out = buildMicInstructions({ outputPath: '/tmp/v.webm' });
  assert.ok(out.includes('PRIVACY'));
  assert.ok(/never leaves the user/i.test(out));
});

test('buildMicInstructions throws on missing outputPath', () => {
  assert.throws(() => buildMicInstructions({}), /outputPath is required/);
  assert.throws(() => buildMicInstructions({ outputPath: '' }), /outputPath is required/);
});

test('decodeBase64ToBuffer round-trips bytes correctly', () => {
  const original = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]);
  const b64 = original.toString('base64');
  const round = decodeBase64ToBuffer(b64);
  assert.deepEqual(Array.from(round), Array.from(original));
});

test('decodeBase64ToBuffer rejects empty / non-string input', () => {
  assert.throws(() => decodeBase64ToBuffer(''), /non-empty base64/);
  assert.throws(() => decodeBase64ToBuffer(null), /non-empty base64/);
  assert.throws(() => decodeBase64ToBuffer(123), /non-empty base64/);
});

test('decodeAudioBuffer parses raw little-endian Float32 PCM', async () => {
  const samples = new Float32Array([0.0, 0.5, -0.5, 1.0, -1.0]);
  const buf = Buffer.alloc(samples.length * 4);
  for (let i = 0; i < samples.length; i += 1) buf.writeFloatLE(samples[i], i * 4);
  const b64 = buf.toString('base64');
  const decoded = await decodeAudioBuffer(b64);
  assert.equal(decoded.length, samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    assert.ok(Math.abs(decoded[i] - samples[i]) < 1e-6,
      `sample ${i}: expected ${samples[i]}, got ${decoded[i]}`);
  }
});

test('decodeAudioBuffer rejects misaligned byte length', async () => {
  // 5 bytes — not a multiple of 4
  const odd = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]).toString('base64');
  await assert.rejects(() => decodeAudioBuffer(odd), /multiple of 4/);
});
