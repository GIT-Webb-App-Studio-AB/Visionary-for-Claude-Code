// Evidence validation for top_3_fixes — Sprint 3 Task 9.3.
//
// The Rulers-framework requirement is: every score below 7 must cite
// mechanical evidence (axe rule, CSS selector, numeric metric, or coordinate).
// Citations that reference a CSS selector carry a verification obligation —
// if the selector matches zero elements in the rendered DOM, the critic is
// hallucinating structure that doesn't exist and the critique is untrustworthy.
//
// Architecture: the hook runs in Node; the browser lives behind Playwright
// MCP. We can't invoke `document.querySelector` from here. So this module
// exposes PURE FUNCTIONS the caller orchestrates:
//
//   1. `collectSelectorQueries(critique)` → returns every selector-type
//      evidence value across top_3_fixes, with stable ordinals so the caller
//      can feed back results by fix index.
//
//   2. (caller) runs each selector via mcp__playwright__browser_evaluate and
//      records whether it matched at least one element.
//
//   3. `applyValidation(critique, results)` → stamps an `evidence_invalid`
//      flag on each fix whose selector didn't match anything; returns a
//      structured summary the hook can fold into next round's warning.
//
//   4. `shouldRetryCritic(critique)` → returns true when 2+ invalid
//      citations appeared in the same round (the retry guard from the sprint
//      plan). The caller retries with an alternate model.
//
//   5. `formatInvalidWarning(critique)` → canned prose the caller injects
//      into the NEXT round's additionalContext, citing every invalid
//      selector so the critic can self-correct.

const INVALID_RETRY_THRESHOLD = 2;

// ── Step 1: collect selector queries ────────────────────────────────────────
// Returns an array of { fixIndex, selector } objects. Ordering is stable and
// matches the order of `top_3_fixes`. Non-selector evidence types are
// filtered out — axe IDs are validated by the axe runtime itself, metric
// citations by the numeric scorer, coord citations by the caller.
export function collectSelectorQueries(critique) {
  if (!critique || !Array.isArray(critique.top_3_fixes)) return [];
  const queries = [];
  critique.top_3_fixes.forEach((fix, i) => {
    const ev = fix?.evidence;
    if (!ev || typeof ev !== 'object') return;
    if (ev.type !== 'selector') return;
    if (typeof ev.value !== 'string' || ev.value.trim() === '') return;
    queries.push({ fixIndex: i, selector: ev.value.trim() });
  });
  return queries;
}

// ── Step 3: apply validation results ────────────────────────────────────────
// `results` is an array of { fixIndex, matched } objects from the caller.
// `matched` is true when document.querySelectorAll(selector).length >= 1.
//
// Returns a NEW critique object (never mutates input) with `evidence_invalid:
// true` added to any fix whose selector didn't match. Also returns a summary
// block the caller can log as a metric.
export function applyValidation(critique, results) {
  if (!critique || !Array.isArray(critique.top_3_fixes)) {
    return { critique, summary: emptySummary() };
  }
  const resultByIndex = new Map();
  for (const r of Array.isArray(results) ? results : []) {
    if (r && Number.isInteger(r.fixIndex)) {
      resultByIndex.set(r.fixIndex, !!r.matched);
    }
  }

  const fixes = critique.top_3_fixes.map((fix, i) => {
    if (!fix || !fix.evidence || fix.evidence.type !== 'selector') return fix;
    if (!resultByIndex.has(i)) {
      // No result recorded — don't guess; leave the fix untouched but note
      // it in the summary as `unverified`. This is different from invalid.
      return fix;
    }
    const matched = resultByIndex.get(i);
    if (matched) return fix;
    return {
      ...fix,
      evidence_invalid: true,
      // Preserve the original evidence so the critic can see what they
      // previously claimed — needed for the warning text in round N+1.
    };
  });

  const invalid = [];
  const unverified = [];
  const verified = [];
  fixes.forEach((fix, i) => {
    if (!fix || !fix.evidence || fix.evidence.type !== 'selector') return;
    if (fix.evidence_invalid === true) invalid.push({ fixIndex: i, selector: fix.evidence.value });
    else if (!resultByIndex.has(i)) unverified.push({ fixIndex: i, selector: fix.evidence.value });
    else verified.push({ fixIndex: i, selector: fix.evidence.value });
  });

  return {
    critique: { ...critique, top_3_fixes: fixes },
    summary: {
      invalid_count: invalid.length,
      verified_count: verified.length,
      unverified_count: unverified.length,
      invalid,
      unverified,
      verified,
    },
  };
}

// ── Step 4: retry guard ─────────────────────────────────────────────────────
// Sprint plan: "Tröskelvärde: om ≥ 2 invalid-evidence per runda → failura
// kritiker, retry med annan modell". Returns { retry, reason, invalidCount }.
export function shouldRetryCritic(critiqueOrSummary) {
  const summary = isSummary(critiqueOrSummary)
    ? critiqueOrSummary
    : summariseFromCritique(critiqueOrSummary);
  if (summary.invalid_count >= INVALID_RETRY_THRESHOLD) {
    return {
      retry: true,
      reason: 'invalid_evidence_threshold',
      invalidCount: summary.invalid_count,
    };
  }
  return {
    retry: false,
    reason: 'below_threshold',
    invalidCount: summary.invalid_count,
  };
}

// ── Step 5: warning prose for the next round's context ──────────────────────
// Emitted into additionalContext so the critic sees, in plain language, which
// of its previous citations didn't land — and has a chance to self-correct
// instead of getting globally retried.
export function formatInvalidWarning(critiqueOrSummary) {
  const summary = isSummary(critiqueOrSummary)
    ? critiqueOrSummary
    : summariseFromCritique(critiqueOrSummary);
  if (summary.invalid_count === 0) return '';
  const bullets = summary.invalid
    .map((x) => `  - fix #${x.fixIndex + 1}: selector \`${x.selector}\` matched nothing in the captured DOM`)
    .join('\n');
  return [
    'EVIDENCE VALIDATION WARNING (carry-over from previous round):',
    bullets,
    'Verify every selector against the DOM snapshot before citing it. Two or more invalid citations in a round trigger a full critique retry with an alternate model.',
  ].join('\n');
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function isSummary(x) {
  return x && typeof x === 'object' && Number.isInteger(x.invalid_count);
}

function summariseFromCritique(critique) {
  if (!critique || !Array.isArray(critique.top_3_fixes)) return emptySummary();
  const invalid = [];
  const verified = [];
  const unverified = [];
  critique.top_3_fixes.forEach((fix, i) => {
    if (!fix || !fix.evidence || fix.evidence.type !== 'selector') return;
    if (fix.evidence_invalid === true) invalid.push({ fixIndex: i, selector: fix.evidence.value });
    else verified.push({ fixIndex: i, selector: fix.evidence.value });
  });
  return {
    invalid_count: invalid.length,
    verified_count: verified.length,
    unverified_count: unverified.length,
    invalid,
    unverified,
    verified,
  };
}

function emptySummary() {
  return {
    invalid_count: 0,
    verified_count: 0,
    unverified_count: 0,
    invalid: [],
    unverified: [],
    verified: [],
  };
}

// ── Browser-side helper ─────────────────────────────────────────────────────
// The caller runs `validateSelectorsInBrowser` via
// mcp__playwright__browser_evaluate. It returns, in order, each selector's
// match count. Exported as a real function (testable in jsdom / mock DOM)
// AND serialised to a string for the MCP call — both forms stay in sync via
// `.toString()`.
export function validateSelectorsInBrowser(selectors) {
  return selectors.map((sel) => {
    try {
      const n = document.querySelectorAll(sel).length;
      return { selector: sel, matched: n >= 1, count: n };
    } catch (err) {
      return { selector: sel, matched: false, count: 0, error: String(err && err.message || err) };
    }
  });
}

// Serialised form for MCP `browser_evaluate` — the caller passes this string
// as the `function` argument. Single source of truth is the function above;
// the string is always derived from it.
export const BROWSER_EVAL_VALIDATION_FN = validateSelectorsInBrowser.toString();
