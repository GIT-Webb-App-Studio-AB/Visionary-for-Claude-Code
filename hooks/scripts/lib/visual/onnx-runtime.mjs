// ONNX runtime wrapper — Sprint 11.
// Loads onnxruntime-web lazily; falls back to a synthetic-mode runtime
// when the package is unavailable so the rest of the visual pipeline
// can no-op gracefully on machines without the full ML stack.

import { existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = dirname(dirname(dirname(dirname(__filename))));

let _ortModule = null;
let _ortStatus = 'unloaded'; // unloaded | loaded | unavailable
const VERBOSE = process.env.VISIONARY_VISUAL_VERBOSE === '1';

export async function tryLoadOrt() {
  if (_ortStatus === 'loaded') return _ortModule;
  if (_ortStatus === 'unavailable') return null;
  try {
    const mod = await import('onnxruntime-web');
    _ortModule = mod;
    _ortStatus = 'loaded';
    if (VERBOSE) process.stderr.write('[visual] onnxruntime-web loaded\n');
    return mod;
  } catch (err) {
    _ortStatus = 'unavailable';
    if (VERBOSE) process.stderr.write(`[visual] onnxruntime-web unavailable: ${err.message}\n`);
    return null;
  }
}

export function getStatus() {
  return _ortStatus;
}

const _modelCache = new Map();

export async function loadModel(modelPath) {
  if (_modelCache.has(modelPath)) return _modelCache.get(modelPath);
  const ort = await tryLoadOrt();
  if (!ort) return null;
  if (!existsSync(modelPath)) {
    if (VERBOSE) process.stderr.write(`[visual] model not found: ${modelPath}\n`);
    return null;
  }
  try {
    // Prefer WebGPU when available; fall back to CPU
    const session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['webgpu', 'wasm'],
    });
    _modelCache.set(modelPath, session);
    if (VERBOSE) process.stderr.write(`[visual] model loaded: ${modelPath}\n`);
    return session;
  } catch (err) {
    if (VERBOSE) process.stderr.write(`[visual] model load failed: ${err.message}\n`);
    return null;
  }
}

export function defaultModelPath() {
  // Lazy-download target: ~/.visionary/models/dinov2-small.onnx
  return join(homedir(), '.visionary', 'models', 'dinov2-small.onnx');
}

export async function modelChecksumOk(modelPath, expectedSha256) {
  if (!existsSync(modelPath)) return false;
  if (!expectedSha256) return true; // no checksum to verify against
  const { createHash } = await import('node:crypto');
  const buf = await readFile(modelPath);
  const got = createHash('sha256').update(buf).digest('hex');
  return got === expectedSha256;
}
