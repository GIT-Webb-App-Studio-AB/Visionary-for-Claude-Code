// slop-directives.mjs — Sprint 08 Task 22.2
//
// Reads skills/visionary/partials/slop-directives.md and extracts the
// pattern → avoid/consider pairs. When a generation is rejected by the
// slop-gate, the matching directives are formatted into a negative-prompt
// block that's spliced into the NEXT round's additionalContext.
//
// The directive file is markdown with `## Pattern: <name>` headers, each
// followed by **Avoid:** and **Consider:** paragraphs. We parse with a
// line-based state machine — no markdown parser dep, no AST walking.
// The file is small (< 10 KB) so parse-on-every-call is fine; a cache
// kicks in per Node process.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..', '..');
const DEFAULT_DIRECTIVES_PATH = join(repoRoot, 'skills', 'visionary', 'partials', 'slop-directives.md');

let _cache = null;

// ── Public: load all directives ─────────────────────────────────────────────
// Returns Map<patternName, { avoid, consider }>. Pattern names are lowercased
// for matching; the raw header is kept as `title` inside the value for
// display purposes.
export function loadDirectives(path) {
  const file = path || DEFAULT_DIRECTIVES_PATH;
  if (_cache && _cache.path === file) return _cache.map;
  if (!existsSync(file)) {
    _cache = { path: file, map: new Map() };
    return _cache.map;
  }
  let raw;
  try { raw = readFileSync(file, 'utf8'); } catch {
    _cache = { path: file, map: new Map() };
    return _cache.map;
  }
  const map = parseDirectives(raw);
  _cache = { path: file, map };
  return map;
}

export function _clearCacheForTest() { _cache = null; }

function parseDirectives(markdown) {
  const map = new Map();
  const lines = markdown.split('\n');
  let current = null;
  let capture = null; // 'avoid' | 'consider' | null

  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    const headerMatch = line.match(/^##\s+Pattern:\s*(.+?)\s*$/i);
    if (headerMatch) {
      if (current) commit(map, current);
      current = { title: headerMatch[1], avoid: '', consider: '' };
      capture = null;
      continue;
    }
    if (!current) continue;

    const avoidMatch = line.match(/^\*\*Avoid:\*\*\s*(.*)$/);
    if (avoidMatch) {
      capture = 'avoid';
      current.avoid = avoidMatch[1];
      continue;
    }
    const considerMatch = line.match(/^\*\*Consider:\*\*\s*(.*)$/);
    if (considerMatch) {
      capture = 'consider';
      current.consider = considerMatch[1];
      continue;
    }
    // Rule separator closes the current directive entry
    if (line.trim() === '---') {
      if (current) commit(map, current);
      current = null;
      capture = null;
      continue;
    }
    if (capture && line.trim()) {
      current[capture] = current[capture]
        ? current[capture] + ' ' + line.trim()
        : line.trim();
    }
  }
  if (current) commit(map, current);
  return map;
}

function commit(map, entry) {
  if (!entry || !entry.title) return;
  const key = normaliseKey(entry.title);
  if (!key) return;
  map.set(key, {
    title: entry.title,
    avoid: entry.avoid || '',
    consider: entry.consider || '',
  });
}

function normaliseKey(s) {
  return String(s || '').toLowerCase().trim();
}

// Aggressive normalisation for fuzzy matching: drop non-alphanumeric chars
// so "Default Tailwind blue (#3B82F6)" collapses to the same thing as
// "Default Tailwind blue #3B82F6". Detector strings and directive headers
// drift stylistically over time — fuzzy match tolerates the drift.
function fuzzy(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// ── Public: pair a flag with a directive ────────────────────────────────────
// Hook flags come in the form "Cyan-on-dark color scheme detected" — we
// need to match that against directive titles like "Cyan-on-dark color
// scheme". The detector's " detected" suffix is stripped, both sides run
// through fuzzy normalisation, then we do a word-prefix containment match.
// This tolerates parens, hashes, punctuation drift between detector and
// directive file without needing exact bytewise agreement.
export function findDirectiveForFlag(flag, directives = loadDirectives()) {
  if (!flag || typeof flag !== 'string') return null;
  const flagFuzzy = fuzzy(flag.replace(/\s+detected$/i, ''));
  if (!flagFuzzy) return null;

  // Exact match on normalised key (before fuzzing)
  const lc = flag.toLowerCase().replace(/\s+detected$/i, '').trim();
  if (directives.has(lc)) return directives.get(lc);

  // Fuzzy substring match: prefer longest common-substring directive.
  let best = null;
  let bestScore = 0;
  for (const [key, value] of directives) {
    const keyFuzzy = fuzzy(key);
    if (!keyFuzzy) continue;
    if (flagFuzzy.includes(keyFuzzy) || keyFuzzy.includes(flagFuzzy)) {
      const score = Math.min(flagFuzzy.length, keyFuzzy.length);
      if (score > bestScore) { best = value; bestScore = score; }
    }
  }
  return best;
}

// ── Public: build the negative-prompt block ─────────────────────────────────
// Input: array of pattern names (strings) — the slop-gate's blocking_patterns.
// Output: formatted markdown block suitable for splicing into additionalContext.
// Returns '' when no patterns are provided (caller splices unconditionally).
export function buildDirectiveBlock(blockingPatterns, { directivesPath, maxPatterns = 5 } = {}) {
  if (!Array.isArray(blockingPatterns) || !blockingPatterns.length) return '';
  const directives = loadDirectives(directivesPath);
  const lines = [
    '',
    'REGEN REQUIRED — previous output hit blocking slop patterns:',
    '',
  ];
  const picked = blockingPatterns.slice(0, maxPatterns);
  for (const flag of picked) {
    lines.push(`- ${flag}`);
  }
  lines.push('');
  lines.push('DO NOT produce output that reproduces these patterns. Specifically:');
  lines.push('');
  let matched = 0;
  for (const flag of picked) {
    const directive = findDirectiveForFlag(flag, directives);
    if (!directive) {
      lines.push(`**${flag}**`);
      lines.push(`  Avoid reproducing this pattern. If no alternative exists, document why in a brief-aligned comment.`);
      lines.push('');
      continue;
    }
    matched++;
    lines.push(`**${directive.title}**`);
    if (directive.avoid)    lines.push(`  Avoid: ${directive.avoid}`);
    if (directive.consider) lines.push(`  Consider: ${directive.consider}`);
    lines.push('');
  }
  if (matched === 0) {
    lines.push('(No specific directives found for these patterns — use taste judgment to diverge.)');
  }
  return lines.join('\n').trimEnd();
}
