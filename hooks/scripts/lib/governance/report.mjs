// Drift report formatter — Sprint 14.

export function formatDriftReport({ result, lockedTokensPath, byFile }) {
  const lines = [];
  lines.push('Token Drift Report');
  lines.push('==================');
  if (lockedTokensPath) lines.push(`Locked tokens: ${lockedTokensPath}`);

  let totalDrifts = 0;
  let totalWarnings = 0;
  for (const r of (byFile || [])) {
    totalDrifts += r.result.drifts.length;
    totalWarnings += r.result.warnings.length;
  }
  lines.push('');
  lines.push(`${totalDrifts} drift(s) and ${totalWarnings} warning(s) across ${(byFile || []).length} file(s).`);
  lines.push('');

  for (const fileResult of byFile || []) {
    if (fileResult.result.drifts.length === 0 && fileResult.result.warnings.length === 0) continue;
    lines.push(`  ${fileResult.path}`);
    for (const d of fileResult.result.drifts.slice(0, 20)) {
      lines.push(`    Line ${d.line}: ${d.kind} value '${d.value}'`);
      lines.push(`      → Not in locked palette/scale`);
      if (d.suggestion?.length) {
        lines.push(`      → Closest: ${d.suggestion[0]}`);
      }
    }
    for (const w of fileResult.result.warnings.slice(0, 10)) {
      lines.push(`    Line ${w.line}: ${w.kind} value '${w.value}' (warn — within tolerance)`);
    }
  }
  return lines.join('\n');
}
