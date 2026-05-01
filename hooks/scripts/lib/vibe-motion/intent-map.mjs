// Vibe-motion intent map — Sprint 13.
// Deterministic NL → motion-token adjustments. Pure data + small lookup;
// no LLM call needed for the basic vibe vocabulary.

const VIBES = [
  {
    id: 'energetic',
    keywords: ['mer energiskt', 'energiskt', 'energetic', 'more energetic', 'punchier'],
    adjustments: [
      { token: 'bounce', op: 'add', value: 0.2 },
      { token: 'duration', op: 'multiply', value: 0.8 },
    ],
    rationale: 'higher bounce + shorter duration = more snap',
  },
  {
    id: 'softer',
    keywords: ['mjukare', 'softer', 'gentler', 'calmer-flow'],
    adjustments: [
      { token: 'bounce', op: 'add', value: -0.2 },
      { token: 'easing_profile', op: 'set', value: 'ease-out-heavy' },
    ],
    rationale: 'reduce overshoot, ease-out-heavy curve',
  },
  {
    id: 'faster',
    keywords: ['snabbare', 'faster', 'quicker'],
    adjustments: [
      { token: 'duration', op: 'multiply', value: 0.7, min: 100 },
    ],
    rationale: 'shorter durations, floor at 100ms to avoid sub-perceptual',
  },
  {
    id: 'slower',
    keywords: ['långsammare', 'slower'],
    adjustments: [
      { token: 'duration', op: 'multiply', value: 1.4, max: 800 },
    ],
    rationale: 'longer durations, ceiling at 800ms',
  },
  {
    id: 'bouncier',
    keywords: ['mer studsigt', 'studsigt', 'bouncier'],
    adjustments: [
      { token: 'bounce', op: 'add', value: 0.3 },
    ],
    rationale: 'more bounce',
  },
  {
    id: 'calmer',
    keywords: ['lugnare', 'calmer'],
    adjustments: [
      { token: 'easing_profile', op: 'set', value: 'linear-multi-stop' },
      { token: 'bounce', op: 'set', value: 0 },
    ],
    rationale: 'replace springs with linear multi-stop, no overshoot',
  },
  {
    id: 'kinetic',
    keywords: ['kinetiskt', 'kinetic', 'mer-kinetiskt'],
    adjustments: [
      { token: 'aars', op: 'enable' },
      { token: 'stagger_ms', op: 'set', value: 80 },
    ],
    rationale: 'enable AARS pattern + stagger children',
  },
  {
    id: 'minimal',
    keywords: ['minimalistiskt', 'minimal', 'minimalt'],
    adjustments: [
      { token: 'bounce', op: 'set', value: 0 },
      { token: 'duration', op: 'multiply', value: 0.8 },
    ],
    rationale: 'remove bounce, slightly shorter durations',
  },
  {
    id: 'cinematic',
    keywords: ['filmiskt', 'cinematic', 'cinema-grade'],
    adjustments: [
      { token: 'easing_profile', op: 'set', value: 'linear-6-stops' },
      { token: 'easeout_heavy', op: 'enable' },
    ],
    rationale: 'linear() with 6 stops + ease-out-heavy distribution',
  },
  {
    id: 'snappy',
    keywords: ['respons-snäppt', 'snappt', 'snappy'],
    adjustments: [
      { token: 'duration', op: 'set-max', value: 150 },
      { token: 'bounce', op: 'set', value: 0 },
    ],
    rationale: 'duration cap 150ms, no overshoot',
  },
  {
    id: 'layered',
    keywords: ['mer lager', 'layered', 'more-layered'],
    adjustments: [
      { token: 'stagger_ms', op: 'add', value: 75 },
    ],
    rationale: 'increase stagger by ~75ms per layer',
  },
  {
    id: 'less-dramatic',
    keywords: ['mindre dramatiskt', 'less dramatic'],
    adjustments: [
      { token: 'bounce', op: 'multiply', value: 0.5 },
      { token: 'duration', op: 'multiply', value: 0.9 },
    ],
    rationale: 'half the overshoot, slightly snappier',
  },
];

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length || !b.length) return Math.max(a.length, b.length);
  const m = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) m[i][j] = m[i - 1][j - 1];
      else m[i][j] = Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
    }
  }
  return m[b.length][a.length];
}

export function resolveVibe(intent) {
  if (!intent || typeof intent !== 'string') return { error: 'empty-intent' };
  const normalized = intent.toLowerCase().trim();

  // Exact keyword match
  for (const vibe of VIBES) {
    for (const kw of vibe.keywords) {
      if (normalized === kw.toLowerCase()) {
        return { vibe, match: 'exact', keyword: kw };
      }
    }
  }

  // Substring match
  for (const vibe of VIBES) {
    for (const kw of vibe.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        return { vibe, match: 'substring', keyword: kw };
      }
    }
  }

  // Fuzzy fallback
  let best = null;
  for (const vibe of VIBES) {
    for (const kw of vibe.keywords) {
      const dist = levenshtein(normalized, kw.toLowerCase());
      const ratio = dist / Math.max(normalized.length, kw.length);
      if (ratio < 0.4 && (!best || dist < best.dist)) {
        best = { vibe, dist, ratio, keyword: kw };
      }
    }
  }
  if (best) return { vibe: best.vibe, match: 'fuzzy', keyword: best.keyword, distance: best.dist };

  // Suggest closest 3
  const candidates = [];
  for (const vibe of VIBES) {
    for (const kw of vibe.keywords) {
      candidates.push({ keyword: kw, vibeId: vibe.id, dist: levenshtein(normalized, kw.toLowerCase()) });
    }
  }
  candidates.sort((a, b) => a.dist - b.dist);
  return {
    error: 'unknown-intent',
    suggestions: candidates.slice(0, 3),
  };
}

export const ALL_VIBES = VIBES;
