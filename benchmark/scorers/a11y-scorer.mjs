// Accessibility scorer — source-level heuristic (the full runner would also
// call Playwright + axe-core; this offline scorer only reads code).
//
// Score 1-5 per the rubric in benchmark/rubric/rubric.md.

export async function scoreA11y(source, files) {
  const src = source || '';
  let score = 5;

  // Focus — :focus-visible presence
  if (!/:focus-visible\b/.test(src)) score -= 1.5;

  // Reduced-motion gate
  if (/(transition:|animation:|\@keyframes)/.test(src) &&
      !/@media\s*\(prefers-reduced-motion/.test(src)) {
    score -= 1.5;
  }

  // Semantic HTML — penalize role=button/div-click constructions
  if (/<(div|span)[^>]*role=["'](button|link|navigation)["']/.test(src)) {
    score -= 1;
  }

  // ARIA — minimum expectation: if aria-* is zero and there's interactive
  // markup, subtract
  const hasInteractive = /<(button|a\b|input|select|textarea)/.test(src);
  const hasAria = /\baria-[a-z]+=/.test(src);
  if (hasInteractive && !hasAria) score -= 0.5;

  // Logical properties — bonus for using them, penalty for pure left/right
  const hasPhysical = /\b(margin-left|margin-right|padding-left|padding-right|border-left|border-right|left:|right:)\s*[:-]/.test(src);
  const hasLogical = /\b(margin-inline|padding-inline|border-inline|inset-inline)/.test(src);
  if (hasPhysical && !hasLogical) score -= 0.5;

  // Touch target — rough heuristic: penalize if all buttons appear small
  const smallBtn = /\b(min-height:\s*(16|20|24)|h-(4|5|6))\b/.test(src);
  if (smallBtn) score -= 0.5;

  // Locale — html lang / font-subset signals; off-topic for component-level
  // output but useful for full-page prompts
  const isPage = /<html/i.test(src) || /<body/i.test(src);
  if (isPage && !/<html[^>]*\blang=/i.test(src)) score -= 0.5;

  return Math.max(1, Math.min(5, Math.round(score * 2) / 2));
}
