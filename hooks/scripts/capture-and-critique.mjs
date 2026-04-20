#!/usr/bin/env node
// capture-and-critique.mjs
// PostToolUse hook for Write|Edit|MultiEdit.
// Reads JSON from stdin per official hooks spec (https://code.claude.com/docs/en/hooks).
// Emits additionalContext instructing Claude to capture a screenshot via Playwright MCP
// on the next turn, run deterministic slop-scan on the file, and invoke the visual-critic
// subagent with the screenshot + brief.
//
// Cross-platform (no xxd, md5sum, sed): Node 18+ only.

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const MAX_ROUNDS = 3;
const CONTEXT_CAP = 10_000;
// Debounce: when a file is written multiple times in rapid succession (e.g. MultiEdit
// followed by a quick formatter pass) we want ONE critique at the end, not one per
// write. Skip if we critiqued this file within the last DEBOUNCE_MS.
const DEBOUNCE_MS = 3_000;
// Hard opt-out: users can disable the hook entirely via env for noisy refactors
// or CI runs without editing hooks.json.
const DISABLE_ENV = process.env.VISIONARY_DISABLE_CRITIQUE;

// ── Read stdin JSON ──────────────────────────────────────────────────────────
function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function parseInput(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ── Emit a result JSON and exit ──────────────────────────────────────────────
function emit(obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

function silent() {
  process.exit(0);
}

// ── Main ─────────────────────────────────────────────────────────────────────
if (DISABLE_ENV && DISABLE_ENV !== '0' && DISABLE_ENV.toLowerCase() !== 'false') silent();

const input = parseInput(readStdin());
if (!input) silent();

const toolName = input.tool_name || '';
if (!['Write', 'Edit', 'MultiEdit'].includes(toolName)) silent();

const toolInput = input.tool_input || {};
const filePath = toolInput.file_path || toolInput.path || '';
if (!filePath) silent();

const ext = filePath.split('.').pop().toLowerCase();
if (!['tsx', 'jsx', 'vue', 'svelte', 'html'].includes(ext)) silent();

if (!existsSync(filePath)) silent();

// ── Round tracking (per-project cache) ───────────────────────────────────────
// Prefer CLAUDE_PLUGIN_DATA (durable across plugin updates, kept out of the
// user's repo) when Claude Code provides it; fall back to the project root so
// older harnesses keep working.
const cwd = input.cwd || process.cwd();
const pluginDataDir = process.env.CLAUDE_PLUGIN_DATA;
const cacheDir = pluginDataDir
  ? join(pluginDataDir, 'visionary-cache')
  : join(cwd, '.visionary-cache');
try { mkdirSync(cacheDir, { recursive: true }); } catch { /* ignore */ }

const fileHash = createHash('md5').update(filePath).digest('hex').slice(0, 10);
const roundFile = join(cacheDir, `critique-round-${fileHash}`);
const timestampFile = join(cacheDir, `critique-ts-${fileHash}`);

// Debounce: if we critiqued this file within the last DEBOUNCE_MS ms, skip.
// Effectively makes the hook async: rapid multi-edits collapse into ONE critique
// at the tail of the burst, instead of a noisy critique per Write.
if (existsSync(timestampFile)) {
  try {
    const last = parseInt(readFileSync(timestampFile, 'utf8').trim(), 10) || 0;
    if (Date.now() - last < DEBOUNCE_MS) silent();
  } catch { /* ignore */ }
}
try { writeFileSync(timestampFile, String(Date.now())); } catch { /* ignore */ }

let round = 1;
if (existsSync(roundFile)) {
  try { round = parseInt(readFileSync(roundFile, 'utf8').trim(), 10) || 1; } catch { /* ignore */ }
}

if (round > MAX_ROUNDS) {
  try { writeFileSync(roundFile, '1'); } catch { /* ignore */ }
  silent();
}

// Screenshot path (Claude will create it via MCP on next turn)
const screenshotPath = join(tmpdir(), `visionary-screenshot-${fileHash}-${round}.png`);

// ── Deterministic slop pattern detection (patterns 1-20) ─────────────────────
let source = '';
try { source = readFileSync(filePath, 'utf8'); } catch { silent(); }

// Strip comments and string literals before scanning to kill false positives.
// Full AST parsing would require @babel/parser + postcss deps; this pre-pass
// catches the vast majority of "matches-inside-comment" cases (e.g. `text-cyan`
// matching a `// don't use text-cyan` comment) without introducing dependencies.
function sanitizeSource(src) {
  return src
    // JS/TS/CSS block comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Line comments (only at start of line or after whitespace — avoids URLs)
    .replace(/(^|\s)\/\/[^\n]*/g, '$1')
    // Template-literal strings (preserve the `${...}` bits, drop the rest)
    .replace(/`([^`\\]|\\.)*`/g, (m) => m.replace(/[^`${}]/g, ' '));
}

// For className/class attribute scans we want the FULL source — class names
// are strings by definition — so keep both versions.
const clean = sanitizeSource(source);

const slopFlags = [];
const push = (flag, cond) => { if (cond) slopFlags.push(flag); };

// Use boundary-anchored regexes to avoid `disabled:text-cyan-500` matching
// when we meant the standalone utility.
push('Purple/violet gradient background detected',
  /\b(from|via|to)-(purple|violet)-\d{2,3}\b/.test(clean));
push('Cyan-on-dark color scheme detected',
  /\btext-cyan-\d{2,3}\b|#06B6D4\b/i.test(clean));
push('Left-border accent card pattern detected',
  /\bborder-l-4\b|border-left:\s*4px\s+solid/.test(clean));
push('Dark background with colored glow shadow detected',
  /\bbg-(gray|zinc|slate)-900\b[\s\S]{0,120}\bshadow-[a-z0-9]+/.test(clean));
push('Gradient text on heading or metric detected',
  /\bbg-clip-text\b[\s\S]{0,200}\btext-transparent\b[\s\S]{0,200}\bbg-gradient/.test(clean) ||
  /\btext-transparent\b[\s\S]{0,200}\bbg-gradient/.test(clean));

const hasLargeText = /\btext-(4xl|5xl|6xl)\b/.test(clean);
const hasSmallText = /\btext-(sm|xs)\b/.test(clean);
const hasGradient = /\bbg-gradient-/.test(clean);
push('Hero Metric Layout detected (large number + small label + gradient)',
  hasLargeText && hasSmallText && hasGradient);

const cardMatches = clean.match(/className="[^"]*\bcard\b/g) || [];
push('Repeated 3-across card grid detected', cardMatches.length >= 3);

// Inter detection — look for actual font declarations, not coincidental uses
const hasInter = /font-family:\s*["']?Inter\b|fontFamily:\s*["']?Inter\b|--font-[a-z-]*:\s*["']?Inter\b/i.test(clean);
const hasSecondary = /\b(Bricolage|Instrument|Plus Jakarta|DM Sans|Geist|Grotesk|Vela|Gentium|Cabinet)/i.test(clean);
push('Inter as sole typeface detected', hasInter && !hasSecondary);

push('Generic system/web font as sole typeface detected',
  /font-family:\s*["']?(Roboto|Arial|Open Sans)\b/i.test(clean) && !hasSecondary);

push('Default Tailwind blue #3B82F6 as primary color detected',
  /\bbg-blue-500\b|#3B82F6\b/i.test(clean));
push('Default Tailwind purple #6366F1 as primary color detected',
  /\bbg-indigo-500\b|#6366F1\b/i.test(clean));
push('Default Tailwind green #10B981 as accent detected',
  /\btext-emerald-500\b|#10B981\b/i.test(clean));

const radiusCount = (clean.match(/\brounded-(lg|md|xl)\b/g) || []).length;
const classNameCount = (clean.match(/\bclassName=/g) || []).length || 1;
push('Uniform border-radius on all elements detected', radiusCount >= classNameCount);

const shadowMdCount = (clean.match(/\bshadow-md\b/g) || []).length;
push('shadow-md applied uniformly to multiple cards detected', shadowMdCount >= 3);

push('Centered hero with gradient backdrop and floating cards detected',
  /\btext-center\b/.test(clean) && /\bbg-gradient-/.test(clean) && /\babsolute\b/.test(clean));

push('Three-column icon+heading+paragraph feature section detected',
  /<[A-Z][A-Za-z]*Icon\b|<Icon\b/.test(clean) && /<h3\b/.test(clean) &&
  /\bgrid-cols-3\b|grid-cols-\[repeat\(3/.test(clean));

push('Poppins + blue gradient combination detected',
  /\bPoppins\b/.test(clean) && /\b(from-blue|bg-blue)-\d{2,3}\b/.test(clean));

push('White card on light gray background (low contrast) detected',
  /\bbg-white\b/.test(clean) && /\bbg-(gray-50|gray-100|slate-50)\b/.test(clean));

const symPad = (clean.match(/\bp-(4|6|8)\b/g) || []).length;
const axisPad = (clean.match(/\b(px|py)-\d/g) || []).length;
push('Symmetric padding everywhere (no horizontal/vertical rhythm) detected',
  symPad >= 3 && axisPad === 0);

// ── Increment round counter ──────────────────────────────────────────────────
try { writeFileSync(roundFile, String(round + 1)); } catch { /* ignore */ }

// ── Build additionalContext ──────────────────────────────────────────────────
const slopSection = slopFlags.length
  ? `\n\nDeterministic slop patterns pre-detected (include in design_slop_flags):\n${JSON.stringify(slopFlags)}`
  : '';

// Check for responsive breakpoints in source — drives multi-viewport capture
const needsMobileShot = /\b(sm|md|lg|xl):/g.test(clean) || /@media\s*\([^)]*max-width:/.test(clean);
const needsTabletShot = /\bmd:/.test(clean) || /@media\s*\([^)]*max-width:\s*7[5-9][0-9]/.test(clean);

// Preview URL: respect VISIONARY_PREVIEW_URL env override, else detect via hook payload
const previewUrl = process.env.VISIONARY_PREVIEW_URL || input.preview_url || 'http://localhost:3000';
const previewFallback = process.env.VISIONARY_PREVIEW_URL ? '' : ' (fallback http://localhost:5173)';

const mobileLine = needsMobileShot
  ? `   b. 375×812 (mobile) — source uses responsive breakpoints${needsTabletShot ? '\n   c. 768×1024 (tablet) — source uses md: breakpoint' : ''}`
  : '   (no responsive breakpoints detected — skip mobile/tablet shots)';

const context = [
  `VISUAL CRITIQUE REQUESTED — Round ${round}/${MAX_ROUNDS}`,
  '',
  `File written: ${filePath}`,
  `Screenshot target: ${screenshotPath}`,
  `Preview URL: ${previewUrl}${previewFallback}`,
  '',
  'NEXT-TURN ACTIONS (perform these now):',
  `1. Navigate via mcp__playwright__browser_navigate to ${previewUrl}. If that errors, try http://localhost:5173 (Vite default). If neither responds within 2 s, spin up a component-isolated Vite harness or instruct the user to set VISIONARY_PREVIEW_URL.`,
  `2. Wait via mcp__playwright__browser_evaluate for BOTH \`document.fonts.ready\` AND \`document.getAnimations().length === 0\`. Do NOT use networkidle — Playwright itself advises against it (sites with ads/analytics never settle).`,
  `3. Inject axe-core via mcp__playwright__browser_evaluate — pass the BODY of skills/visionary/axe-runtime.js as the \`function\` argument. It loads axe-core from jsdelivr (override via window.__VISIONARY_AXE_CDN__), runs WCAG 2.2 AA + APCA rules, and returns a structured summary the subagent consumes (see schema in axe-runtime.js).`,
  `4. Call mcp__playwright__browser_take_screenshot:\n   a. 1200×800 (desktop — always)${needsMobileShot ? '\n' + mobileLine : ''}`,
  `5. If any PNG's longest side > 1568 px, resize it (Claude vision optimum ≈ 1.15 megapixel; avoids GitHub issue #27611 infinite-retry on >5 MB inputs).`,
  `6. Invoke the visual-critic subagent (agents/visual-critic.md) with FRESH CONTEXT: brief + screenshots + axe-core JSON + slop flags + round ${round} + previous-round score. Do NOT include full chat history — SELF-REFINE pattern requires clean context per round.`,
  `7. Expect the 8-dimension critique JSON per skills/visionary/critique-schema.md.`,
  `8. If overall_score < 4.0 AND round < ${MAX_ROUNDS}, apply top_3_fixes to ${filePath} and let this hook re-trigger.`,
  `9. If round N score < round N-1 score by > 0.3, treat as convergence: stop iterating and return the previous round's output.`,
  '',
  `additionalContext cap: ${CONTEXT_CAP} chars — keep critique JSON concise.${slopSection}`,
].join('\n');

const truncated = context.length > CONTEXT_CAP
  ? context.slice(0, CONTEXT_CAP - 3) + '...'
  : context;

emit({ additionalContext: truncated });
