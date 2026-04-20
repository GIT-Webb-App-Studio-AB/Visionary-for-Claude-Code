#!/usr/bin/env node
// check-for-updates.mjs — SessionStart hook
// Rate-limited background check for visionary-claude plugin updates.
// Parent emits `{}` immediately and spawns a detached child that runs
// `claude plugin marketplace update` + `claude plugin update <plugin>@<marketplace>`.
// A downloaded update activates on the next Claude Code restart.
//
// Rate limit: 24h (stamp in CLAUDE_PLUGIN_DATA).
// Disable per-user: export VISIONARY_NO_AUTOUPDATE=1

import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const MARKETPLACE = 'visionary-marketplace';
const PLUGIN = 'visionary-claude';
const PLUGIN_QUALIFIED = `${PLUGIN}@${MARKETPLACE}`;
const INTERVAL_MS = 24 * 60 * 60 * 1000;

const emit = () => { process.stdout.write('{}'); process.exit(0); };

if (process.env.VISIONARY_NO_AUTOUPDATE === '1') emit();

const dataDir = process.env.CLAUDE_PLUGIN_DATA || join(tmpdir(), 'visionary-claude');
try { mkdirSync(dataDir, { recursive: true }); } catch { /* ignore */ }

const stampFile = join(dataDir, '.last-update-check');
const logFile = join(dataDir, 'autoupdate.log');
const isChild = process.env.VISIONARY_AUTOUPDATE_CHILD === '1';

if (!isChild) {
  try {
    const last = parseInt(readFileSync(stampFile, 'utf8'), 10);
    if (Number.isFinite(last) && Date.now() - last < INTERVAL_MS) emit();
  } catch { /* no stamp yet */ }

  try { writeFileSync(stampFile, String(Date.now())); } catch { /* ignore */ }

  const child = spawn(process.execPath, [process.argv[1]], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, VISIONARY_AUTOUPDATE_CHILD: '1' },
    windowsHide: true,
  });
  child.unref();
  emit();
}

// ── Detached child path ──────────────────────────────────────────────────────
const log = (line) => {
  try { appendFileSync(logFile, `[${new Date().toISOString()}] ${line}\n`); } catch { /* ignore */ }
};

const run = (cmd, args) => new Promise((resolve) => {
  const p = spawn(cmd, args, { shell: process.platform === 'win32', windowsHide: true });
  let out = '', err = '';
  p.stdout.on('data', (d) => { out += d; });
  p.stderr.on('data', (d) => { err += d; });
  p.on('close', (code) => resolve({ code, out: out.toString().trim(), err: err.toString().trim() }));
  p.on('error', (e) => resolve({ code: -1, out: '', err: String(e) }));
});

const tail = (s) => (s || '').split('\n').filter(Boolean).pop() || '';

(async () => {
  log('check-start');
  const m = await run('claude', ['plugin', 'marketplace', 'update', MARKETPLACE]);
  log(`marketplace exit=${m.code} :: ${tail(m.out) || tail(m.err)}`);
  const u = await run('claude', ['plugin', 'update', PLUGIN_QUALIFIED]);
  log(`update exit=${u.code} :: ${tail(u.out) || tail(u.err)}`);
  log('check-end');
  process.exit(0);
})();
