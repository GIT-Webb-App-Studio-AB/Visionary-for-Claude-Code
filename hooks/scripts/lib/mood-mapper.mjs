// mood-mapper.mjs — Sprint 17 Task 33.5
// Maps mood input (numeric coordinates or text labels) to a style-cluster
// in the catalog using Russell's circumplex (valence × arousal in [0, 1]²).
//
// Quadrant mapping — each quadrant lists 6–8 representative catalog IDs
// (verified against skills/visionary/styles/_embeddings.json):
//
//   Q1: high-V / high-A = vibrant maximalist
//   Q2: low-V  / high-A = brutalist / glitch / raw
//   Q3: low-V  / low-A  = swiss / monochrome / calm-serious
//   Q4: high-V / low-A  = soft / glass / dreamy / warm
//
// Note: a few styles (frutiger-aero, dreamcore) live near a quadrant border
// and appear in two clusters. They get a boost when the input lies close
// to the border between those quadrants — handled implicitly because both
// clusters surface them as primary or secondary.
//
// Saturation / motion mapping (orthogonal to the quadrant choice):
//   - palette saturation hint   ≈ valence  (high V → vibrant, low V → muted)
//   - motion-tier hint          ≈ arousal  (high A → kinetic, low A → static)
//   - density is left to caller — orthogonal to mood, picked from quadrant default

const QUADRANT_STYLES = {
  Q1: ['memphis', 'vaporwave', 'post-internet-maximalism', 'y2k-futurism', 'latin-fiesta', 'witchcore-ui', 'frutiger-aero', 'dopamine-design'],
  Q2: ['brutalist-web', 'glitchcore', 'anxiety-urgency', 'neubrutalism', 'architectural-brutalism', 'cyberpunk-neon'],
  Q3: ['swiss-rationalism', 'swiss-muller-brockmann', 'liminal-space', 'default-computing-native', 'terminal-cli', 'monochrome', 'zen-void'],
  Q4: ['liquid-glass', 'dreamcore', 'cottagecore-tech', 'glassmorphism', 'soft-claymorphism' /* alias retained for forward compat */, 'neumorphism', 'frutiger-aero', 'light-mode-sanctuary'],
};

// Filter Q4 to only valid catalog IDs (drop forward-compat aliases at module load).
// soft-claymorphism is not yet in the catalog; remove it so consumers never
// see a phantom anchor. Keep the line above for documentation of intent.
QUADRANT_STYLES.Q4 = QUADRANT_STYLES.Q4.filter((id) => id !== 'soft-claymorphism');

const TEXT_MOOD_MAP = {
  // 16 primary mood text → (valence, arousal) coordinates in [0, 1]²
  'happy':              [0.85, 0.60],
  'happy-anxious':      [0.70, 0.85],
  'excited':            [0.80, 0.85],
  'energetic':          [0.60, 0.90],
  'calm':               [0.65, 0.20],
  'calm-positive':      [0.70, 0.25],
  'serene':             [0.70, 0.15],
  'peaceful':           [0.70, 0.18],
  'melancholic':        [0.30, 0.30],
  'calm-melancholic':   [0.30, 0.20],
  'sad':                [0.20, 0.35],
  'depressed':          [0.15, 0.20],
  'angry':              [0.20, 0.85],
  'tense':              [0.30, 0.80],
  'aggressive':         [0.25, 0.90],
  'anxious':            [0.35, 0.80],
  // Aliases / coarse axes
  'positive':           [0.80, 0.50],
  'negative':           [0.20, 0.50],
  'high-energy':        [0.50, 0.90],
  'low-energy':         [0.50, 0.15],
};

/**
 * Determine the Russell quadrant for a (valence, arousal) point.
 * Mid-axis (exactly 0.5) is treated as the "low" half so the function
 * is total — every input lands in exactly one quadrant.
 */
export function getQuadrant(valence, arousal) {
  const v = valence > 0.5 ? 'high' : 'low';
  const a = arousal > 0.5 ? 'high' : 'low';
  if (v === 'high' && a === 'high') return 'Q1';
  if (v === 'low'  && a === 'high') return 'Q2';
  if (v === 'low'  && a === 'low')  return 'Q3';
  return 'Q4';
}

/**
 * Map a mood input → quadrant + candidate style cluster.
 *
 * Accepted input shapes:
 *   - "0.8,0.2"           → numeric coords (valence,arousal)
 *   - "happy-anxious"     → text label looked up in TEXT_MOOD_MAP
 *   - { valence, arousal} → object form
 *
 * Returns either { error } or {
 *   valence, arousal,
 *   quadrant,
 *   primary_styles,    // canonical cluster for the quadrant
 *   secondary_styles,  // adjacent-quadrant pull when input is close to mid-axis
 *   motion_tier,       // 0..3, quantised from arousal
 *   saturation_hint,   // 0..1, equal to valence
 *   text_match         // the matched text key, if input was a text label
 * }
 */
export function mapMood(input) {
  let valence, arousal;
  let textMatch = null;

  if (typeof input === 'string' && input.includes(',')) {
    // Numeric form: "v,a"
    const parts = input.split(',').map((s) => parseFloat(s.trim()));
    const [v, a] = parts;
    if (parts.length !== 2 || Number.isNaN(v) || Number.isNaN(a)) {
      return { error: 'Invalid numeric format. Expected "valence,arousal" with numbers in [0, 1].' };
    }
    if (v < 0 || v > 1 || a < 0 || a > 1) {
      return { error: 'Coords must be in [0, 1].' };
    }
    valence = v;
    arousal = a;
  } else if (typeof input === 'string') {
    const key = input.trim().toLowerCase();
    const coords = TEXT_MOOD_MAP[key];
    if (!coords) {
      return {
        error: `Unknown mood text: "${key}". Supported: ${Object.keys(TEXT_MOOD_MAP).join(', ')}`,
      };
    }
    valence = coords[0];
    arousal = coords[1];
    textMatch = key;
  } else if (input && typeof input === 'object') {
    valence = input.valence;
    arousal = input.arousal;
    if (typeof valence !== 'number' || typeof arousal !== 'number') {
      return { error: 'valence and arousal must be numbers' };
    }
    if (valence < 0 || valence > 1 || arousal < 0 || arousal > 1) {
      return { error: 'Coords must be in [0, 1].' };
    }
  } else {
    return { error: 'Invalid mood input' };
  }

  const quadrant = getQuadrant(valence, arousal);
  const primary_styles = [...QUADRANT_STYLES[quadrant]];
  const secondary_styles = getAdjacentQuadrants(quadrant, valence, arousal);

  // Motion-tier quantisation — matches Static / Subtle / Expressive / Kinetic
  // bands so callers can hand the value straight to the resolver.
  const motion_tier =
    arousal < 0.16 ? 0 :
    arousal < 0.49 ? 1 :
    arousal < 0.83 ? 2 :
                     3;

  const saturation_hint = valence;

  return {
    valence,
    arousal,
    quadrant,
    primary_styles,
    secondary_styles,
    motion_tier,
    saturation_hint,
    text_match: textMatch,
  };
}

/**
 * Pull adjacent-quadrant styles in for centrist moods.
 *
 * The closer (valence, arousal) sits to the mid-point (0.5, 0.5), the more
 * the result blends into neighbouring quadrants. We pick the axis with the
 * smaller distance-from-midline and pull the opposite quadrant on that axis;
 * this gives a smooth interpolation across the circumplex without hard jumps.
 *
 * Heuristic (tuned for the 16-mood test fixture):
 *   - distFromMid ≥ 0.4  → no adjacent pull (deep in one quadrant)
 *   - distFromMid < 0.2  → pull both axes' opposites (centrist)
 *   - 0.2 ≤ distFromMid < 0.4 → pull only the closer axis
 */
function getAdjacentQuadrants(primary, valence, arousal) {
  const distFromMid = Math.sqrt(
    (valence - 0.5) ** 2 + (arousal - 0.5) ** 2,
  );

  if (distFromMid >= 0.4) return [];

  const adjacent = [];
  const vDist = Math.abs(valence - 0.5);
  const aDist = Math.abs(arousal - 0.5);

  // V-axis opposite (flip valence sign keeping arousal sign)
  const oppositeV = ({ Q1: 'Q2', Q2: 'Q1', Q3: 'Q4', Q4: 'Q3' })[primary];
  // A-axis opposite (flip arousal sign keeping valence sign)
  const oppositeA = ({ Q1: 'Q4', Q2: 'Q3', Q3: 'Q2', Q4: 'Q1' })[primary];

  if (distFromMid < 0.2) {
    // Centrist — pull both axes' opposites. Trim each to keep the secondary
    // list short; primary still dominates.
    adjacent.push(...QUADRANT_STYLES[oppositeV].slice(0, 2));
    adjacent.push(...QUADRANT_STYLES[oppositeA].slice(0, 2));
  } else if (vDist < aDist) {
    // Closer to V-axis (i.e. valence is the borderline coord) → pull V-opposite
    adjacent.push(...QUADRANT_STYLES[oppositeV].slice(0, 3));
  } else {
    // Closer to A-axis → pull A-opposite
    adjacent.push(...QUADRANT_STYLES[oppositeA].slice(0, 3));
  }

  // De-dup (some styles like frutiger-aero appear in multiple clusters)
  return Array.from(new Set(adjacent));
}

export { QUADRANT_STYLES, TEXT_MOOD_MAP };
