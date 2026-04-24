#!/usr/bin/env node
// taste-debug.mjs — backs the /visionary-taste slash command.
//
// CLI:
//   taste-debug.mjs status
//   taste-debug.mjs show [scope]         # all | project | global | component_type | archetype
//   taste-debug.mjs forget <fact-id>
//   taste-debug.mjs reset [--force]      # requires confirmation unless --force
//   taste-debug.mjs age [--dry-run]      # run aging rules manually
//
// Designed to be called from the /visionary-taste skill — the skill parses
// args and invokes this script via Bash. Output is human-readable Markdown
// for consumption in the LLM response; pure text, no ANSI codes.

import { readFileSync, existsSync, unlinkSync, writeFileSync } from 'node:fs';
import {
  findProjectRoot, projectKey as deriveProjectKey, factsPath, pairsPath,
  readFacts, readPairs, rewriteFacts, isoDaysAgo, factMatchesScope, isTasteDisabled,
} from '../hooks/scripts/lib/taste-io.mjs';
import { agingRun } from '../hooks/scripts/lib/taste-aging.mjs';

const args = process.argv.slice(2);
const sub = args[0] || 'status';
const rest = args.slice(1);

const projectRoot = findProjectRoot(process.cwd());
const projectKeyValue = deriveProjectKey(projectRoot);

function disabledNote() {
  if (isTasteDisabled()) {
    console.log('> ⚠️ `VISIONARY_DISABLE_TASTE=1` — reads are allowed, captures are silenced.');
    console.log('');
  }
}

if (sub === 'status') {
  disabledNote();
  const facts = readFacts(projectRoot).items;
  const pairs = readPairs(projectRoot).items;
  const active = facts.filter((f) => f.flag === 'active').length;
  const permanent = facts.filter((f) => f.flag === 'permanent').length;
  const decayed = facts.filter((f) => f.flag === 'decayed').length;
  const avoid = facts.filter((f) => f.signal?.direction === 'avoid').length;
  const prefer = facts.filter((f) => f.signal?.direction === 'prefer').length;

  console.log(`# Taste profile status — ${projectKeyValue}`);
  console.log('');
  console.log(`Facts:     **${facts.length}**  (active: ${active}, permanent: ${permanent}, decayed: ${decayed})`);
  console.log(`Direction: avoid ${avoid} · prefer ${prefer}`);
  console.log(`Pairs:     **${pairs.length}**  (\`/variants\` picks captured)`);
  console.log('');
  console.log(`Paths:`);
  console.log(`- \`${factsPath(projectRoot)}\``);
  console.log(`- \`${pairsPath(projectRoot)}\``);
  process.exit(0);
}

if (sub === 'show') {
  disabledNote();
  const scope = (rest[0] || 'all').toLowerCase();
  const facts = readFacts(projectRoot).items;
  const pairs = readPairs(projectRoot).items;

  let filtered = facts;
  if (scope !== 'all') {
    filtered = facts.filter((f) => {
      if (scope === 'project') return factMatchesScope(f, { projectKey: projectKeyValue }) && f.scope.level === 'project';
      if (scope === 'global') return f.scope?.level === 'global';
      if (scope === 'component_type' || scope === 'archetype') return f.scope?.level === scope;
      return false;
    });
  }

  console.log(`# Taste profile — scope: \`${scope}\``);
  console.log('');
  if (filtered.length === 0) {
    console.log('No facts at this scope.');
  } else {
    for (const f of filtered) {
      const evidenceCount = Array.isArray(f.evidence) ? f.evidence.length : 0;
      const age = isoDaysAgo(f.last_seen).toFixed(0);
      const flagIcon = f.flag === 'permanent' ? '🔒' : f.flag === 'decayed' ? '💤' : '●';
      console.log(`- ${flagIcon} \`${f.id}\``);
      console.log(`    ${f.signal.direction} \`${f.signal.target_type}\` = \`${f.signal.target_value}\``);
      console.log(`    scope: ${f.scope.level}/${f.scope.key} · conf ${(f.confidence || 0).toFixed(2)} · ${evidenceCount} evidence · last seen ${age}d ago`);
    }
  }

  if (scope === 'all' || scope === 'project') {
    console.log('');
    console.log(`## Pairs (${pairs.length})`);
    if (pairs.length === 0) {
      console.log('No pairs captured yet. Pick from a `/variants` session to create one.');
    } else {
      for (const p of pairs.slice(-10)) {
        const brief = p.context?.brief_summary || '(no brief)';
        console.log(`- \`${p.id}\` — "${brief}" → **${p.chosen.style_id}** (over ${(p.rejected || []).map((r) => r.style_id).join(', ')})`);
      }
      if (pairs.length > 10) console.log(`_...and ${pairs.length - 10} older pairs not shown._`);
    }
  }
  process.exit(0);
}

if (sub === 'forget') {
  const id = rest[0];
  if (!id) {
    console.log('**Missing fact-id.** Usage: `/visionary-taste forget <id>`. Get IDs via `/visionary-taste show`.');
    process.exit(1);
  }
  const facts = readFacts(projectRoot).items;
  const match = facts.find((f) => f.id === id);
  if (!match) {
    console.log(`No fact with id \`${id}\` — nothing to forget.`);
    process.exit(1);
  }
  const remaining = facts.filter((f) => f.id !== id);
  const ok = rewriteFacts(projectRoot, remaining);
  if (!ok) {
    console.log(`**Failed to rewrite facts.jsonl.** Check file permissions. Original file is intact.`);
    process.exit(1);
  }
  console.log(`Forgot fact \`${id}\` — ${match.signal.direction} ${match.signal.target_type}::${match.signal.target_value}`);
  console.log(`Remaining facts: ${remaining.length}`);
  process.exit(0);
}

if (sub === 'reset') {
  const force = rest.includes('--force') || rest.includes('-f');
  if (!force) {
    console.log('**Reset requires confirmation.**');
    console.log('');
    console.log('`/visionary-taste reset` will permanently delete:');
    console.log('- `taste/facts.jsonl`');
    console.log('- `taste/pairs.jsonl`');
    console.log('');
    console.log('Run again as `/visionary-taste reset --force` to proceed.');
    process.exit(1);
  }
  let removed = 0;
  for (const p of [factsPath(projectRoot), pairsPath(projectRoot)]) {
    if (existsSync(p)) {
      try { unlinkSync(p); removed++; } catch { /* ignore */ }
    }
  }
  console.log(`Reset complete — removed ${removed} file${removed === 1 ? '' : 's'} under \`taste/\`.`);
  console.log('Next taste signal will create fresh files.');
  process.exit(0);
}

if (sub === 'age') {
  const dryRun = rest.includes('--dry-run');
  agingRun(projectRoot, { dryRun }).then((result) => {
    if (result.skipped) {
      console.log(`Aging run skipped: ${result.skipped}`);
      process.exit(0);
    }
    const s = result.stats;
    console.log(`Aging run complete${dryRun ? ' (dry-run)' : ''}:`);
    console.log(`- promoted: ${s.promoted}`);
    console.log(`- decayed: ${s.decayed}`);
    console.log(`- deleted: ${s.deleted}`);
    console.log(`- unchanged: ${s.unchanged}`);
    console.log(`- facts remaining: ${result.kept}`);
    process.exit(0);
  }).catch((e) => {
    console.log(`**Aging failed:** ${e.message || e}`);
    process.exit(1);
  });
} else {
  console.log(`Unknown subcommand: \`${sub}\``);
  console.log('');
  console.log('Usage:');
  console.log('- `/visionary-taste status`');
  console.log('- `/visionary-taste show [all|project|global|component_type|archetype]`');
  console.log('- `/visionary-taste forget <fact-id>`');
  console.log('- `/visionary-taste reset [--force]`');
  console.log('- `/visionary-taste age [--dry-run]`');
  process.exit(1);
}
