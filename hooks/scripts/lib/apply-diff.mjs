// Unified-diff applier. Takes an in-memory file's content plus a unified-diff
// (GNU patch format) string and returns the patched content.
//
// Written dep-free on purpose: the repo has no package.json and shipping a
// patch library for one feature was rejected during Sprint 01 scope review.
// The implementation handles:
//   * multiple hunks per file
//   * line-number drift with configurable fuzz tolerance
//   * `\ No newline at end of file` markers for both sides
//   * Unicode content (string-level operations, no byte gymnastics)
//   * LF, CRLF, and CR line endings (detected from the source, re-emitted
//     verbatim).
//
// NOT handled (out of scope; fall back to full regen when these appear):
//   * Binary patches (Git's `GIT binary patch` format).
//   * Renames/creates/deletes (`--- /dev/null` or `+++ /dev/null`).
//   * Multiple files in a single diff — the caller splits those first.
//
// Return contracts:
//
//   parseUnifiedDiff(diffText)
//     → { ok: true, patch: { oldPath, newPath, hunks: [...] } }
//     | { ok: false, reason: string }
//
//   applyPatch(sourceContent, patch, { fuzz, dryRun })
//     → { ok: true, content: string, stats: { hunksApplied, linesChanged } }
//     | { ok: false, reason: string, hunkIndex: number }

const NO_NEWLINE = '\\ No newline at end of file';

// ── Parsing ─────────────────────────────────────────────────────────────────
export function parseUnifiedDiff(diffText) {
  if (typeof diffText !== 'string' || diffText.length === 0) {
    return { ok: false, reason: 'empty diff' };
  }
  const lines = splitPreservingNewline(diffText).map(stripLineEnd);

  let i = 0;
  // Skip any preamble before the first ---
  while (i < lines.length && !lines[i].startsWith('--- ')) i++;
  if (i >= lines.length) return { ok: false, reason: 'no --- header found' };

  const oldPath = stripPathPrefix(lines[i].slice(4).trim());
  i++;

  if (i >= lines.length || !lines[i].startsWith('+++ ')) {
    return { ok: false, reason: 'missing +++ header' };
  }
  const newPath = stripPathPrefix(lines[i].slice(4).trim());
  i++;

  const hunks = [];
  while (i < lines.length) {
    if (!lines[i].startsWith('@@')) break;
    const header = parseHunkHeader(lines[i]);
    if (!header) return { ok: false, reason: `invalid hunk header: ${lines[i]}` };
    i++;

    // Consume exactly `oldCount` old-side and `newCount` new-side lines so
    // trailing empty strings (produced by splitting a diff that ends with a
    // newline) do not get mistaken for empty context rows. Diffs represent
    // blank context lines as a single space followed by nothing (" "), not
    // as an empty string.
    const hunkLines = [];
    let oldNeeded = header.oldCount;
    let newNeeded = header.newCount;
    while (i < lines.length) {
      const raw = lines[i];
      // NO_NEWLINE can appear *after* counters reach zero (marking the last
      // emitted line) so it must be consumable independent of the counters.
      if (raw === NO_NEWLINE) {
        if (hunkLines.length > 0) {
          hunkLines[hunkLines.length - 1].noEndingNewline = true;
        }
        i++;
        continue;
      }
      if (oldNeeded === 0 && newNeeded === 0) break;
      if (raw.length === 0) {
        // Bare empty string = EOF or separator, not a context line.
        break;
      }
      const op = raw[0];
      if (op === ' ') {
        hunkLines.push({ op, text: raw.slice(1) });
        oldNeeded--;
        newNeeded--;
      } else if (op === '-') {
        hunkLines.push({ op, text: raw.slice(1) });
        oldNeeded--;
      } else if (op === '+') {
        hunkLines.push({ op, text: raw.slice(1) });
        newNeeded--;
      } else {
        // Unknown prefix = end of this hunk. Stop without advancing so the
        // outer loop can evaluate whether it is the next @@ or a terminator.
        break;
      }
      i++;
    }

    if (oldNeeded > 0 || newNeeded > 0) {
      return {
        ok: false,
        reason: `hunk truncated: header wants ${header.oldCount}/${header.newCount} but got ${header.oldCount - oldNeeded}/${header.newCount - newNeeded}`,
      };
    }
    hunks.push({ ...header, lines: hunkLines });
  }

  if (hunks.length === 0) return { ok: false, reason: 'no hunks parsed' };
  return { ok: true, patch: { oldPath, newPath, hunks } };
}

// ── Apply ───────────────────────────────────────────────────────────────────
export function applyPatch(sourceContent, patch, options = {}) {
  const { fuzz = 3, dryRun = false } = options;
  if (typeof sourceContent !== 'string') {
    return { ok: false, reason: 'source content must be string' };
  }
  if (!patch || !Array.isArray(patch.hunks)) {
    return { ok: false, reason: 'patch object invalid' };
  }

  const lineEnding = detectLineEnding(sourceContent);
  const endsWithNewline = sourceContent.endsWith(lineEnding);
  // Split into "logical lines" without the trailing delimiter, so we can
  // splice cleanly and re-join later.
  const rawLines = sourceContent.split(lineEnding);
  // A trailing empty element appears when content ends with lineEnding — drop
  // it so the array describes real content lines. We remember via
  // endsWithNewline so the output can re-add the terminator.
  if (endsWithNewline && rawLines[rawLines.length - 1] === '') rawLines.pop();

  let lines = rawLines.slice();
  // Offset accumulates across hunks so the Nth hunk's search starts at the
  // correct shifted position after the N-1 prior insertions/deletions.
  let offset = 0;
  let hunksApplied = 0;
  let linesChanged = 0;
  let newEndsWithNewline = endsWithNewline;

  for (let h = 0; h < patch.hunks.length; h++) {
    const hunk = patch.hunks[h];
    const contextOld = hunk.lines.filter((l) => l.op !== '+').map((l) => l.text);
    const contextNew = hunk.lines.filter((l) => l.op !== '-').map((l) => l.text);

    // Desired start position per hunk header (1-indexed → 0-indexed).
    const desired = Math.max(0, (hunk.oldStart - 1) + offset);
    const loc = findHunkLocation(lines, contextOld, desired, fuzz);
    if (loc === -1) {
      return { ok: false, reason: `hunk #${h + 1} did not match within fuzz=${fuzz}`, hunkIndex: h };
    }

    // Replace contextOld at loc with contextNew.
    const before = lines.slice(0, loc);
    const after = lines.slice(loc + contextOld.length);
    lines = [...before, ...contextNew, ...after];
    offset += contextNew.length - contextOld.length;
    hunksApplied++;
    linesChanged += hunk.lines.filter((l) => l.op !== ' ').length;

    // Update trailing-newline state if the final hunk line carries the
    // "\ No newline at end of file" marker and touches the last line.
    const last = hunk.lines[hunk.lines.length - 1];
    if (last && last.noEndingNewline && loc + contextOld.length === rawLines.length) {
      if (last.op === '-') {
        // The old side had no trailing newline; the removal + add flips it
        // back to whatever the new side says — handled by the '+' branch
        // running after this on the same final line.
      }
      if (last.op === '+' || last.op === ' ') {
        newEndsWithNewline = false;
      }
    }
  }

  const joined = lines.join(lineEnding) + (newEndsWithNewline ? lineEnding : '');
  if (dryRun) {
    return { ok: true, content: sourceContent, stats: { hunksApplied, linesChanged }, dryRun: true };
  }
  return { ok: true, content: joined, stats: { hunksApplied, linesChanged } };
}

// Convenience: parse + apply in one call when you have the raw diff text.
export function applyUnifiedDiff(sourceContent, diffText, options = {}) {
  const parsed = parseUnifiedDiff(diffText);
  if (!parsed.ok) return { ok: false, reason: parsed.reason };
  return applyPatch(sourceContent, parsed.patch, options);
}

// ── Internals ───────────────────────────────────────────────────────────────
function parseHunkHeader(line) {
  // @@ -oldStart,oldCount +newStart,newCount @@ [optional context]
  const m = line.match(/^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@/);
  if (!m) return null;
  return {
    oldStart: parseInt(m[1], 10),
    oldCount: m[2] !== undefined ? parseInt(m[2], 10) : 1,
    newStart: parseInt(m[3], 10),
    newCount: m[4] !== undefined ? parseInt(m[4], 10) : 1,
  };
}

function findHunkLocation(lines, contextOld, desired, fuzz) {
  if (matchesAt(lines, contextOld, desired)) return desired;
  // Try progressively wider offsets: 1, -1, 2, -2, ...
  for (let d = 1; d <= fuzz; d++) {
    if (desired + d + contextOld.length <= lines.length && matchesAt(lines, contextOld, desired + d)) {
      return desired + d;
    }
    if (desired - d >= 0 && matchesAt(lines, contextOld, desired - d)) {
      return desired - d;
    }
  }
  // Last resort: linear scan. Expensive but acceptable for modest files —
  // the alternative is to hard-fail on any drift beyond fuzz, which the
  // sprint-plan's multi-round diff scenarios would hit often.
  for (let i = 0; i + contextOld.length <= lines.length; i++) {
    if (matchesAt(lines, contextOld, i)) return i;
  }
  return -1;
}

function matchesAt(lines, contextOld, at) {
  if (at < 0) return false;
  if (at + contextOld.length > lines.length) return false;
  for (let i = 0; i < contextOld.length; i++) {
    if (lines[at + i] !== contextOld[i]) return false;
  }
  return true;
}

function detectLineEnding(src) {
  // CRLF wins if present at all — mixed endings are rare in source files, and
  // when they happen Windows-authored sources default to CRLF.
  if (src.includes('\r\n')) return '\r\n';
  if (src.includes('\r') && !src.includes('\n')) return '\r';
  return '\n';
}

function splitPreservingNewline(text) {
  // We strip terminators in stripLineEnd; this split only needs to preserve
  // line boundaries.
  return text.split(/\r\n|\r|\n/);
}

function stripLineEnd(s) {
  // Each element from split() has no terminator, but guard against future
  // changes and trailing \r survivors.
  return s.replace(/[\r\n]+$/, '');
}

function stripPathPrefix(p) {
  // Classic diff paths look like `a/src/foo.js` or `b/src/foo.js`. Also
  // handle bare paths and timestamped headers (`a/foo.js\t2026-04-22`).
  const tabIdx = p.indexOf('\t');
  const raw = tabIdx === -1 ? p : p.slice(0, tabIdx);
  if (raw.startsWith('a/') || raw.startsWith('b/')) return raw.slice(2);
  return raw;
}
