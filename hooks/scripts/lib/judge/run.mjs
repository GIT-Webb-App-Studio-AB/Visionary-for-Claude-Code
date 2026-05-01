// Judge runner — Sprint 12.
// Lazy-imports @anthropic-ai/sdk; falls back to a no-op judge when the
// SDK is missing or ANTHROPIC_API_KEY is unset.

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname } from 'node:path';
import { canInvoke, recordInvocation } from './budget.mjs';
import { buildJudgePrompt } from './prompt.mjs';

const VERBOSE = process.env.VISIONARY_JUDGE_VERBOSE === '1';

let _sdkModule = null;
let _sdkStatus = 'unloaded';

async function trySdk() {
  if (_sdkStatus === 'loaded') return _sdkModule;
  if (_sdkStatus === 'unavailable') return null;
  try {
    _sdkModule = await import('@anthropic-ai/sdk');
    _sdkStatus = 'loaded';
    return _sdkModule;
  } catch {
    _sdkStatus = 'unavailable';
    return null;
  }
}

function mediaTypeFor(path) {
  const ext = extname(path).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/png';
}

function parseStrictJson(text) {
  if (!text) return null;
  try {
    const trimmed = text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(trimmed);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      ['A', 'B', 'tie'].includes(parsed.winner) &&
      typeof parsed.rationale === 'string' &&
      typeof parsed.confidence === 'number'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function runJudge({ dimension, screenshotA, screenshotB, briefSummary, model }) {
  const budget = canInvoke();
  if (!budget.ok) {
    return { winner: 'tie', confidence: 0, rationale: '', skipped: true, reason: budget.reason };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { winner: 'tie', confidence: 0, rationale: '', skipped: true, reason: 'no-api-key' };
  }

  const sdk = await trySdk();
  if (!sdk) {
    return { winner: 'tie', confidence: 0, rationale: '', skipped: true, reason: 'sdk-unavailable' };
  }

  const prompt = buildJudgePrompt({ dimension, screenshotA, screenshotB, briefSummary });

  const imageBlocks = [];
  for (const img of prompt.images) {
    if (!existsSync(img.path)) {
      return { winner: 'tie', confidence: 0, rationale: '', skipped: true, reason: `image-missing:${img.label}` };
    }
    const buf = await readFile(img.path);
    imageBlocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaTypeFor(img.path),
        data: buf.toString('base64'),
      },
    });
  }

  const Anthropic = sdk.default ?? sdk.Anthropic ?? sdk;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const start = Date.now();
  let response;
  try {
    response = await client.messages.create({
      model: model || process.env.VISIONARY_JUDGE_MODEL || 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            ...imageBlocks,
            { type: 'text', text: prompt.text },
          ],
        },
      ],
    });
  } catch (err) {
    if (VERBOSE) process.stderr.write(`[judge] api error: ${err.message}\n`);
    return { winner: 'tie', confidence: 0, rationale: '', skipped: true, reason: `api-error:${err.message}` };
  }
  const latencyMs = Date.now() - start;

  recordInvocation(0.5);

  const text = response?.content?.[0]?.text || '';
  const parsed = parseStrictJson(text);
  if (parsed) {
    return { ...parsed, dimension, latency_ms: latencyMs, raw: text };
  }

  // 1 retry with stricter instruction
  try {
    const retry = await client.messages.create({
      model: model || process.env.VISIONARY_JUDGE_MODEL || 'claude-sonnet-4-6',
      max_tokens: 128,
      messages: [
        {
          role: 'user',
          content: [
            ...imageBlocks,
            { type: 'text', text: prompt.text + '\n\nReturn ONLY the JSON object. No markdown fences.' },
          ],
        },
      ],
    });
    const retryText = retry?.content?.[0]?.text || '';
    const retryParsed = parseStrictJson(retryText);
    if (retryParsed) return { ...retryParsed, dimension, latency_ms: latencyMs, raw: retryText, retried: true };
  } catch { /* fall through */ }

  return { winner: 'tie', confidence: 0, rationale: '', skipped: true, reason: 'parse-fail' };
}
