// DINOv2 embedding extractor — Sprint 11.
// Input: PNG/JPEG buffer or path. Output: Float32Array(768) L2-normalised
// or null when runtime / model is unavailable.

import { readFile } from 'node:fs/promises';
import { tryLoadOrt, loadModel, defaultModelPath } from './onnx-runtime.mjs';

const IMG_SIZE = 224;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

async function preprocessImage(input) {
  // input: Buffer | string (path)
  const ort = await tryLoadOrt();
  if (!ort) return null;

  let buffer;
  if (typeof input === 'string') {
    buffer = await readFile(input);
  } else if (Buffer.isBuffer(input)) {
    buffer = input;
  } else {
    return null;
  }

  // Use sharp if available for decode + resize
  let pixels = null;
  try {
    const sharp = (await import('sharp')).default;
    const { data, info } = await sharp(buffer)
      .resize(IMG_SIZE, IMG_SIZE, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });
    pixels = { data: new Uint8ClampedArray(data), width: info.width, height: info.height, channels: info.channels };
  } catch {
    return null;
  }

  if (!pixels) return null;

  const float = new Float32Array(3 * IMG_SIZE * IMG_SIZE);
  let idx = 0;
  // NCHW: channel-major
  for (let c = 0; c < 3; c++) {
    for (let y = 0; y < IMG_SIZE; y++) {
      for (let x = 0; x < IMG_SIZE; x++) {
        const pxIdx = (y * IMG_SIZE + x) * pixels.channels + c;
        const v = pixels.data[pxIdx] / 255.0;
        float[idx++] = (v - MEAN[c]) / STD[c];
      }
    }
  }
  return new ort.Tensor('float32', float, [1, 3, IMG_SIZE, IMG_SIZE]);
}

function l2Normalize(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i] * arr[i];
  const norm = Math.sqrt(sum) || 1;
  const out = new Float32Array(arr.length);
  for (let i = 0; i < arr.length; i++) out[i] = arr[i] / norm;
  return out;
}

export async function extractEmbedding(input, options = {}) {
  const session = await loadModel(options.modelPath || defaultModelPath());
  if (!session) return null;
  const tensor = await preprocessImage(input);
  if (!tensor) return null;
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  const result = await session.run({ [inputName]: tensor });
  const raw = result[outputName].data;
  // Take CLS token (first 768 dims) when model returns patch tokens too
  const clsToken = raw.length > 768 ? raw.slice(0, 768) : raw;
  return l2Normalize(clsToken);
}

export function syntheticEmbedding(seed) {
  // Deterministic embedding for tests. Not a real DINOv2 output.
  const arr = new Float32Array(768);
  let s = seed | 0 || 1;
  for (let i = 0; i < 768; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    arr[i] = ((s & 0xffff) / 0xffff) - 0.5;
  }
  return l2Normalize(arr);
}
