// hooks/scripts/lib/structural-checks/exposed-nav-bullets.mjs
export const ID = 'exposed-nav-bullets';

export function check(domSnapshot, viewport) {
  void viewport;
  if (!domSnapshot || !Array.isArray(domSnapshot.elements)) return [];
  const hits = [];
  for (const el of domSnapshot.elements) {
    if (el?.tagName !== 'ul') continue;
    if (typeof el.listStyleType !== 'string') continue;
    if (el.listStyleType === 'none' || el.listStyleType === '') continue;
    if (!Number.isFinite(el.childCount) || el.childCount <= 1) continue;
    if (!Number.isFinite(el.anchorDescendantCount) || el.anchorDescendantCount <= 0) continue;
    hits.push({
      check_id: ID,
      selector: el.selector,
      observed: {
        list_style_type: el.listStyleType,
        child_count: el.childCount,
        anchor_descendant_count: el.anchorDescendantCount,
      },
      message: `<ul> exposes ${el.listStyleType} bullets with ${el.anchorDescendantCount} link children — collapsed navigation`,
    });
  }
  return hits;
}
