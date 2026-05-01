#!/usr/bin/env node
// scripts/visionary-stats.mjs — Sprint 06 Task 19.3
//
// Parses .visionary/traces/*.jsonl and produces markdown reports:
//   - Per-session timeline  (--session <id>)
//   - Cross-session trends (--all)
//   - Recurring-fix mining (--recurring-fixes)  ← the Anthropic-GEPA-style
//     "pre-apply fix X" report that surfaces patterns worth baking into
//     the style rubric.
//
// Usage examples:
//   node scripts/visionary-stats.mjs --session sess-abc
//   node scripts/visionary-stats.mjs --all
//   node scripts/visionary-stats.mjs --recurring-fixes --days 30
//   node scripts/visionary-stats.mjs --recurring-fixes --min-count 3 --out report.md
//
// Zero deps. Node 18+. Reads from the project-local .visionary/traces/
// directory; --project <dir> overrides the root discovery.

import { readdirSync, existsSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readSessionTraces, listAllTraceFiles, resolveTraceDir } from '../hooks/scripts/lib/trace.mjs';

// ── CLI ──────────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));

function flagValue(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? def : process.argv[i + 1];
}
function hasFlag(name) { return process.argv.includes(`--${name}`); }

const sessionId   = flagValue('session');
const wantAll     = hasFlag('all');
const wantFixes   = hasFlag('recurring-fixes');
const wantSlopGate = hasFlag('slop-gate-report');
const daysWindow  = Number.parseInt(flagValue('days', '30'), 10);
const minCount    = Number.parseInt(flagValue('min-count', '3'), 10);
const outPath     = flagValue('out', null);
const projectRoot = flagValue('project', null) || findProjectRoot();
const verbose     = hasFlag('verbose');

function findProjectRoot() {
  let dir = process.cwd();
  while (true) {
    if (existsSync(join(dir, 'package.json')) || existsSync(join(dir, '.git'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return process.cwd();
    dir = parent;
  }
}

// ── Entry ────────────────────────────────────────────────────────────────────
function main() {
  if (!sessionId && !wantAll && !wantFixes && !wantSlopGate) {
    printHelp();
    process.exit(0);
  }
  let report;
  if (sessionId)         report = sessionReport(sessionId);
  else if (wantFixes)    report = recurringFixesReport({ daysWindow, minCount });
  else if (wantSlopGate) report = slopGateReport({ daysWindow });
  else if (wantAll)      report = allSessionsReport();

  if (outPath) {
    writeFileSync(outPath, report, 'utf8');
    console.error(`[visionary-stats] wrote ${outPath}`);
  } else {
    process.stdout.write(report);
  }
}

function printHelp() {
  process.stdout.write(`visionary-stats — Sprint 06/08 trace analysis

Usage:
  node scripts/visionary-stats.mjs --session <id>           Per-session timeline
  node scripts/visionary-stats.mjs --all                    All-sessions summary
  node scripts/visionary-stats.mjs --recurring-fixes        Recurring-fix mining
  node scripts/visionary-stats.mjs --slop-gate-report       Sprint 08 slop-gate rejection stats

Options:
  --days <n>         Window for mining (default 30, applies to fixes + slop-gate)
  --min-count <n>    Minimum recurrence for a pattern to report (default 3)
  --out <path>       Write to file instead of stdout
  --project <dir>    Override project root (default: auto-discover)
  --verbose          Per-event diagnostic lines
`);
}

// ── Per-session timeline ─────────────────────────────────────────────────────
// Reports every event in chronological order, with duration_ms where present.
// Useful for debugging a single generation end-to-end.
function sessionReport(sid) {
  const { items, skipped } = readSessionTraces(sid, projectRoot);
  if (!items.length) {
    return `# Session ${sid}\n\nNo trace events found under ${resolveTraceDir(projectRoot)}.\n`;
  }
  const byGeneration = groupBy(items, (e) => e.generation_id || 'no-gen');
  const lines = [
    `# Session ${sid}`,
    '',
    `Project: ${projectRoot}`,
    `Trace dir: ${resolveTraceDir(projectRoot)}`,
    `Events: ${items.length} (${skipped} corrupt lines skipped)`,
    `Generations: ${byGeneration.size}`,
    `Window: ${items[0].ts} → ${items[items.length - 1].ts}`,
    '',
  ];

  for (const [gid, events] of byGeneration) {
    lines.push(`## Generation \`${gid}\``);
    lines.push('');
    lines.push('| Round | Event | Emitter | Δms | Payload |');
    lines.push('|------:|-------|---------|----:|---------|');
    for (const e of events) {
      const summary = summarisePayload(e.event, e.payload);
      lines.push(`| ${e.round} | \`${e.event}\` | ${e.emitter || '—'} | ${e.duration_ms ?? '—'} | ${escapeTableCell(summary)} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

// ── All-sessions summary ────────────────────────────────────────────────────
// One row per session with high-level counts.
function allSessionsReport() {
  const files = listAllTraceFiles(projectRoot);
  if (!files.length) return `# All sessions\n\nNo trace files under ${resolveTraceDir(projectRoot)}.\n`;

  const sessions = groupSessionsByPrefix(files);
  const rows = [];
  for (const [sid, fileGroup] of sessions) {
    const { items, skipped } = readSessionTraces(sid, projectRoot);
    if (!items.length) continue;
    const accepted = items.filter((e) => e.event === 'accepted').length;
    const rejected = items.filter((e) => e.event === 'rejected').length;
    const critiques = items.filter((e) => e.event.startsWith('critic_')).length;
    const earliest = items[0].ts;
    const latest = items[items.length - 1].ts;
    const sizes = fileGroup.reduce((acc, f) => acc + f.size, 0);
    rows.push({ sid, count: items.length, skipped, accepted, rejected, critiques, earliest, latest, bytes: sizes });
  }
  rows.sort((a, b) => (a.earliest < b.earliest ? 1 : -1));

  const lines = [
    '# All sessions',
    '',
    `Trace dir: ${resolveTraceDir(projectRoot)}`,
    `Sessions: ${rows.length}`,
    '',
    '| Session | Events | Critiques | Accepted | Rejected | KB | First | Last |',
    '|---------|-------:|----------:|---------:|---------:|---:|-------|------|',
  ];
  for (const r of rows) {
    lines.push(
      `| \`${r.sid}\` | ${r.count} | ${r.critiques} | ${r.accepted} | ${r.rejected} | ${(r.bytes / 1024).toFixed(1)} | ${r.earliest.slice(0, 16)} | ${r.latest.slice(0, 16)} |`,
    );
  }
  return lines.join('\n') + '\n';
}

function groupSessionsByPrefix(files) {
  const map = new Map();
  for (const f of files) {
    const base = f.name.replace(/\.jsonl(\.gz)?$/, '').replace(/\.\d+$/, '');
    if (!map.has(base)) map.set(base, []);
    let size = 0;
    try { size = statSync(f.path).size; } catch { /* ignore */ }
    map.get(base).push({ ...f, size });
  }
  return map;
}

// ── Recurring-fix mining ─────────────────────────────────────────────────────
// This is the headline deliverable. We parse every critique-output event,
// cluster its top_3_fixes by (dimension + selector_hint + keyword-signature),
// and report patterns that appear >= minCount times inside the last
// daysWindow days.
//
// Keyword signature: proposed_fix is normalised (lowercase, strip punctuation,
// split on whitespace) and the top 4 most-informative tokens form the cluster
// key. "Informative" = not in STOP_WORDS and at least 3 chars long.
//
// The report suggests what to pre-apply — if "hero h1 line-height too tight"
// shows up 14 times in 23 critiques, that's a calibration signal worth
// promoting into the style rubric.
function recurringFixesReport({ daysWindow, minCount }) {
  const cutoffMs = Date.now() - daysWindow * 24 * 60 * 60 * 1000;
  const files = listAllTraceFiles(projectRoot);
  const clusters = new Map();
  let totalFixes = 0;

  for (const f of files) {
    const sid = f.name.replace(/\.jsonl(\.gz)?$/, '').replace(/\.\d+$/, '');
    const { items } = readSessionTraces(sid, projectRoot);
    for (const e of items) {
      const ts = Date.parse(e.ts || '');
      if (!Number.isFinite(ts) || ts < cutoffMs) continue;
      const fixes = extractFixes(e);
      for (const fix of fixes) {
        const key = clusterKey(fix);
        if (!key) continue;
        totalFixes++;
        const bucket = clusters.get(key) || { fix, count: 0, examples: [], dimensions: new Set() };
        bucket.count++;
        if (bucket.examples.length < 3) bucket.examples.push(fix.proposed_fix || fix.message || '');
        if (fix.dimension) bucket.dimensions.add(fix.dimension);
        clusters.set(key, bucket);
      }
    }
  }

  const recurring = [...clusters.values()]
    .filter((b) => b.count >= minCount)
    .sort((a, b) => b.count - a.count);

  const lines = [
    '# Recurring fixes',
    '',
    `Window: last ${daysWindow} days`,
    `Minimum recurrence: ${minCount}`,
    `Trace dir: ${resolveTraceDir(projectRoot)}`,
    `Total fixes scanned: ${totalFixes}`,
    `Recurring patterns: ${recurring.length}`,
    '',
  ];
  if (!recurring.length) {
    lines.push('_No patterns exceeded the threshold. Try lowering `--min-count` or increasing `--days`._');
    return lines.join('\n') + '\n';
  }
  for (const b of recurring) {
    const pct = totalFixes ? Math.round((b.count / totalFixes) * 100) : 0;
    const dims = [...b.dimensions].join(', ') || '—';
    lines.push(`## Pattern: ${escape(b.fix.selector_hint || '(no selector)')} · \`${dims}\``);
    lines.push('');
    lines.push(`**Count:** ${b.count} occurrences (${pct}% of all fixes in window)`);
    lines.push('');
    lines.push('**Example proposed_fix values:**');
    for (const ex of b.examples) {
      lines.push(`- ${escape(ex)}`);
    }
    lines.push('');
    lines.push(`**Recommendation:** consider pre-applying this class of fix before round 1, or adding the constraint to the style rubric so the generator stops producing it.`);
    lines.push('');
  }
  return lines.join('\n');
}

// ── Sprint 08 — slop-gate report ────────────────────────────────────────────
// Mines trace events emitted by slop-gate.mjs. Shows how often the gate
// fires, which patterns most commonly trigger it, which styles are using
// their whitelists. Useful for calibrating VISIONARY_SLOP_REJECT_THRESHOLD.
function slopGateReport({ daysWindow }) {
  const cutoffMs = Date.now() - daysWindow * 24 * 60 * 60 * 1000;
  const files = listAllTraceFiles(projectRoot);
  let totalGenerations = 0;
  let blockedCount = 0;
  let whitelistedCount = 0;
  const blockingCounts = new Map();      // pattern → count
  const whitelistByStyle = new Map();    // style_id → [patterns]

  for (const f of files) {
    const sid = f.name.replace(/\.jsonl(\.gz)?$/, '').replace(/\.\d+$/, '');
    const { items } = readSessionTraces(sid, projectRoot);
    const generationsSeen = new Set();
    for (const e of items) {
      const ts = Date.parse(e.ts || '');
      if (!Number.isFinite(ts) || ts < cutoffMs) continue;
      if (e.generation_id) generationsSeen.add(e.generation_id);
      if (e.event === 'slop_blocked') {
        blockedCount++;
        const patterns = e.payload?.blocking_patterns || [];
        for (const p of patterns) {
          blockingCounts.set(p, (blockingCounts.get(p) || 0) + 1);
        }
      } else if (e.event === 'slop_whitelisted') {
        whitelistedCount++;
        const style = e.payload?.style_id || '(unknown style)';
        const patterns = e.payload?.whitelisted_patterns || [];
        const list = whitelistByStyle.get(style) || [];
        list.push(...patterns);
        whitelistByStyle.set(style, list);
      }
    }
    totalGenerations += generationsSeen.size;
  }

  const pct = totalGenerations ? Math.round((blockedCount / totalGenerations) * 100) : 0;
  const lines = [
    `# Slop-gate report — last ${daysWindow} days`,
    '',
    `Trace dir: ${resolveTraceDir(projectRoot)}`,
    `Total generations observed: ${totalGenerations}`,
    `Blocked by gate: ${blockedCount} (${pct}% of generations)`,
    `Whitelisted events: ${whitelistedCount}`,
    '',
  ];

  if (blockingCounts.size) {
    lines.push('## Top blocking patterns');
    lines.push('');
    const sorted = [...blockingCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    for (const [pattern, count] of sorted) {
      lines.push(`- **${count}** — ${escape(pattern)}`);
    }
    lines.push('');
  } else {
    lines.push('_No blocking events in window. Either no generations hit the threshold, or traces are missing._');
    lines.push('');
  }

  if (whitelistByStyle.size) {
    lines.push('## Whitelist hits by style');
    lines.push('');
    for (const [style, patterns] of whitelistByStyle) {
      const countMap = new Map();
      for (const p of patterns) countMap.set(p, (countMap.get(p) || 0) + 1);
      const parts = [...countMap.entries()].map(([p, c]) => `"${p}" (${c})`).join(', ');
      lines.push(`- **${escape(style)}**: ${parts}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// Fixes can arrive from any of:
//   critic_output.payload.top_3_fixes  (single-critic mode)
//   critic_craft_output.payload.top_3_fixes
//   critic_aesthetic_output.payload.top_3_fixes
//   fix_candidate_generated.payload   (individual record)
function extractFixes(e) {
  const out = [];
  if (!e.payload) return out;
  if (Array.isArray(e.payload.top_3_fixes)) {
    for (const f of e.payload.top_3_fixes) if (f) out.push(f);
  }
  if (e.event === 'fix_candidate_generated' && e.payload.dimension) {
    out.push(e.payload);
  }
  return out;
}

// ── Clustering key ───────────────────────────────────────────────────────────
// Combines dimension + normalised selector_hint + top-4 informative tokens
// from proposed_fix. The goal is to group fixes that are "really the same
// thing" even when the exact wording varies.
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'into', 'over', 'onto', 'than',
  'this', 'that', 'these', 'those', 'your', 'our', 'a', 'an', 'to', 'of',
  'is', 'are', 'be', 'by', 'or', 'but', 'not', 'no', 'on', 'in', 'at',
  'as', 'if', 'it', 'its', 'add', 'use', 'replace', 'set', 'make', 'any',
  'some', 'each', 'every', 'all', 'should', 'would', 'may', 'might', 'do',
]);

function clusterKey(fix) {
  const dim = (fix.dimension || '').toLowerCase();
  const sel = normaliseSelector(fix.selector_hint || fix.evidence?.value || '');
  const tokens = informativeTokens(fix.proposed_fix || fix.message || '');
  const sig = tokens.slice(0, 4).sort().join('|');
  if (!dim && !sel && !sig) return null;
  return `${dim}||${sel}||${sig}`;
}

function normaliseSelector(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 80);
}

function informativeTokens(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\- ]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function summarisePayload(event, payload) {
  if (!payload || typeof payload !== 'object') return '';
  if (event === 'critic_output' || event === 'critic_craft_output' || event === 'critic_aesthetic_output') {
    const mins = [];
    if (payload.scores) {
      const vals = Object.values(payload.scores).filter((v) => typeof v === 'number');
      if (vals.length) mins.push(`min=${Math.min(...vals).toFixed(1)}`);
      if (vals.length) mins.push(`mean=${(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)}`);
    }
    if (Array.isArray(payload.top_3_fixes)) mins.push(`fixes=${payload.top_3_fixes.length}`);
    return mins.join(' ') || JSON.stringify(payload).slice(0, 80);
  }
  if (event === 'accepted')   return payload.composite != null ? `composite=${payload.composite}` : '';
  if (event === 'rejected')   return payload.reason || '';
  if (event === 'api_call')   return [payload.model, payload.tokens_in, payload.tokens_out].filter(Boolean).join(' · ');
  const flat = JSON.stringify(payload);
  return flat.length > 80 ? flat.slice(0, 77) + '…' : flat;
}

function groupBy(arr, keyFn) {
  const map = new Map();
  for (const item of arr) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function escape(s) {
  return String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function escapeTableCell(s) {
  return escape(s).slice(0, 160);
}

main();
