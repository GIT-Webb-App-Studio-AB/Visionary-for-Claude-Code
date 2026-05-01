#!/usr/bin/env node
// Governance check — Sprint 14.
// Usage:
//   node scripts/governance-check.mjs --staged
//   node scripts/governance-check.mjs --base <sha>
//   node scripts/governance-check.mjs --files <path,path>
//   node scripts/governance-check.mjs --tokens tokens/oxblood-editorial.tokens.json --files src/**.tsx

import { readFile, readdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectDrift } from '../hooks/scripts/lib/governance/drift-detect.mjs';
import { getGovernanceConfig } from '../hooks/scripts/lib/governance/threshold.mjs';
import { formatDriftReport } from '../hooks/scripts/lib/governance/report.mjs';

const __filename = fileURLToPath(import.meta.url);
const REPO = dirname(dirname(__filename));

const SUPPORTED_EXTS = ['.tsx', '.jsx', '.vue', '.svelte', '.html', '.css', '.scss'];
const IGNORE_COMMENT_RE = /\/\/\s*visionary-governance\s*:\s*ignore/i;
// Restrict --base to safe git ref characters (sha, branch, tag, refs/...).
// Disallows shell metacharacters and whitespace.
const SAFE_GIT_REF_RE = /^[A-Za-z0-9._/\-]{1,200}$/;

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { staged: false, base: null, files: null, tokens: null, json: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--staged') out.staged = true;
    else if (a === '--base') out.base = args[++i];
    else if (a === '--files') out.files = args[++i].split(',');
    else if (a === '--tokens') out.tokens = args[++i];
    else if (a === '--json') out.json = true;
  }
  return out;
}

function gitDiffNames(argv) {
  // execFileSync — no shell — argv is an array, not concatenated.
  try {
    const out = execFileSync('git', argv, { encoding: 'utf8', cwd: REPO });
    return out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function listChangedFiles({ staged, base }) {
  if (staged) return gitDiffNames(['diff', '--cached', '--name-only']);
  if (base) {
    if (!SAFE_GIT_REF_RE.test(base)) {
      process.stderr.write(`[error] unsafe --base value rejected: ${base}\n`);
      return [];
    }
    return gitDiffNames(['diff', '--name-only', `${base}...HEAD`]);
  }
  return gitDiffNames(['diff', '--name-only', 'HEAD~1...HEAD']);
}

async function findLockedTokens(explicitPath) {
  if (explicitPath) {
    if (!existsSync(explicitPath)) return null;
    return { path: explicitPath, tokens: JSON.parse(await readFile(explicitPath, 'utf8')) };
  }
  // Look at tokens/*.tokens.json — pick the one with `$visionary.locked: true`
  const tokensDir = join(REPO, 'tokens');
  if (!existsSync(tokensDir)) return null;
  const candidates = (await readdir(tokensDir)).filter((f) => f.endsWith('.tokens.json'));
  for (const f of candidates) {
    const path = join(tokensDir, f);
    try {
      const tokens = JSON.parse(await readFile(path, 'utf8'));
      if (tokens?.$visionary?.locked === true) return { path, tokens };
    } catch {}
  }
  // Fallback: no locked tokens → skip rather than blocking on first random file
  return null;
}

function isSupported(path) {
  return SUPPORTED_EXTS.some((ext) => path.endsWith(ext));
}

async function main() {
  const args = parseArgs();
  const locked = await findLockedTokens(args.tokens);

  if (!locked) {
    if (args.json) console.log(JSON.stringify({ skipped: true, reason: 'no-locked-tokens' }));
    else process.stderr.write('Governance check: no locked tokens found, skipping.\n');
    process.exit(0);
  }

  const cfg = getGovernanceConfig(locked.tokens);
  if (cfg.drift_threshold === 'off') {
    if (args.json) console.log(JSON.stringify({ skipped: true, reason: 'drift_threshold=off' }));
    else process.stderr.write('Governance check: threshold=off, skipping.\n');
    process.exit(0);
  }

  let files = args.files || listChangedFiles({ staged: args.staged, base: args.base });
  files = files.filter(isSupported).filter((f) => existsSync(join(REPO, f)));

  const byFile = [];
  for (const rel of files) {
    const path = join(REPO, rel);
    let text;
    try {
      const stat = statSync(path);
      if (stat.size > 500_000) continue; // skip huge files
      text = await readFile(path, 'utf8');
    } catch {
      continue;
    }
    if (IGNORE_COMMENT_RE.test(text)) continue;

    const result = detectDrift({
      source: text,
      lockedTokens: locked.tokens,
      tolerance: cfg.near_match_tolerance,
      allowedDrifts: cfg.allowed_drifts,
    });
    byFile.push({ path: rel, result });
  }

  const totalDrifts = byFile.reduce((acc, f) => acc + f.result.drifts.length, 0);
  const totalWarnings = byFile.reduce((acc, f) => acc + f.result.warnings.length, 0);
  const exitCode = (cfg.drift_threshold === 'block' && totalDrifts > 0) ? 1 : 0;

  if (args.json) {
    console.log(JSON.stringify({
      total_drifts: totalDrifts,
      total_warnings: totalWarnings,
      threshold: cfg.drift_threshold,
      locked_tokens_path: locked.path,
      by_file: byFile.map((f) => ({ path: f.path, drifts: f.result.drifts, warnings: f.result.warnings })),
    }, null, 2));
  } else {
    process.stdout.write(formatDriftReport({ result: { ok: totalDrifts === 0 }, lockedTokensPath: locked.path, byFile }));
    process.stdout.write('\n');
    if (exitCode !== 0) {
      process.stderr.write('\n✗ Token drift detected. Pass --no-verify to bypass (not recommended).\n');
    }
  }
  process.exit(exitCode);
}

main().catch((err) => {
  process.stderr.write(`[error] ${err.message}\n`);
  process.exit(2);
});
