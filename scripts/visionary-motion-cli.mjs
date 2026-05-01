#!/usr/bin/env node
// /visionary-motion CLI — Sprint 13.
//
// Resolves an intent → adjustments, applies them to a component
// (DTCG / JSX / CSS), runs before/after scorer, prints a JSON report.
// --preview skips the write and just produces a diff payload.

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolveVibe } from '../hooks/scripts/lib/vibe-motion/intent-map.mjs';
import { applyAdjustmentsToSource, applyAdjustmentsToTokensJson } from '../hooks/scripts/lib/vibe-motion/apply-diff.mjs';
import { scoreBeforeAfter, formatDiffReport } from '../hooks/scripts/lib/vibe-motion/scoring-diff.mjs';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { intent: null, component: null, preview: false, json: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--intent') out.intent = args[++i];
    else if (a === '--component') out.component = args[++i];
    else if (a === '--preview') out.preview = true;
    else if (a === '--json') out.json = true;
  }
  return out;
}

function emitJson(obj, code = 0) {
  process.stdout.write(JSON.stringify(obj, null, 2));
  process.exit(code);
}

async function main() {
  const args = parseArgs();
  if (!args.intent) {
    return emitJson({ error: 'missing-intent', usage: 'node scripts/visionary-motion-cli.mjs --intent <text> [--component <path>] [--preview]' }, 2);
  }

  const resolved = resolveVibe(args.intent);
  if (resolved.error) {
    return emitJson({
      error: resolved.error,
      input: args.intent,
      suggestions: resolved.suggestions || [],
    }, 2);
  }

  if (!args.component) {
    return emitJson({
      error: 'missing-component',
      hint: 'pass --component <path> for now (auto-resolution from traces is a follow-up)',
      vibe: resolved.vibe.id,
      adjustments: resolved.vibe.adjustments,
    }, 2);
  }

  if (!existsSync(args.component)) {
    return emitJson({ error: 'component-not-found', path: args.component }, 2);
  }

  const before = await readFile(args.component, 'utf8');

  // Try DTCG-tokens first if extension is .json
  let result;
  if (args.component.endsWith('.tokens.json') || args.component.endsWith('.dtcg.json')) {
    const tokens = JSON.parse(before);
    const applied = applyAdjustmentsToTokensJson(tokens, resolved.vibe.adjustments);
    result = {
      kind: 'tokens',
      changed: applied.changed,
      patches: applied.patches,
      after: JSON.stringify(applied.tokens, null, 2),
    };
  } else {
    const applied = applyAdjustmentsToSource(before, resolved.vibe.adjustments);
    result = {
      kind: 'source',
      changed: applied.changed,
      patches: applied.patches,
      after: applied.source,
    };
  }

  const scoring = scoreBeforeAfter(before, result.after);

  const payload = {
    vibe: resolved.vibe.id,
    keyword_matched: resolved.keyword,
    match_type: resolved.match,
    component: args.component,
    preview: args.preview,
    changed: result.changed,
    patches: result.patches,
    rationale: resolved.vibe.rationale,
    scoring: {
      before: { total: scoring.before.total_score, tier: scoring.before.tier_name, mr_10: scoring.before.motion_readiness_10 },
      after: { total: scoring.after.total_score, tier: scoring.after.tier_name, mr_10: scoring.after.motion_readiness_10 },
      delta: scoring.delta,
    },
    summary: formatDiffReport(scoring),
  };

  if (!args.preview && result.changed) {
    await writeFile(args.component, result.after, 'utf8');
    payload.written = true;
  }

  emitJson(payload, 0);
}

main().catch((err) => {
  emitJson({ error: 'cli-fatal', message: err.message }, 1);
});
