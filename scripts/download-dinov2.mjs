#!/usr/bin/env node
// Lazy-downloader for DINOv2-small ONNX. Run manually:
//   node scripts/download-dinov2.mjs
// Saves to ~/.visionary/models/dinov2-small.onnx and verifies SHA-256.

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = dirname(dirname(__filename));

const MODEL_URL = 'https://huggingface.co/onnx-community/dinov2-small/resolve/main/onnx/model.onnx';
const TARGET = join(homedir(), '.visionary', 'models', 'dinov2-small.onnx');
const CHECKSUM_PATH = join(REPO, 'models', 'dinov2-small.sha256');

async function main() {
  if (existsSync(TARGET)) {
    process.stderr.write(`Already present: ${TARGET}\n`);
    return;
  }
  await mkdir(dirname(TARGET), { recursive: true });
  process.stderr.write(`Downloading ${MODEL_URL}\n`);
  const res = await fetch(MODEL_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(TARGET, buf);
  const got = createHash('sha256').update(buf).digest('hex');
  process.stderr.write(`SHA-256: ${got}\n`);
  if (existsSync(CHECKSUM_PATH)) {
    const expected = (await readFile(CHECKSUM_PATH, 'utf8')).trim().split(/\s+/)[0];
    if (got !== expected) {
      throw new Error(`Checksum mismatch: expected ${expected}, got ${got}`);
    }
  }
  process.stderr.write(`Saved to ${TARGET}\n`);
}

main().catch((err) => {
  process.stderr.write(`[error] ${err.message}\n`);
  process.exit(1);
});
