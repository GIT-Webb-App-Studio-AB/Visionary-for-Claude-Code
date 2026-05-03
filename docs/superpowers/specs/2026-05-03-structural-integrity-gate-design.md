# Structural-Integrity Gate — Design Spec

**Date:** 2026-05-03
**Status:** Draft → ready for implementation plan
**Owner:** screamm
**Related:** `slop-gate.mjs` (Sprint 8), `numeric-aesthetic-scorer.mjs` (Sprint 3), `visual-critic.md` (Sprint 2+)

---

## Problem

Visionary's critique loop currently catches **stylistic slop** (gradient/font/colour patterns) and **numeric composition** (entropy, rhythm, gestalt), but not **structural defects** in the rendered DOM. Three observed failure modes from a recent generation pair (Atelier Nord + Studio/Hår salon mockups) demonstrate the gap:

1. **Duplicate heading** — `"Tjänster & takt"` rendered twice on the same page (philosophy section + price-list section).
2. **Footer-grid collapse** — footer navigation rendered as a vertical stack with default `<ul>` disc-bullets exposed instead of the intended multi-column grid.
3. **Stock-photo mismatch** — a "GOD is GOOD" barbershop image reused in both an Östermalm luxury atelier and a feminine neon-pixie salon, contradicting the brief.

None of these are caught by today's slop-gate (source-only, fires before render) or numeric-scorer (gradient 0..1 sub-scores; a collapsed grid paradoxically scores *high* on `gestalt_grouping` due to perfect column alignment). They reach the LLM-critic as the only line of defence, where they are routinely missed because they're framed as subjective brief-conformance issues rather than mechanical defects.

## Goal

Catch structural defects **before** the LLM-critic runs, with a hybrid policy:

- **Hard-fail (auto-regen)** for binarily measurable defects with no plausible creative defence.
- **Warning (blocker-severity injection into critic context)** for gradient signals where a creative interpretation might apply.

Calibrated to favour recall over precision for hard-fails — one extra regen round is cheaper than shipping a broken footer.

## Non-goals

- Not a replacement for the LLM-critic; defects flagged here still appear in `top_3_fixes` if not auto-regenerated.
- Not a calibration system — initial thresholds are heuristic, tuned over time via trace data.
- Not an image-brand-alignment pipeline — that ships as a separate sprint with its own embedding infrastructure.
- Not a substitute for accessibility checks — axe-core continues to own a11y violations.

## Architecture

### Pipeline position

```
Source-scan (deterministic 19 patterns)
  ↓
slop-gate (source-only, pre-render)
  ↓ passed
Playwright capture: screenshot + DOM-snapshot + axe-core
  ↓
[NEW] structural-gate
  ├─ hard_fails.length > 0 → emit regen-directive, terminate round
  └─ warnings → injected into critic-context as STRUCTURAL_WARNINGS block
  ↓ passed
numeric-aesthetic-scorer
  ↓
LLM visual-critic (with warnings in context)
```

The gate runs after Playwright capture (we need DOM + computed style) and before the numeric scorer (so we don't pay scorer cost on a soon-to-be-rejected output).

### Module layout

```
hooks/scripts/lib/
  structural-gate.mjs                 ← public API: evaluate()
  structural-checks/
    duplicate-heading.mjs              ← check 1
    exposed-nav-bullets.mjs            ← check 2
    off-viewport-right.mjs             ← check 3
    footer-grid-collapse.mjs           ← check 4
    empty-section.mjs                  ← check 5
    heading-hierarchy-skip.mjs         ← check 6
    mystery-text-node.mjs              ← warning
    types.mjs                          ← shared types & helpers
  __tests__/
    structural-gate.test.mjs
    structural-checks/
      duplicate-heading.test.mjs
      exposed-nav-bullets.test.mjs
      off-viewport-right.test.mjs
      footer-grid-collapse.test.mjs
      empty-section.test.mjs
      heading-hierarchy-skip.test.mjs
      mystery-text-node.test.mjs
    fixtures/
      atelier-nord-footer.json         ← ground truth: hard-fail check 4
      atelier-nord-philosophy.json     ← ground truth: hard-fail check 1
      studio-har-clean.json            ← ground truth: pass
```

### Public API

```js
// structural-gate.mjs
export function evaluate(domSnapshot, viewport, opts = {}) {
  // domSnapshot: { elements: [{ selector, bbox, style, text?, tagName, listStyleType?, listItemCount?, anchorChildCount?, parentTag?, ... }] }
  //   The browser_evaluate payload in capture-and-critique.mjs is extended to include
  //   the optional fields above — see "DOM-snapshot extension" below.
  // viewport: { width, height }  — usually { width: 1200, height: 800 } from desktop screenshot
  // opts.styleWhitelist: { hard_fail_skips: Set<string>, warning_skips: Set<string> }
  //   Loaded by capture-and-critique.mjs from active style frontmatter `allows_structural`.
  // opts.styleId: string|null  — for trace events
  //
  // Returns:
  // {
  //   hard_fails: Array<{ check_id: string, selector: string, observed: any, message: string }>,
  //   warnings: Array<{ check_id: string, selector: string, observed: any, message: string }>,
  //   skipped: Array<{ check_id: string, reason: 'whitelisted'|'insufficient-data' }>,
  // }
}

export const HARD_FAIL_CHECKS = Object.freeze([
  'duplicate-heading',
  'exposed-nav-bullets',
  'off-viewport-right',
  'footer-grid-collapse',
  'empty-section',
  'heading-hierarchy-skip',
]);

export const WARNING_CHECKS = Object.freeze([
  'mystery-text-node',
]);
```

Each individual check exports a pure function with the same signature:

```js
// structural-checks/duplicate-heading.mjs
export function check(domSnapshot, viewport) {
  // returns Array<{ selector, observed, message }>  (empty array = pass)
}
export const ID = 'duplicate-heading';
```

The dispatcher in `structural-gate.mjs` is responsible for whitelist filtering and partitioning into `hard_fails` vs `warnings` based on `HARD_FAIL_CHECKS` / `WARNING_CHECKS` membership.

### DOM-snapshot extension

`capture-and-critique.mjs` step 5 currently captures `{ selector, bbox, style: { fontSize, lineHeight, letterSpacing, color, backgroundColor } }`. We extend the `browser_evaluate` payload to include extra fields needed by the new checks:

```js
// added fields (computed once per element)
{
  tagName: el.tagName.toLowerCase(),
  text: el.textContent?.trim().slice(0, 200) ?? null,
  parentTag: el.parentElement?.tagName.toLowerCase() ?? null,
  // for <ul>/<ol> only:
  listStyleType: tagName==='ul'||tagName==='ol' ? s.listStyleType : null,
  childCount: el.children.length,
  anchorDescendantCount: el.querySelectorAll('a').length,
  // for footer/aside/section only:
  display: ['footer','aside','section','nav'].includes(tagName) ? s.display : null,
  gridTemplateColumns: ['footer','aside','section','nav'].includes(tagName) ? s.gridTemplateColumns : null,
}
```

Snapshot size: today ≈400 elements × ~6 style fields. Extension adds ≈4 fields per element, total payload growth ≈30%. Still well under the LLM context cap.

### Integration into `capture-and-critique.mjs`

Insertion point: between the existing DOM-snapshot write (step 5) and the numeric-scorer call (step 7). Roughly 30 new lines:

```js
// after step 5 (DOM snapshot persisted to domSnapshotPath)
const structuralResult = evaluateStructural(
  JSON.parse(readFileSync(domSnapshotPath, 'utf8')),
  { width: 1200, height: 800 },
  { styleWhitelist: activeWhitelist.structural ?? { hard_fail_skips: new Set(), warning_skips: new Set() }, styleId: activeWhitelist.styleId },
);

if (structuralResult.hard_fails.length > 0) {
  // Trace event
  trace.sync('structural_blocked', {
    blocking_checks: structuralResult.hard_fails.map(f => f.check_id),
    blocking_count: structuralResult.hard_fails.length,
    skipped_count: structuralResult.skipped.length,
    style_id: activeWhitelist.styleId,
  }, { projectRoot: cwd, generationId: fileHash, round, emitter: 'structural-gate' });

  // Emit regen-directive (mirrors slop-gate pattern)
  const directiveBlock = buildStructuralDirectiveBlock(structuralResult.hard_fails);
  emit({ additionalContext: buildStructuralRejectContext({ ... }).slice(0, CONTEXT_CAP) });
}

// Otherwise: stash warnings for the critic-context block, continue to numeric-scorer.
const structuralWarningsBlock = structuralResult.warnings.length > 0
  ? buildStructuralWarningsBlock(structuralResult.warnings)
  : '';
// ... include structuralWarningsBlock alongside the existing slop / motion blocks
//     in the additionalContext that goes to the visual-critic.
```

The `buildStructuralDirectiveBlock` and `buildStructuralWarningsBlock` helpers live in `structural-gate.mjs`.

## Hard-fail checks (specifications)

For each check below: trigger conditions are exact; tests are written before implementation; false-positive examples documented.

### Check 1 — duplicate-heading

**Trigger:** Two or more visible headings (h1/h2/h3) with identical normalised text.

**Algorithm:**
1. Filter `domSnapshot.elements` to `tagName ∈ {h1, h2, h3}` AND `bbox.width > 0 && bbox.height > 0`.
2. Normalise each element's `text`: trim, collapse internal whitespace to single space, lowercase, strip Unicode-aware punctuation (`/[\p{P}]/gu`).
3. Group by normalised text. Any group with `length ≥ 2` → hard-fail.

**Output:** one `hard_fail` entry per duplicated text (not per duplicate element). `selector` is the first occurrence's selector; `observed` is `{ text: "...", count: N, all_selectors: [...] }`.

**False-positive guards:**
- Empty text after normalisation → skip.
- Identical headings inside `<dialog>`, `<template>`, or `[hidden]` ancestors → skip via `bbox` check (already handled).
- Headings inside repeated component slots (e.g. carousel cards) — the snapshot only captures rendered DOM, so duplicates here are real duplicates from the user's perspective.

### Check 2 — exposed-nav-bullets

**Trigger:** A `<ul>` whose default disc-bullets are visible AND which carries navigation-like content (link children).

**Algorithm:**
1. For each element where `tagName === 'ul'`:
   - `listStyleType !== 'none'` AND
   - `childCount > 1` AND
   - `anchorDescendantCount > 0`
2. → hard-fail.

**Output:** one entry per offending `<ul>`. `observed` is `{ list_style_type, child_count, anchor_descendant_count }`.

**False-positive guards:**
- A `<ul>` with bullets that is *intentionally* a punktlista (no anchors, just text) is not flagged — the anchor-descendant requirement isolates collapsed navigation from genuine bullet lists.
- Stylistic intent ("brutalism wants visible bullets") is handled via the `allows_structural` style frontmatter.

### Check 3 — off-viewport-right

**Trigger:** Any element with non-trivial dimensions extends past the right edge of the viewport.

**Algorithm:**
1. For each element: `bbox.right = bbox.x + bbox.width`.
2. Hard-fail when `bbox.right > viewport.width + 4` AND `bbox.width > 100` AND `bbox.height > 20`.

**Output:** one entry per offending element. `observed` is `{ right: N, viewport_width: V, overflow_px: N - V }`.

**False-positive guards:**
- 4px tolerance absorbs subpixel rounding from `getBoundingClientRect`.
- Min-size requirement (100×20) avoids tiny decorative elements that are intentionally clipped (e.g. a decorative line bleeding off-canvas).
- We capture only the desktop screenshot at 1200×800 — mobile/tablet shots are evaluated separately if present (out of scope for v1; defer to follow-up).

### Check 4 — footer-grid-collapse

**Trigger:** A footer/aside element with substantial navigation content fails to render in a multi-column layout on desktop.

**Algorithm:**
1. For each element where `tagName ∈ {footer, aside}` OR (`tagName === 'section'` AND has `[role="contentinfo"]` or class matches `/footer/i`):
   - `anchorDescendantCount >= 6` AND
   - viewport.width >= 1024 AND
   - One of:
     - `display !== 'grid'` AND `display !== 'flex'`
     - `display === 'grid'` AND (`gridTemplateColumns === 'none'` OR resolved column count is 1)
     - `display === 'flex'` AND `flexDirection === 'column'` AND no children with `flex` → effectively single-column
2. → hard-fail.

**Output:** `observed` is `{ display, grid_template_columns, anchor_count, viewport_width }`.

**False-positive guards:**
- Mobile-first single-column footer at desktop viewport is uncommon — the 6-anchor threshold filters out minimal footers (e.g. just `Privacy / Terms / Contact`).
- Genuine intentional single-column footers (minimal-typography styles) → `allows_structural`.
- Column-count detection: when `display === 'grid'`, parse `gridTemplateColumns` for a count of fr/px/auto tokens. `'1fr'` (single token) counts as 1; `'repeat(4, 1fr)'` counts as 4.

### Check 5 — empty-section

**Trigger:** Two or more headings on the page have no following content node within their block-container.

**Algorithm:**
1. For each `h1/h2/h3`: locate the *immediate next element sibling* in the DOM tree (skipping whitespace-only text nodes).
2. The heading is "empty" if the next element sibling either does not exist, OR has no text content AND no `<img>`/`<svg>` descendant AND is not itself a heading/list/table/figure/blockquote/picture/video.
3. Count empty headings on the page. Threshold ≥ 2 → hard-fail. Count = 1 produces no entry (treated as intentional whitespace).

**Output:** one entry summarising the count, with `observed.empty_headings: [{ selector, text }, ...]`.

**False-positive guards:**
- Single empty heading → no entry (the ≥2 threshold isolates layout collapse from intentional whitespace patterns).
- "Next element sibling" walks across whitespace-only text nodes; non-heading siblings that exist with empty text still count as "empty".

### Check 6 — heading-hierarchy-skip

**Trigger:** Page contains an `h(N+2)` without a preceding `h(N+1)` in document order.

**Algorithm:**
1. Walk DOM in document order, collecting each visible heading's level.
2. Set `lastSeenLevel` to the level of the *first* heading encountered (the implicit baseline). This avoids false-positives for components that render mid-page without an h1.
3. For each subsequent heading: if `currentLevel > lastSeenLevel + 1` → hard-fail entry.
4. Update `lastSeenLevel = currentLevel`. Reset to a new baseline only on encountering a fresh h1 (multi-section pages with multiple h1s start independent hierarchies).

**Output:** one entry per skip, with `observed: { from_level, to_level, selector_at_skip }`.

**False-positive guards:**
- Hierarchy resets on each h1, so multi-section pages with multiple h1s are handled.
- Component-style renders that begin at h2 are not flagged for the *first* heading; only genuine downstream skips (e.g. h2 → h4) trigger.

## Warning checks

### Mystery text-node

**Trigger:** A single-word block-element with no surrounding context (orphan label).

**Algorithm:**
1. For each `block`-displayed element with `text.split(/\s+/).length === 1` AND text length ≤ 12 characters:
   - Skip if inside `<label>`, `<button>`, `<a>`, `<li>`, `<th>`, `<td>`, `<dt>`, `<dd>`, `<caption>`, or has class matching `/badge|chip|tag|pill|stat|metric/i`.
   - Skip if has visible heading sibling within container.
   - → warning.

This is the failure mode behind "Atelier" / "Sociala" appearing as orphaned rows in the Atelier Nord footer. Warnings only — single-word block elements have legitimate uses (e.g. brutalist accent labels), so we surface to the LLM-critic rather than auto-rejecting.

### Image-brand-mismatch (placeholder)

Reserved as a `WARNING_CHECKS` entry but not implemented in this spec. Requires:
- Brief→image embedding pipeline (does not exist; current `dinov2-embed.mjs` matches against accepted-examples, not arbitrary briefs)
- Calibrated distance threshold against gold set
- Async embedding compute fits inside the gate's latency budget

Tracked as follow-up sprint.

## Style frontmatter opt-out

Existing styles already support `allows_slop` in frontmatter (consumed by `loadActiveStyleWhitelist`). Extend with `allows_structural`:

```yaml
---
id: brutalist-tabloid
name: Brutalist Tabloid
allows_slop:
  - "Inter as sole typeface detected"  # existing
allows_structural:
  - exposed-nav-bullets   # default disc-bullets are intentional in this style
  - footer-grid-collapse  # mobile-first single-column footer is a feature
---
```

**Loader semantics:** `loadActiveStyleWhitelist` returns `{ patterns: Set<string>, structural: { hard_fail_skips: Set<string>, warning_skips: Set<string> }, styleId, reason }`. Backwards-compatible: when frontmatter lacks `allows_structural`, both skip sets are empty.

**Whitelist effect:**
- `hard_fail_skips` containing a check_id → that check's results move from `hard_fails` to `skipped`.
- `warning_skips` containing a check_id → that check's results move from `warnings` to `skipped`.
- A whitelisted hard-fail does NOT become a warning — opt-out means full opt-out for that style.

**Audit:** `structural_blocked` trace events include `style_id` so we can later detect which styles are abusing the whitelist.

## Loop budget

`MAX_ROUNDS = 3` unchanged. If a hard-fail triggers three rounds in a row, the round counter resets and the hook stays silent (mirrors today's slop-gate behaviour at the loop ceiling — the user gets the partially-broken output to review manually rather than an infinite spin).

## Observability

Trace events emitted via existing `trace.sync(...)`:

- `structural_blocked` — fired when `hard_fails.length > 0`. Payload:
  ```json
  {
    "blocking_checks": ["duplicate-heading", "footer-grid-collapse"],
    "blocking_count": 2,
    "skipped_count": 0,
    "style_id": "brutalist-tabloid"
  }
  ```
- `structural_warning` — fired once per round summarising warnings emitted. Payload:
  ```json
  {
    "warning_checks": ["mystery-text-node"],
    "warning_count": 3,
    "style_id": "atelier-nord"
  }
  ```
- `structural_whitelisted` — fired when `skipped.length > 0`, similar to existing `slop_whitelisted`.

These feed `visionary-stats.mjs` for per-style failure-mode reports.

## Testing strategy

### Unit tests
One test file per check module. For each check:
- **Pass case:** clean DOM where the check should not trigger.
- **Hard-fail case:** the exact pattern from the observed Atelier Nord/Studio/Hår fixtures.
- **Edge cases:** false-positive guards from the spec (empty text, mobile viewport, intentional bullets, etc.).
- **Whitelist behaviour:** check_id in `hard_fail_skips` → result moves to `skipped`.

### Fixture DOM-snapshots
Three fixtures derived from the observed failure cases:
- `atelier-nord-footer.json` — ground truth: `footer-grid-collapse` + `mystery-text-node`. ≥6 anchors in footer, `display: block`, "Atelier" / "Sociala" as single-word orphans.
- `atelier-nord-philosophy.json` — ground truth: `duplicate-heading`. Two h2 with text `"Tjänster & takt"`.
- `studio-har-clean.json` — ground truth: pass. All checks return empty arrays.

Fixtures are real `browser_evaluate` payloads captured manually from the existing component code, not hand-crafted, to ensure they exercise the real DOM-snapshot shape.

### Integration test
`structural-gate.test.mjs` drives the full evaluator across all three fixtures and verifies:
- Atelier Nord-footer fixture: `hard_fails` contains `footer-grid-collapse`, `warnings` contains `mystery-text-node` ×2.
- Atelier Nord-philosophy fixture: `hard_fails` contains `duplicate-heading`.
- Studio/Hår-clean fixture: empty `hard_fails`, empty `warnings`.

### Hook integration test
Mock `capture-and-critique.mjs` invocation with each fixture as the DOM-snapshot file; verify `additionalContext` contains the regen-directive block on hard-fail and warning-block on warnings.

## Rollout

1. Land behind a default-on flag `VISIONARY_ENABLE_STRUCTURAL_GATE` (default `1`) so users can opt out for noisy CI runs.
2. Trace data accumulates in `.visionary-cache/traces/` for ≥1 week.
3. Review trace events for false-positive rate per check; tune thresholds.
4. Once stable, remove the flag.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| False-positive on intentional creative choice | Per-style `allows_structural` whitelist; conservative thresholds (≥2 empty sections, ≥6 footer anchors) |
| DOM-snapshot extension breaks existing scorers | Extension is additive — new fields, no renames; existing scorers ignore unknown keys |
| Hard-fail loops 3× and user gets broken output anyway | Same as today's slop-gate ceiling; trace event lets us detect abuse |
| Footer-grid-collapse flags legitimate mobile-first design | `viewport.width >= 1024` guard ensures we only fire on desktop screenshots |
| Structural gate runs on every Write, slowing critique loop | Gate is pure JS over already-captured DOM-snapshot, no extra Playwright calls — overhead < 50ms per round |

## Out of scope (deferred)

- Image-brand-alignment hard-fail (separate sprint; needs embedding infrastructure)
- Multi-viewport structural checks (mobile/tablet) — desktop only for v1
- Aspect-ratio violations on `<img>`/`<video>`
- z-index conflict detection
- Calibration of footer-grid threshold against a gold set

These ship in subsequent sprints if trace data shows recurring failures of the type.

## Acceptance criteria

- [ ] All six hard-fail checks implemented in separate modules under `lib/structural-checks/`.
- [ ] One warning check (`mystery-text-node`) implemented; `image-brand-mismatch` placeholder registered in `WARNING_CHECKS` but not implemented.
- [ ] Dispatcher in `structural-gate.mjs` partitions, applies whitelist, returns `{ hard_fails, warnings, skipped }`.
- [ ] Three fixture snapshots committed; each check has unit tests with pass + fail + edge cases.
- [ ] Integration test in `structural-gate.test.mjs` verifies all three observed failures are caught and a clean fixture passes.
- [ ] `capture-and-critique.mjs` integrated; emits `structural_blocked` trace events and regen-directive context on hard-fail.
- [ ] `loadActiveStyleWhitelist` extended with `allows_structural`, backwards-compatible with existing styles.
- [ ] DOM-snapshot extension in `capture-and-critique.mjs` step 5 captures the new fields.
- [ ] Feature flag `VISIONARY_ENABLE_STRUCTURAL_GATE` honoured; default on.
- [ ] All new code passes existing `__tests__` suite.
