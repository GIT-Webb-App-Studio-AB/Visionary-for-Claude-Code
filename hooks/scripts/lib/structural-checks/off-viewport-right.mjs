// hooks/scripts/lib/structural-checks/off-viewport-right.mjs
export const ID = 'off-viewport-right';

const TOLERANCE_PX = 4;
const MIN_WIDTH    = 100;
const MIN_HEIGHT   = 20;

export function check(domSnapshot, viewport) {
  if (!domSnapshot || !Array.isArray(domSnapshot.elements)) return [];
  if (!viewport || !Number.isFinite(viewport.width)) return [];

  const limit = viewport.width + TOLERANCE_PX;
  const hits = [];
  for (const el of domSnapshot.elements) {
    const b = el?.bbox;
    if (!b || !Number.isFinite(b.x) || !Number.isFinite(b.width)) continue;
    if (b.width < MIN_WIDTH || b.height < MIN_HEIGHT) continue;
    const right = b.x + b.width;
    if (right <= limit) continue;
    hits.push({
      check_id: ID,
      selector: el.selector,
      observed: {
        right,
        viewport_width: viewport.width,
        overflow_px: Math.round(right - viewport.width),
      },
      message: `<${el.tagName}> overflows viewport by ${Math.round(right - viewport.width)}px`,
    });
  }
  return hits;
}
