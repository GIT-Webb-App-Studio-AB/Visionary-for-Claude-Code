#!/usr/bin/env node
// rotate-traces.mjs — Sprint 06 Task 19.5
//
// SessionStart hook. Compresses trace files older than COMPRESS_AFTER_DAYS
// (7 by default) and deletes files older than VISIONARY_TRACE_RETENTION_DAYS
// (90 by default). Silent on success — hooks only emit additionalContext
// when they have something actionable to say.
//
// Opt-out: VISIONARY_NO_TRACES=1 short-circuits the rotation so a disabled
// profile doesn't mutate on-disk state.

import { rotateOldTraces, isTracesDisabled } from './lib/trace.mjs';

try {
  if (isTracesDisabled()) {
    // Be silent — a disabled project shouldn't log noise every session start.
    process.exit(0);
  }
  const result = rotateOldTraces();
  // Emit a compact diagnostic to stderr only when something actually happened.
  // Claude Code hooks surface stderr in the harness log but NOT in conversation,
  // so this is safe to keep terse.
  if (result && (result.compressed > 0 || result.deleted > 0)) {
    process.stderr.write(`[visionary] trace rotation: compressed=${result.compressed} deleted=${result.deleted}\n`);
  }
} catch (err) {
  // Rotation is best-effort. A failure here must NOT block session start.
  process.stderr.write(`[visionary] trace rotation failed: ${err.message}\n`);
}
process.exit(0);
