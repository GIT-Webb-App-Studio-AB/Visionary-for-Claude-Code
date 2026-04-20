#!/usr/bin/env node
// update-taste.mjs
// UserPromptSubmit hook: detects rejection/positive signals in the submitted user
// prompt and updates {project_root}/system.md so future generations learn from feedback.
//
// Reads JSON from stdin per official hooks spec. Cross-platform (no sed, no tr).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

// ── Read stdin ────────────────────────────────────────────────────────────────
function readStdin() {
  try { return readFileSync(0, 'utf8'); } catch { return ''; }
}
function parseInput(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
function emit(obj) { process.stdout.write(JSON.stringify(obj)); process.exit(0); }
function silent() { process.exit(0); }

const input = parseInput(readStdin());
if (!input) silent();

// UserPromptSubmit → input.prompt; Stop → input.messages (fallback if user wires it to Stop)
const promptText = input.prompt
  || (Array.isArray(input.messages)
        ? input.messages.filter(m => m.role === 'user').map(m => m.content || '').join(' ')
        : '');
if (!promptText || typeof promptText !== 'string') silent();

// ── Walk up to find project root ─────────────────────────────────────────────
function findProjectRoot(start) {
  let dir = resolve(start);
  while (true) {
    if (existsSync(join(dir, 'package.json')) || existsSync(join(dir, '.git'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return start;
    dir = parent;
  }
}

const projectRoot = findProjectRoot(input.cwd || process.cwd());
const systemMd = join(projectRoot, 'system.md');
const today = new Date().toISOString().slice(0, 10);

// ── Signal detection ─────────────────────────────────────────────────────────
const lower = promptText.toLowerCase();

const rejectionPatterns = [
  'ugly', 'hate this', 'hate it', 'too generic', 'looks like every',
  'start over', 'try again', 'completely different', 'too corporate',
  'too playful', 'too dark', 'too minimal', 'boring', 'bland', 'basic',
  'like chatgpt',
];
const positivePatterns = [
  'this is it', 'love this', 'perfect', 'exactly what i wanted',
  'keep that style', 'more like this', 'love the typography',
  'love the colors', 'love the motion', 'yes exactly',
];

const hasRejection = rejectionPatterns.some(p => lower.includes(p));
const hasPositive = positivePatterns.some(p => lower.includes(p));

if (!hasRejection && !hasPositive) silent();

// ── Ensure system.md exists with the right skeleton ──────────────────────────
const header = `## visionary-claude Taste Profile — updated ${today}

### Rejected styles

### Rejected typography

### Rejected motion patterns

### Rejected colors

### Positive signals (reinforce)

### Design DNA (confirmed)

### Style history
`;

let content = existsSync(systemMd) ? readFileSync(systemMd, 'utf8') : header;
if (!/### Style history/.test(content)) content += '\n### Style history\n';

// ── Insert entries under matching section ────────────────────────────────────
// We never shell out — this is plain string insertion into a markdown file,
// so SQL-style / shell injection does not apply. We still normalize the quote
// to keep list entries on one line and stop user text from nesting markdown
// headings, list markers, code fences, or link syntax that would derail the
// parser on the NEXT read of system.md.
const shortQuote = promptText
  .slice(0, 80)
  .replace(/\s+/g, ' ')          // collapse newlines/tabs
  .replace(/[`*_#>[\]]/g, ' ')   // strip markdown structural chars
  .replace(/"/g, "'")            // avoid breaking the surrounding quotes
  .replace(/\\/g, '/')           // escape literal backslashes
  .trim();

function insertUnder(src, section, line) {
  const re = new RegExp(`(### ${section}\\s*\\n)`);
  if (re.test(src)) return src.replace(re, (m, g1) => `${g1}${line}\n`);
  return src + `\n### ${section}\n${line}\n`;
}

if (hasRejection) {
  content = insertUnder(content, 'Rejected styles',
    `- (detected rejection — ${today}: "${shortQuote}")`);

  const rejectionCount = (content.match(/detected rejection/g) || []).length;
  if (rejectionCount >= 3 && !/PERMANENTLY FLAGGED/.test(content)) {
    content = insertUnder(content, 'Rejected styles',
      `- *** PERMANENTLY FLAGGED — rejected 3+ times. Exclude from candidate set unless explicitly re-requested. ***`);
  }
}

if (hasPositive) {
  content = insertUnder(content, 'Positive signals \\(reinforce\\)',
    `- (detected approval — ${today}: "${shortQuote}")`);
}

// ── Update header date stamp ─────────────────────────────────────────────────
content = content.replace(/Taste Profile — updated [0-9-]+/, `Taste Profile — updated ${today}`);

writeFileSync(systemMd, content, 'utf8');

// ── Tell Claude what happened ────────────────────────────────────────────────
let msg;
if (hasRejection && !hasPositive) {
  msg = 'Taste profile updated in system.md: rejection recorded. Future designs will exclude this direction.';
} else if (hasPositive && !hasRejection) {
  msg = 'Taste profile updated in system.md: positive signal recorded. This direction will be ranked higher for this project.';
} else {
  msg = 'Taste profile updated in system.md: mixed signals recorded (rejection + approval). Review system.md for context.';
}

emit({ additionalContext: msg });
