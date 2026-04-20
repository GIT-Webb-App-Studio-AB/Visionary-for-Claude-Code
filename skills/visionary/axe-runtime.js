/**
 * axe-runtime.js — Deterministic accessibility scanning for the critique loop.
 *
 * Loaded by the visual-critic subagent via `mcp__playwright__browser_evaluate`.
 * Runs axe-core against the live DOM, returns a structured JSON summary the
 * subagent can weight into the Accessibility dimension score.
 *
 * Architecture: Claude Code hooks CANNOT call MCP tools directly (issue
 * #26112). The hook emits additionalContext instructing Claude to call
 * `browser_evaluate` with THIS SCRIPT on its next turn. The result flows
 * into the visual-critic agent alongside screenshots.
 *
 * Usage from the subagent:
 *
 *   const script = readFileSync('skills/visionary/axe-runtime.js', 'utf8');
 *   const result = await mcp__playwright__browser_evaluate({ function: script });
 *   // result matches AxeCriticResult below
 */

/* eslint-disable no-unused-expressions */
// The function body below is what gets serialized into browser_evaluate.
// We wrap it in an IIFE returning a Promise so Playwright awaits the result.

(async () => {
  // ── 1. Load axe-core from CDN if not already present ─────────────────
  // jsdelivr is CSP-friendly on most dev servers; users can self-host by
  // editing VISIONARY_AXE_CDN in the hook payload.
  const CDN = (typeof window !== 'undefined' && window.__VISIONARY_AXE_CDN__) ||
              'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js';

  if (typeof window.axe === 'undefined') {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = CDN;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error('axe-core failed to load from ' + CDN));
      document.head.appendChild(s);
    });
  }

  // ── 2. Configure axe ─────────────────────────────────────────────────
  // - Enable WCAG 2.1 + 2.2 level A and AA rules
  // - Enable the experimental APCA rule for dual-floor perceptual contrast
  // - Skip rules that are site-level (meta viewport, landmark-one-main) if
  //   we're auditing a component isolated in a test harness
  const config = {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'],
    },
    resultTypes: ['violations', 'passes', 'incomplete'],
    rules: {
      // Enable experimental APCA — axe-core 4.9+ ships it as experimental.
      'color-contrast-enhanced': { enabled: true },
    },
  };

  // If the harness sets a flag, drop site-level rules.
  if (window.__VISIONARY_COMPONENT_HARNESS__) {
    config.rules['landmark-one-main'] = { enabled: false };
    config.rules['region'] = { enabled: false };
    config.rules['page-has-heading-one'] = { enabled: false };
    config.rules['document-title'] = { enabled: false };
    config.rules['html-has-lang'] = { enabled: false };
  }

  // ── 3. Run axe ───────────────────────────────────────────────────────
  const report = await window.axe.run(document, config);

  // ── 4. Summarize to a stable shape the subagent can consume ──────────
  const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const violations = report.violations.map((v) => {
    if (v.impact && byImpact[v.impact] != null) byImpact[v.impact] += 1;
    return {
      id: v.id,
      impact: v.impact,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.slice(0, 3).map((n) => ({
        target: n.target,
        html: n.html.slice(0, 200),
        failureSummary: n.failureSummary,
      })),
      nodeCount: v.nodes.length,
    };
  });

  // Extract contrast measurements so the subagent can cross-check APCA:
  // axe reports the measured ratio in the checks[] array of each violation
  // targeting color-contrast rules.
  const contrastSamples = [];
  for (const v of report.violations) {
    if (!['color-contrast', 'color-contrast-enhanced'].includes(v.id)) continue;
    for (const node of v.nodes) {
      for (const c of node.any || []) {
        if (c.data && c.data.contrastRatio) {
          contrastSamples.push({
            ratio: c.data.contrastRatio,
            fg: c.data.fgColor,
            bg: c.data.bgColor,
            fontSize: c.data.fontSize,
            fontWeight: c.data.fontWeight,
            target: node.target[0],
          });
        }
      }
    }
  }

  // ── 5. Emit the summary ──────────────────────────────────────────────
  return {
    meta: {
      url: report.url,
      timestamp: report.timestamp,
      toolOptions: report.toolOptions,
      engine: report.testEngine,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    },
    counts: {
      violations: violations.length,
      passes: report.passes.length,
      incomplete: report.incomplete.length,
      byImpact,
    },
    violations,
    contrastSamples,
    // Leave passes/incomplete off the main payload — subagent doesn't need
    // the 30+ pass records; meta.counts.passes is enough.
  };
})();
