// hooks/scripts/lib/structural-checks/footer-grid-collapse.mjs
import { countGridColumns } from './types.mjs';

export const ID = 'footer-grid-collapse';

const FOOTER_TAGS = new Set(['footer', 'aside']);
const MIN_ANCHORS = 6;
const DESKTOP_MIN = 1024;

export function check(domSnapshot, viewport) {
  if (!domSnapshot || !Array.isArray(domSnapshot.elements)) return [];
  if (!viewport || !Number.isFinite(viewport.width) || viewport.width < DESKTOP_MIN) return [];

  const hits = [];
  for (const el of domSnapshot.elements) {
    if (!FOOTER_TAGS.has(el?.tagName)) continue;
    const anchors = Number.isFinite(el.anchorDescendantCount) ? el.anchorDescendantCount : 0;
    if (anchors < MIN_ANCHORS) continue;
    const display = typeof el.display === 'string' ? el.display : '';
    const gtc = typeof el.gridTemplateColumns === 'string' ? el.gridTemplateColumns : 'none';

    let collapsed = false;
    if (display !== 'grid' && display !== 'flex') {
      collapsed = true;
    } else if (display === 'grid' && countGridColumns(gtc) <= 1) {
      collapsed = true;
    }

    if (!collapsed) continue;

    hits.push({
      check_id: ID,
      selector: el.selector,
      observed: {
        display,
        grid_template_columns: gtc,
        anchor_count: anchors,
        viewport_width: viewport.width,
      },
      message: `<${el.tagName}> with ${anchors} links collapses to single column on desktop (display: ${display || 'unknown'})`,
    });
  }
  return hits;
}
