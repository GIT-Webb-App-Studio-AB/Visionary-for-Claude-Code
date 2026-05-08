// voice-to-motion.test.mjs — Sprint 22 Task 40.5
// node --test target.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  extractPitchContour,
  extractEnvelope,
  prosodyToMotion,
  __INTERNAL__,
} from '../voice-to-motion.mjs';

// ─── Synthetic-signal helpers ───────────────────────────────────────────

function sineTone({ freqHz, sampleRate, durationS, amplitude = 0.5 }) {
  const n = Math.floor(sampleRate * durationS);
  const out = new Float32Array(n);
  const w = 2 * Math.PI * freqHz / sampleRate;
  for (let i = 0; i < n; i += 1) out[i] = amplitude * Math.sin(w * i);
  return out;
}

function rampUp({ sampleRate, durationS, freqHz = 200 }) {
  // Sine carrier with linearly increasing amplitude — peak at the end.
  const n = Math.floor(sampleRate * durationS);
  const out = new Float32Array(n);
  const w = 2 * Math.PI * freqHz / sampleRate;
  for (let i = 0; i < n; i += 1) {
    const env = i / (n - 1); // 0..1
    out[i] = env * Math.sin(w * i);
  }
  return out;
}

function fastAttack({ sampleRate, durationS, freqHz = 200 }) {
  // Sine carrier with very fast attack (peak in first 10%) then exponential decay.
  const n = Math.floor(sampleRate * durationS);
  const out = new Float32Array(n);
  const w = 2 * Math.PI * freqHz / sampleRate;
  const attackEnd = Math.floor(n * 0.05);
  for (let i = 0; i < n; i += 1) {
    let env;
    if (i < attackEnd) {
      env = i / attackEnd;
    } else {
      env = Math.exp(-3 * (i - attackEnd) / (n - attackEnd));
    }
    out[i] = env * Math.sin(w * i);
  }
  return out;
}

// Build a synthetic pitch contour where pitch rises linearly from start to end.
function risingPitchContour({ startHz = 180, endHz = 260, frames = 60 } = {}) {
  const out = [];
  for (let i = 0; i < frames; i += 1) {
    out.push(startHz + (endHz - startHz) * (i / (frames - 1)));
  }
  return out;
}

// ─── Tests ──────────────────────────────────────────────────────────────

test('extractPitchContour recovers ~220 Hz from a clean sine tone', () => {
  const sr = 16000;
  const buf = sineTone({ freqHz: 220, sampleRate: sr, durationS: 1.0 });
  const contour = extractPitchContour(buf, sr);
  assert.ok(contour.length > 0, 'contour should have frames');
  const voiced = contour.filter((v) => Number.isFinite(v) && v > 0);
  assert.ok(voiced.length > 0, 'sine should produce voiced frames');
  const mean = voiced.reduce((s, v) => s + v, 0) / voiced.length;
  // Allow ±5 Hz tolerance — autocorrelation is integer-lag.
  assert.ok(Math.abs(mean - 220) < 8, `expected ≈220 Hz, got ${mean}`);
});

test('extractPitchContour returns [] on degenerate inputs', () => {
  assert.deepEqual(extractPitchContour(null, 16000), []);
  assert.deepEqual(extractPitchContour(new Float32Array(0), 16000), []);
  assert.deepEqual(extractPitchContour(new Float32Array(1000), 0), []);
});

test('extractEnvelope on a ramp-up signal peaks at the end', () => {
  const sr = 16000;
  const buf = rampUp({ sampleRate: sr, durationS: 1.0 });
  const env = extractEnvelope(buf, sr, 50);
  assert.ok(env.length > 5, 'env should have multiple windows');
  let peakIdx = 0;
  for (let i = 1; i < env.length; i += 1) {
    if (env[i] > env[peakIdx]) peakIdx = i;
  }
  // Peak should be in the latter half of the envelope.
  assert.ok(peakIdx > env.length / 2, `expected peak in 2nd half, got idx ${peakIdx}/${env.length}`);
});

test('prosodyToMotion: high-variance pitch produces high stiffness', () => {
  // Wide oscillation 150 → 350 Hz
  const wide = [];
  for (let i = 0; i < 60; i += 1) wide.push(150 + 200 * (i % 2));
  const env = new Array(20).fill(0.5);
  const out = prosodyToMotion({ pitchContour: wide, envelope: env, totalDurationS: 1 });
  // stiffness scales 200..600
  assert.ok(out.spring.stiffness >= 500, `expected high stiffness, got ${out.spring.stiffness}`);
});

test('prosodyToMotion: rising pitch produces bounce > 0', () => {
  const rising = risingPitchContour({ startHz: 150, endHz: 280, frames: 60 });
  const env = new Array(20).fill(0.5);
  const out = prosodyToMotion({ pitchContour: rising, envelope: env, totalDurationS: 1 });
  assert.ok(out.spring.bounce > 0, `expected bounce > 0, got ${out.spring.bounce}`);
  assert.ok(out.spring.bounce <= 0.6, `bounce must be clamped ≤ 0.6, got ${out.spring.bounce}`);
});

test('prosodyToMotion: falling pitch produces bounce = 0', () => {
  const falling = risingPitchContour({ startHz: 280, endHz: 150, frames: 60 });
  const env = new Array(20).fill(0.5);
  const out = prosodyToMotion({ pitchContour: falling, envelope: env, totalDurationS: 1 });
  assert.equal(out.spring.bounce, 0);
});

test('prosodyToMotion: fast attack yields low mass', () => {
  // Envelope: peak at index 1 of 20
  const env = [0.1, 1.0, 0.8, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.18, 0.15, 0.12, 0.1, 0.08, 0.06, 0.05, 0.04, 0.03, 0.02, 0.01];
  const flatPitch = new Array(30).fill(220);
  const out = prosodyToMotion({ pitchContour: flatPitch, envelope: env, totalDurationS: 1 });
  // mass scales 0.5 .. 2.0; with attack at 1/20 = 0.05, mass ≈ 0.575
  assert.ok(out.spring.mass < 1.0, `expected mass < 1.0 for fast attack, got ${out.spring.mass}`);
});

test('prosodyToMotion: slow attack yields high mass', () => {
  // Envelope: peak near the end (slow attack)
  const env = [];
  for (let i = 0; i < 20; i += 1) env.push(i / 20);
  const flatPitch = new Array(30).fill(220);
  const out = prosodyToMotion({ pitchContour: flatPitch, envelope: env, totalDurationS: 1 });
  assert.ok(out.spring.mass > 1.2, `expected mass > 1.2 for slow attack, got ${out.spring.mass}`);
});

test('prosodyToMotion output respects Motion v12 spring contract', () => {
  const flatPitch = new Array(30).fill(220);
  const env = new Array(20).fill(0.5);
  const out = prosodyToMotion({ pitchContour: flatPitch, envelope: env, totalDurationS: 1 });

  // type
  assert.equal(out.spring.type, 'spring');

  // bounce ∈ [0, 1] (Motion v12 contract)
  assert.ok(out.spring.bounce >= 0 && out.spring.bounce <= 1, `bounce out of range: ${out.spring.bounce}`);

  // visualDuration ∈ [0.2, 1.0] s by our mapping
  assert.ok(out.spring.visualDuration >= 0.2 && out.spring.visualDuration <= 1.0,
    `visualDuration out of range: ${out.spring.visualDuration}`);

  // legacy fields populated
  assert.ok(out.spring.stiffness >= 200 && out.spring.stiffness <= 600);
  assert.ok(out.spring.damping >= 15 && out.spring.damping <= 35);
  assert.ok(out.spring.mass >= 0.5 && out.spring.mass <= 2.0);

  // raw_metrics present
  assert.ok(out.raw_metrics);
  assert.equal(typeof out.raw_metrics.pitchMean, 'number');
  assert.equal(typeof out.raw_metrics.attackTime, 'number');
});

test('prosodyToMotion is deterministic — same input → same output', () => {
  const flatPitch = new Array(30).fill(220);
  const env = new Array(20).fill(0.5);
  const a = prosodyToMotion({ pitchContour: flatPitch, envelope: env, totalDurationS: 1 });
  const b = prosodyToMotion({ pitchContour: flatPitch, envelope: env, totalDurationS: 1 });
  assert.deepEqual(a, b);
});

test('prosodyToMotion handles all-unvoiced contour gracefully', () => {
  const allNull = new Array(30).fill(null);
  const env = new Array(20).fill(0.5);
  const out = prosodyToMotion({ pitchContour: allNull, envelope: env, totalDurationS: 1 });
  // No pitch info → bounce 0, stiffness at floor
  assert.equal(out.spring.bounce, 0);
  assert.equal(out.spring.stiffness, 200);
});

test('end-to-end: synthetic fast-attack signal → low-mass + non-trivial spring', () => {
  const sr = 16000;
  const buf = fastAttack({ sampleRate: sr, durationS: 1.0, freqHz: 220 });
  const contour = extractPitchContour(buf, sr);
  const env = extractEnvelope(buf, sr, 50);
  const out = prosodyToMotion({ pitchContour: contour, envelope: env, totalDurationS: 1 });
  assert.ok(out.spring.mass < 1.0, `fast attack should yield low mass, got ${out.spring.mass}`);
  assert.ok(out.spring.visualDuration >= 0.2);
});

test('__INTERNAL__ exposes the documented constants', () => {
  assert.equal(__INTERNAL__.HZ_FLOOR, 60);
  assert.equal(__INTERNAL__.HZ_CEILING, 1500);
  assert.equal(__INTERNAL__.FRAME_RATE_HZ, 30);
  assert.equal(__INTERNAL__.ENVELOPE_WINDOW_MS, 50);
});
