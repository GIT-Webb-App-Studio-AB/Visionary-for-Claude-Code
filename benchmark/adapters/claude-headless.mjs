// Claude Code headless adapter — invokes `claude -p` for each prompt and
// captures the first generated source file. Works for any skill that can be
// activated by a user-authored skill hint (visionary, frontend-design,
// ui-ux-pro-max, etc.).
//
// Safety: uses execFile (no shell). Prompt text and flags are passed as
// argv elements; no shell parsing happens anywhere in this file.
//
// Environment variables:
//   CLAUDE_BIN                path to claude CLI        (default: "claude")
//   CLAUDE_MODEL              model slug                (default: unset → CLI default)
//   CLAUDE_SKILL_HINT         text prepended to prompt  (default: "Use the visionary skill. ")
//   CLAUDE_SYSTEM_PROMPT_FILE file path whose contents override the skill hint
//   CLAUDE_OUT_DIR            where to write generated files (default: benchmark/.staged-headless)
//   CLAUDE_TIMEOUT_MS         per-prompt timeout in ms  (default: 240000)

import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');

const BIN = process.env.CLAUDE_BIN || 'claude';
const MODEL = process.env.CLAUDE_MODEL || null;
const SKILL_HINT = process.env.CLAUDE_SKILL_HINT || 'Use the visionary skill. ';
const SYSTEM_PROMPT_FILE = process.env.CLAUDE_SYSTEM_PROMPT_FILE || null;
const OUT_DIR = process.env.CLAUDE_OUT_DIR
  ? resolve(process.env.CLAUDE_OUT_DIR)
  : join(repoRoot, 'benchmark', '.staged-headless');
const TIMEOUT_MS = parseInt(process.env.CLAUDE_TIMEOUT_MS || '240000', 10);

const systemPromptOverride = SYSTEM_PROMPT_FILE && existsSync(SYSTEM_PROMPT_FILE)
  ? readFileSync(SYSTEM_PROMPT_FILE, 'utf8')
  : null;

mkdirSync(OUT_DIR, { recursive: true });

// Constrained instructions that shape the generated output so the scorers
// can find code blocks. The skill's own generation pipeline still runs; we
// only append the output contract the benchmark depends on.
const OUTPUT_INSTRUCTIONS = [
  '',
  'Output contract for this run:',
  '- Emit exactly one React/TSX component file as your final answer.',
  '- Wrap the code in a single ```tsx fenced block.',
  '- Do NOT write to disk. Do NOT run the dev server. Do NOT invoke Playwright.',
  '- Follow the skill\'s design rules (motion tokens, WCAG 2.2 AA, reduced-motion gate, correct lang attribute and diacritics).',
  '- Keep it to one self-contained file — no separate CSS files, no token imports the benchmark cannot resolve.',
].join('\n');

function buildPrompt({ prompt, constraints }) {
  const hint = systemPromptOverride ? '' : SKILL_HINT;
  const constraintLines = constraints
    ? Object.entries(constraints).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`).join('\n')
    : '';
  const constraintBlock = constraintLines ? `\n\nConstraints:\n${constraintLines}` : '';
  return `${hint}${prompt.prompt}${constraintBlock}${OUTPUT_INSTRUCTIONS}`;
}

function extractCode(stdout) {
  const fence = /```(?:tsx?|jsx?|javascript|typescript)?\n([\s\S]*?)```/g;
  const blocks = [];
  let m;
  while ((m = fence.exec(stdout)) !== null) blocks.push(m[1]);
  if (blocks.length === 0) return null;
  return blocks.sort((a, b) => b.length - a.length)[0];
}

// execFile never invokes a shell — argv elements go straight to the process.
// On Windows, set CLAUDE_BIN to the full path of claude.cmd or claude.exe so
// Node can locate the executable without PATH shell resolution.
function runClaudeOnce(promptText) {
  return new Promise((done) => {
    // --disallowedTools prevents the nested Claude session from writing to
    // disk, which would fire visionary's own PostToolUse critique hook and
    // wait for a "next turn" that never comes in headless mode. The skill
    // still loads and guides generation; only file writing is suppressed.
    const args = [
      '-p', promptText,
      '--output-format', 'text',
      '--disallowedTools', 'Write Edit MultiEdit Bash',
      '--dangerously-skip-permissions',
    ];
    if (MODEL) args.push('--model', MODEL);
    if (systemPromptOverride) args.push('--system-prompt', systemPromptOverride);

    const child = execFile(
      BIN,
      args,
      {
        timeout: TIMEOUT_MS,
        maxBuffer: 16 * 1024 * 1024,
        windowsHide: true,
        // Close stdin so the CLI does not wait 3s+ for piped input when
        // -p is already provided on the command line.
        stdio: ['ignore', 'pipe', 'pipe'],
      },
      (err, stdout, stderr) => {
        if (err) {
          const hint = err.code === 'ENOENT' && process.platform === 'win32'
            ? ' (hint: set CLAUDE_BIN to the full path of claude.cmd)'
            : '';
          return done({ ok: false, reason: `${err.code || 'error'}: ${err.message}${hint}`, stdout, stderr });
        }
        done({ ok: true, stdout, stderr });
      }
    );
    // Defensive: ensure long-running child does not leak if caller aborts.
    child.on('error', () => { /* handled in callback */ });
  });
}

export async function run({ prompt, constraints }) {
  const promptText = buildPrompt({ prompt, constraints });
  const result = await runClaudeOnce(promptText);

  if (!result.ok) {
    return { files: [], error: `${result.reason}${result.stderr ? ` — ${result.stderr.slice(0, 200)}` : ''}` };
  }

  const code = extractCode(result.stdout);
  if (!code) {
    return { files: [], error: 'no fenced code block in response' };
  }

  const outPath = join(OUT_DIR, `${prompt.id}.tsx`);
  writeFileSync(outPath, code, 'utf8');
  return { files: [{ path: outPath, content: code }] };
}
