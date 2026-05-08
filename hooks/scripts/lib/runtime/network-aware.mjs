// network-aware.mjs — Sprint 23 Task 42.2
// Network-aware visual-budget: 3 tiers (full / degraded / minimal).
// Outputs token-pipeline post-processor that produces 3 CSS-variants and a
// runtime detection snippet that toggles a class on <html>.
//
// Stilens "själ" bevaras (palette + typografi), dekor offras vid 2g/saveData.

export const BUDGET_TIERS = {
  full:     { motion: 'all',      gradients: 'all',            blur: 'all',             images: 'high' },
  degraded: { motion: 'reduced',  gradients: 'flat-fallback',  blur: 'border-fallback', images: 'medium' },
  minimal: { motion: 'off',      gradients: 'flat-only',      blur: 'border-only',     images: 'low' },
};

const TIER_NAMES = ['full', 'degraded', 'minimal'];

/**
 * generateBudgetCss({ baseTokens, budget }) → CSS string
 *
 * Emits a CSS block scoped to the matching root class (`.vis-network-<tier>`).
 * The minimal tier also emits a `prefers-reduced-data` media-query block so
 * Chromium browsers honour it before our JS runs (FOUC mitigation).
 *
 * @param {object} args
 * @param {object} [args.baseTokens] — DTCG-token-shaped object; `solid_fallback` and
 *   `low_res_url` keys are read when present.
 * @param {'full'|'degraded'|'minimal'} [args.budget='full']
 * @returns {string} CSS source
 */
export function generateBudgetCss({ baseTokens = {}, budget = 'full' } = {}) {
  const config = BUDGET_TIERS[budget];
  if (!config) throw new Error(`generateBudgetCss: unknown budget tier "${budget}"`);

  const tierClass = `.vis-network-${budget}`;
  const solidFallback = baseTokens.solid_fallback || baseTokens.solidFallback || '#f5f5f5';
  const lowResUrl = baseTokens.low_res_url || baseTokens.lowResUrl || '';
  const blocks = [];

  // Header comment so produced CSS is self-documenting. The selector reference
  // ensures every tier (including `full`) is greppable in concatenated output.
  blocks.push(`/* network-aware tier: ${budget} — selector ${tierClass} */`);

  // Motion handling.
  if (config.motion === 'off') {
    blocks.push(`${tierClass} *, ${tierClass} *::before, ${tierClass} *::after {
  animation: none !important;
  transition: none !important;
}`);
    // Honour the standardised media-query too — Chromium 85+, Firefox 117+, Safari 17+.
    blocks.push(`@media (prefers-reduced-data: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
}`);
  } else if (config.motion === 'reduced') {
    blocks.push(`${tierClass} *, ${tierClass} *::before, ${tierClass} *::after {
  animation-duration: 200ms !important;
  transition-duration: 200ms !important;
}`);
    blocks.push(`@media (prefers-reduced-data: reduce) {
  *, *::before, *::after {
    animation-duration: 200ms !important;
    transition-duration: 200ms !important;
  }
}`);
  }
  // 'all' → no motion overrides.

  // Gradient handling.
  if (config.gradients === 'flat-only') {
    blocks.push(`${tierClass} .gradient,
${tierClass} [data-vis-gradient] {
  background: ${solidFallback} !important;
  background-image: none !important;
}`);
    blocks.push(`@media (prefers-reduced-data: reduce) {
  .gradient, [data-vis-gradient] {
    background: ${solidFallback} !important;
    background-image: none !important;
  }
}`);
  } else if (config.gradients === 'flat-fallback') {
    // Degraded: keep gradient but reduce stops to 2 — handled at generation by
    // emitting `--gradient-degraded` custom property.
    blocks.push(`${tierClass} .gradient,
${tierClass} [data-vis-gradient] {
  background-image: var(--gradient-degraded, linear-gradient(${solidFallback}, ${solidFallback})) !important;
}`);
  }

  // Blur handling.
  if (config.blur === 'border-only') {
    blocks.push(`${tierClass} .blur,
${tierClass} [data-vis-blur] {
  filter: none !important;
  backdrop-filter: none !important;
  border: 1px solid currentColor;
}`);
  } else if (config.blur === 'border-fallback') {
    blocks.push(`${tierClass} .blur,
${tierClass} [data-vis-blur] {
  filter: blur(min(4px, var(--blur-radius, 4px))) !important;
}`);
  }

  // Image handling — emits a data-attribute switch for srcset selection.
  if (config.images === 'low' && lowResUrl) {
    blocks.push(`${tierClass} img[data-vis-src-low] {
  content: url(${lowResUrl});
}`);
  }

  return blocks.join('\n\n');
}

/**
 * generateAllTierCss({ baseTokens }) — emits all 3 tiers concatenated.
 * Useful when SSR ships a single stylesheet and the runtime snippet just toggles
 * a root-class.
 *
 * @returns {string} concatenated CSS
 */
export function generateAllTierCss({ baseTokens = {} } = {}) {
  return TIER_NAMES.map((tier) => generateBudgetCss({ baseTokens, budget: tier })).join('\n\n');
}

/**
 * Browser-side runtime-detection-snippet.
 *
 * Toggles `vis-network-{tier}` on <html> based on:
 *  - `navigator.connection.saveData` (truthy → minimal)
 *  - `navigator.connection.effectiveType` ∈ {2g, slow-2g} → minimal
 *  - effectiveType === '3g' → degraded
 *  - else → full
 *
 * Listens for `change` events so the tier can downgrade mid-session.
 *
 * Safari fallback: when `navigator.connection` is undefined, we honour the
 * (less granular) `prefers-reduced-data` media-query at CSS level only — no JS class.
 */
export function generateNetworkRuntimeSnippet() {
  return `<script>
(function(){
  function pickTier() {
    var c = navigator.connection;
    if (!c) return 'full';
    if (c.saveData) return 'minimal';
    var et = c.effectiveType;
    if (et === '2g' || et === 'slow-2g') return 'minimal';
    if (et === '3g') return 'degraded';
    return 'full';
  }
  function applyTier() {
    var tier = pickTier();
    var html = document.documentElement;
    html.classList.remove('vis-network-full', 'vis-network-degraded', 'vis-network-minimal');
    html.classList.add('vis-network-' + tier);
    html.setAttribute('data-network-tier', tier);
  }
  applyTier();
  if (navigator.connection && navigator.connection.addEventListener) {
    navigator.connection.addEventListener('change', applyTier);
  }
})();
</script>`;
}

export const TIERS = TIER_NAMES;
