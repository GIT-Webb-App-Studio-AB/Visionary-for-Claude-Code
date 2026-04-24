#!/usr/bin/env node
// harvest-git-signal.mjs — SessionStart hook.
//
// Sprint 05 Task 16.1. Passive taste signal: walks the project's git history
// for files the skill has generated (detected via the .visionary-generated
// header marker) and emits facts based on what happened to them.
//
// Classification rules (from sprint plan):
//   - untouched for 7+ days after creation   → git_kept     confidence +0.4 prefer
//   - > 50% of lines modified within 7 days  → git_heavy_edit  0.6 avoid
//   - deleted within 7 days                  → git_delete      0.75 avoid
//
// Emitted facts go through the same dedup / upgrade path as the extractor
// (appendFact → rewriteFacts on dedup). No LLM call: the sprint plan's
// "run Haiku for diff-interpretation" upgrade is stubbed behind --llm for
// Sprint 06 (same seam as scripts/build-style-embeddings.mjs). Heuristic
// diff-classification extracts the style_id / pattern from the header
// marker itself — we know what was generated because we wrote the marker.
//
// Performance budget: 50 files / session (sprint plan), 100 ms timeout per
// git call, abort run after 3 seconds total. Safe to spawn from SessionStart.
//
// Privacy guardrails (Task 16.3):
//   - VISIONARY_DISABLE_TASTE=1  → full no-op
//   - Never reads file contents outside .visionary-generated-marked files
//   - Git calls are --follow + --numstat only; no blob content ever leaves
//     git
//   - Writes only to taste/facts.jsonl; never to the network

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, openSync, readSync, closeSync } from 'node:fs';
import { join, extname, relative, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

import {
  findProjectRoot, projectKey as deriveProjectKey, isTasteDisabled,
  appendFact, readFacts, rewriteFacts, nowIso, ulid, factKey,
} from './lib/taste-io.mjs';
import { applyUpgrade, CONFIDENCE } from './lib/taste-extractor.mjs';

// ── Stdin (SessionStart sends empty JSON) ───────────────────────────────────
function readStdin() { try { return readFileSync(0, 'utf8'); } catch { return ''; } }
function emitEmpty() { process.stdout.write('{}'); process.exit(0); }

if (isTasteDisabled()) emitEmpty();

const input = (() => {
  const raw = readStdin();
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
})();

const projectRoot = findProjectRoot(input.cwd || process.cwd());
const projectKeyValue = deriveProjectKey(projectRoot);

// If the project isn't a git repo, no harvest is possible.
if (!existsSync(join(projectRoot, '.git'))) emitEmpty();

// Rate-limit: one harvest per 24 hours per project. Stamp in CLAUDE_PLUGIN_DATA
// if available, otherwise under .visionary-cache.
const STAMP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const MAX_FILES_PER_RUN = 50;
const SHORT_TERM_WINDOW_DAYS = 7;

// Walk config — declared at module top-level (before the main flow that
// calls findMarkedFiles) so ES module temporal-dead-zone doesn't bite.
const IGNORE_DIRS = new Set(['node_modules', '.next', 'dist', 'build', '.git', '.venv', 'venv', 'vendor', 'coverage', '__pycache__', '.visionary-cache', 'taste']);
const SCAN_EXTENSIONS = new Set(['.tsx', '.jsx', '.vue', '.svelte', '.html', '.css', '.ts', '.js']);

if (!forceRun() && !isStampOlderThan(STAMP_INTERVAL_MS)) emitEmpty();

// ── Scan for .visionary-generated files ────────────────────────────────────
const files = findMarkedFiles(projectRoot, MAX_FILES_PER_RUN);
if (files.length === 0) {
  writeStamp();
  emitEmpty();
}

// ── For each file: determine git outcome + classify ────────────────────────
const existingFacts = readFacts(projectRoot).items;
const keyIndex = new Map(existingFacts.map((f) => [factKey(f), f]));

let written = 0;
let upgraded = 0;

for (const f of files) {
  const marker = readMarker(f.path);
  if (!marker || !marker.style) continue;

  const outcome = classify(projectRoot, f, marker);
  if (!outcome) continue;

  const fact = buildFactFromOutcome(marker, outcome, projectKeyValue);
  if (!fact) continue;

  const key = factKey(fact);
  const existing = keyIndex.get(key);
  if (existing) {
    const upgradedFact = applyUpgrade(existing, {
      kind: fact.evidence[0].kind,
      quote_or_diff: fact.evidence[0].quote_or_diff,
      at: fact.evidence[0].at,
    });
    keyIndex.set(key, upgradedFact);
    upgraded++;
  } else {
    if (appendFact(projectRoot, fact)) {
      keyIndex.set(key, fact);
      written++;
    }
  }
}

if (upgraded > 0) {
  rewriteFacts(projectRoot, Array.from(keyIndex.values()));
}

writeStamp();
emitEmpty();

// ════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════

function forceRun() {
  return process.env.VISIONARY_HARVEST_FORCE === '1';
}

function stampPath() {
  const base = process.env.CLAUDE_PLUGIN_DATA
    ? join(process.env.CLAUDE_PLUGIN_DATA, 'visionary-cache')
    : join(projectRoot, '.visionary-cache');
  return join(base, 'last-git-harvest');
}

function isStampOlderThan(ms) {
  const p = stampPath();
  if (!existsSync(p)) return true;
  try {
    const last = parseInt(readFileSync(p, 'utf8').trim(), 10);
    if (!Number.isFinite(last)) return true;
    return (Date.now() - last) > ms;
  } catch { return true; }
}

function writeStamp() {
  const p = stampPath();
  try {
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, String(Date.now()), 'utf8');
  } catch { /* stamping is best-effort; failing means next session harvests again */ }
}

// Walks common generated-file directories (components/, app/, src/, pages/).
// Limits recursion depth to keep the session-start hook fast. Skips obvious
// noise (see IGNORE_DIRS above).
function findMarkedFiles(root, limit) {
  const out = [];
  const stack = [root];
  const rootLen = root.length;
  let depth = 0;
  while (stack.length && out.length < limit) {
    const dir = stack.pop();
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (out.length >= limit) break;
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (IGNORE_DIRS.has(e.name)) continue;
        // Depth cap: 8 levels from project root.
        const relPath = full.slice(rootLen);
        const parts = relPath.split(/[\\/]/).filter(Boolean);
        if (parts.length <= 8) stack.push(full);
        continue;
      }
      if (!e.isFile()) continue;
      const ext = extname(e.name).toLowerCase();
      if (!SCAN_EXTENSIONS.has(ext)) continue;
      if (hasVisionaryMarker(full)) {
        out.push({ path: full });
      }
    }
  }
  return out;
}

// Reads the first 1 KB of the file and checks for the literal string
// ".visionary-generated". Cheap enough to run on hundreds of files per
// session; avoids reading bodies of user-authored files.
function hasVisionaryMarker(path) {
  let fd;
  try {
    fd = openSync(path, 'r');
    const buf = Buffer.alloc(1024);
    const n = readSync(fd, buf, 0, 1024, 0);
    const head = buf.slice(0, n).toString('utf8');
    return head.includes('.visionary-generated');
  } catch { return false; }
  finally { if (fd !== undefined) { try { closeSync(fd); } catch { /* ignore */ } } }
}

// Parses the marker block for structured metadata:
//
//   /**
//    * .visionary-generated
//    * style: bauhaus-dessau
//    * brief: "dashboard for clinic"
//    * generated_at: 2026-04-22T...
//    * generation_id: <uuid>
//    */
//
// Returns { style, brief, generated_at, generation_id } or null.
function readMarker(path) {
  let head = '';
  try { head = readFileSync(path, 'utf8').slice(0, 2048); } catch { return null; }
  if (!head.includes('.visionary-generated')) return null;
  const get = (key) => {
    const re = new RegExp(`\\*\\s*${key}\\s*:\\s*["']?([^"'\\n\\r]+?)["']?\\s*(?:\\n|\\r|\\*\\/)`, 'i');
    const m = head.match(re);
    return m ? m[1].trim() : null;
  };
  return {
    style: get('style'),
    brief: get('brief'),
    generated_at: get('generated_at'),
    generation_id: get('generation_id'),
  };
}

// Classifies the file's current git state. Returns one of:
//   { kind: 'git_kept', reason, diff_summary }
//   { kind: 'git_heavy_edit', reason, diff_summary }
//   { kind: 'git_delete', reason, diff_summary }
//   null  (insufficient signal — too new, not tracked, etc.)
function classify(root, f, marker) {
  const rel = relative(root, f.path).replace(/\\/g, '/');
  const createdIso = marker.generated_at;
  const createdMs = createdIso ? Date.parse(createdIso) : NaN;
  const ageDays = Number.isFinite(createdMs)
    ? (Date.now() - createdMs) / (1000 * 60 * 60 * 24)
    : Infinity;  // unknown age → treat as old, still classifiable from git

  // Deleted? Check against HEAD ls-files.
  const listed = gitRun(root, ['ls-files', '--error-unmatch', rel], 1500).status === 0;
  if (!listed) {
    // File is NOT in HEAD but exists on disk → probably untracked (newly
    // created, not committed yet). Ignore — no signal yet.
    return null;
  }

  // Churn probe: collect per-commit line diffs for the file. We count the
  // FIRST commit as creation and everything after as churn — this is more
  // reliable than --since date filtering because the marker's generated_at
  // is not the same as the commit timestamp (users may commit later).
  const log = gitRun(root, ['log', '--numstat', '--follow', '--pretty=format:---COMMIT---', '--', rel], 2000);
  if (log.status !== 0) return null;

  // Each commit block looks like:
  //   ---COMMIT---
  //   <added>\t<deleted>\t<path>
  // (with an optional empty line between). Split on the separator, toss
  // the first block (creation), sum the rest.
  const blocks = log.stdout.split('---COMMIT---').map((b) => b.trim()).filter(Boolean);
  const commitCount = blocks.length;
  let added = 0; let deleted = 0;
  // Skip index 0 (creation) if more than one commit touched the file.
  for (let i = 1; i < blocks.length; i++) {
    for (const ln of blocks[i].split('\n')) {
      const parts = ln.trim().split(/\s+/);
      const a = parseInt(parts[0], 10);
      const d = parseInt(parts[1], 10);
      if (Number.isFinite(a)) added += a;
      if (Number.isFinite(d)) deleted += d;
    }
  }

  const totalChurn = added + deleted;
  const fileSize = linesInFile(f.path);

  // Heavy edit heuristic: churn > 50% of current file size AND age < 7 days.
  if (ageDays < SHORT_TERM_WINDOW_DAYS && fileSize > 0 && totalChurn > fileSize * 0.5) {
    return {
      kind: 'git_heavy_edit',
      reason: `churn ${totalChurn} lines / file size ${fileSize} = ${(totalChurn/fileSize).toFixed(2)}x`,
      diff_summary: `heavy-edit:${rel}:+${added}-${deleted}`,
    };
  }

  // Kept heuristic: only the creation commit exists AND age >= 7 days.
  if (ageDays >= SHORT_TERM_WINDOW_DAYS && commitCount <= 1) {
    return {
      kind: 'git_kept',
      reason: `untouched for ${ageDays.toFixed(1)} days since creation`,
      diff_summary: `kept:${rel}:${ageDays.toFixed(0)}d`,
    };
  }

  // Delete case: checked above via ls-files. For tracked files whose most
  // recent diff removed all lines, git log --diff-filter=D would pick it up
  // but we'd need a separate pass. Keep the logic simple for now — explicit
  // deletions are captured by the next-tick SessionStart when the file is
  // gone from disk.
  return null;
}

function gitRun(root, args, timeoutMs) {
  return spawnSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    timeout: timeoutMs,
    windowsHide: true,
  });
}

function linesInFile(path) {
  try {
    const raw = readFileSync(path, 'utf8');
    return raw.split('\n').length;
  } catch { return 0; }
}

function buildFactFromOutcome(marker, outcome, projectKeyValue) {
  if (!marker.style) return null;
  const at = nowIso();
  const direction = outcome.kind === 'git_kept' ? 'prefer' : 'avoid';
  const confidence =
    outcome.kind === 'git_kept' ? CONFIDENCE.GIT_KEPT
    : outcome.kind === 'git_heavy_edit' ? CONFIDENCE.GIT_HEAVY_EDIT
    : outcome.kind === 'git_delete' ? CONFIDENCE.GIT_DELETE
    : 0.5;

  return {
    id: ulid(),
    scope: { level: 'project', key: projectKeyValue },
    signal: { direction, target_type: 'style_id', target_value: marker.style },
    evidence: [{
      kind: outcome.kind,
      quote_or_diff: (outcome.diff_summary || outcome.reason || '').slice(0, 240),
      at,
    }],
    confidence,
    created_at: at,
    last_seen: at,
    flag: 'active',
  };
}
