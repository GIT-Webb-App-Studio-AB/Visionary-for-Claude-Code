// clip-classifier.mjs — Sprint 18 Task 35.2
// Zero-shot mood classification via CLIP ViT-B/32 (transformers.js).
// Optional dep: @xenova/transformers (~150MB model). If missing, falls back to
// heuristic-only classification using palette temperature + saturation +
// edge-density signals so the rest of the pipeline keeps working.
//
// Public API:
//   classifyMood({ imageBuffer, fallbackPalette, fallbackSaturation, fallbackEdgeDensity })
//     -> { method: 'clip' | 'heuristic', top: [...3], all_scores: [...] }
//   getStatus() -> 'unloaded' | 'loaded' | 'unavailable'
//
// Style-tag references map to entries in skills/visionary/styles/_embeddings.json.

const VERBOSE = process.env.VISIONARY_PHOTO_VERBOSE === '1';

// 16 mood-prompts mapped to style tags. Indices align with classification output.
const MOOD_PROMPTS = [
  {
    id: 'calm-minimal',
    prompt: 'a calm, minimal, monochromatic interface with lots of whitespace',
    style_tags: ['swiss-rationalism', 'liminal-space', 'monochrome'],
  },
  {
    id: 'vibrant-maximalist',
    prompt: 'a vibrant, maximalist, colorful design',
    style_tags: ['memphis', 'vaporwave', 'post-internet-maximalism'],
  },
  {
    id: 'industrial-brutalist',
    prompt: 'an industrial, brutalist, raw concrete aesthetic',
    style_tags: ['brutalist-web', 'architectural-brutalism'],
  },
  {
    id: 'dreamy-soft',
    prompt: 'a dreamy, soft, ethereal interface',
    style_tags: ['dreamcore', 'cottagecore-tech', 'glassmorphism'],
  },
  {
    id: 'glitchy-distorted',
    prompt: 'a glitchy, distorted, digital aesthetic',
    style_tags: ['glitchcore', 'cyberpunk-neon'],
  },
  {
    id: 'editorial-intellectual',
    prompt: 'an editorial, serif, intellectual magazine spread',
    style_tags: ['editorial-serif-revival'],
  },
  {
    id: 'clinical-precise',
    prompt: 'a clinical, healthcare, precise interface',
    style_tags: ['fintech-trust', 'saas-b2b-dashboard'],
  },
  {
    id: 'playful-irreverent',
    prompt: 'a playful, irreverent, expressive design',
    style_tags: ['memphis', 'witchcore-ui'],
  },
  {
    id: 'retro-nostalgic',
    prompt: 'a retro, nostalgic, vintage aesthetic',
    style_tags: ['y2k-futurism', 'vaporwave', 'frutiger-aero'],
  },
  {
    id: 'futuristic-sci-fi',
    prompt: 'a futuristic, technological, sci-fi interface',
    style_tags: ['cyberpunk-neon', 'frutiger-aero'],
  },
  {
    id: 'warm-cozy-organic',
    prompt: 'a warm, cozy, organic design',
    style_tags: ['cottagecore-tech', 'witchcore-ui'],
  },
  {
    id: 'cold-sterile',
    prompt: 'a cold, sterile, technical aesthetic',
    style_tags: ['terminal-cli', 'default-computing-native'],
  },
  {
    id: 'luxurious-premium',
    prompt: 'a luxurious, refined, premium design',
    style_tags: ['glassmorphism', 'editorial-serif-revival'],
  },
  {
    id: 'chaotic-anxious',
    prompt: 'a chaotic, energetic, anxious interface',
    style_tags: ['anxiety-urgency', 'glitchcore'],
  },
  {
    id: 'craft-handmade',
    prompt: 'a craft, handmade, tactile aesthetic',
    style_tags: ['cottagecore-tech', 'memphis'],
  },
  {
    id: 'corporate-formal',
    prompt: 'a corporate, formal, professional interface',
    style_tags: ['fintech-trust', 'saas-b2b-dashboard', 'swiss-rationalism'],
  },
];

const MODEL_ID = 'Xenova/clip-vit-base-patch32';

// Lazy-loaded model handles
let _model = null;
let _processor = null;
let _tokenizer = null;
let _textEmbeddings = null; // Float32Array[16] of L2-normalised text embeddings
let _status = 'unloaded'; // 'unloaded' | 'loaded' | 'unavailable'

// Test hook: when set to a function, ensureModel() will throw via that loader.
// Keeps the module fully testable without polluting global require/import.
let _importOverride = null;

export function __setImportOverride(fn) {
  _importOverride = fn;
  // Reset state so the next call re-evaluates with the override
  _model = null;
  _processor = null;
  _tokenizer = null;
  _textEmbeddings = null;
  _status = 'unloaded';
}

async function importTransformers() {
  if (_importOverride) return _importOverride();
  return import('@xenova/transformers');
}

// Load model lazily. Returns true on success, false if transformers.js missing.
async function ensureModel() {
  if (_status === 'loaded') return true;
  if (_status === 'unavailable') return false;
  try {
    const transformers = await importTransformers();
    const { CLIPModel, AutoProcessor, AutoTokenizer } = transformers;
    if (!CLIPModel || !AutoProcessor || !AutoTokenizer) {
      throw new Error('transformers module missing required exports');
    }
    _processor = await AutoProcessor.from_pretrained(MODEL_ID);
    _tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID);
    _model = await CLIPModel.from_pretrained(MODEL_ID);
    _status = 'loaded';
    if (VERBOSE) process.stderr.write('[photo] CLIP model loaded\n');
    return true;
  } catch (err) {
    _status = 'unavailable';
    if (VERBOSE) {
      process.stderr.write(`[photo] CLIP unavailable: ${err.message}\n`);
    }
    return false;
  }
}

export function getStatus() {
  return _status;
}

// L2-normalise a Float32Array in place (returns a new copy).
function l2Normalize(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i] * arr[i];
  const norm = Math.sqrt(sum) || 1;
  const out = new Float32Array(arr.length);
  for (let i = 0; i < arr.length; i++) out[i] = arr[i] / norm;
  return out;
}

function cosineSimilarity(a, b) {
  // Both are expected L2-normalised → dot product is cosine.
  let s = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) s += a[i] * b[i];
  return s;
}

function softmax(scores) {
  // Numerically-stable softmax.
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / sum);
}

// Pre-compute and cache text embeddings for the 16 mood-prompts.
async function getTextEmbeddings() {
  if (_textEmbeddings) return _textEmbeddings;
  if (_status !== 'loaded') return null;
  const out = [];
  for (const entry of MOOD_PROMPTS) {
    const tokens = await _tokenizer(entry.prompt, { padding: true, truncation: true });
    const result = await _model.get_text_features(tokens);
    // result.data is a typed array (transformers.js Tensor convention).
    const data = result?.data ?? result;
    out.push(l2Normalize(Float32Array.from(data)));
  }
  _textEmbeddings = out;
  return out;
}

async function clipClassify(imageBuffer) {
  // Decode image via processor → image-features → cosine vs each text-emb → softmax.
  const textEmbs = await getTextEmbeddings();
  if (!textEmbs) {
    return null;
  }
  // The processor accepts raw buffers wrapped via a RawImage; transformers.js
  // exposes RawImage for this. We import it lazily from the same module.
  const { RawImage } = await importTransformers();
  if (!RawImage) {
    throw new Error('transformers.RawImage missing');
  }
  const image = await RawImage.read(imageBuffer);
  const inputs = await _processor(image);
  const imgFeatures = await _model.get_image_features(inputs);
  const imgVec = l2Normalize(Float32Array.from(imgFeatures?.data ?? imgFeatures));
  const sims = textEmbs.map((t) => cosineSimilarity(imgVec, t));
  // Scale similarities (CLIP convention uses learned temperature; ~100 mimics it
  // and produces sharper softmax distributions matching reference impls).
  const scaled = sims.map((s) => s * 100);
  const probs = softmax(scaled);
  const all_scores = MOOD_PROMPTS.map((p, i) => ({
    mood: p.id,
    confidence: probs[i],
    style_tags: p.style_tags,
  }));
  const top = all_scores
    .slice()
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
  return { method: 'clip', top, all_scores };
}

// Map heuristic signals to mood-prompts using simple deterministic rules.
// Inputs:
//   palette: { temperature: 'warm'|'cool'|'neutral' } | null
//   saturation: 0..1 | null  (mean oklch.c, normalised)
//   edgeDensity: 0..1 | null (fraction of pixels above gradient threshold)
function heuristicClassify({ palette, saturation, edgeDensity }) {
  const sat = typeof saturation === 'number' ? saturation : 0.5;
  const edges = typeof edgeDensity === 'number' ? edgeDensity : 0.15;
  const temp = palette?.temperature ?? 'neutral';

  // Initial scores per mood-id, all start neutral.
  const scores = new Map(MOOD_PROMPTS.map((p) => [p.id, 0.05]));

  const bump = (id, weight) => {
    if (scores.has(id)) scores.set(id, scores.get(id) + weight);
  };

  // Saturation buckets
  const lowSat = sat < 0.18;
  const midSat = sat >= 0.18 && sat < 0.42;
  const highSat = sat >= 0.42;

  // Edge buckets — mirrors Task 35.3 motion-tier thresholds.
  const lowEdge = edges < 0.05;
  const midEdge = edges >= 0.05 && edges < 0.15;
  const expressEdge = edges >= 0.15 && edges < 0.30;
  const highEdge = edges >= 0.30;

  // 1. low-sat + low-edge → calm-minimal or cold-sterile (split by temperature)
  if (lowSat && (lowEdge || midEdge)) {
    if (temp === 'cool') {
      bump('cold-sterile', 0.7);
      bump('calm-minimal', 0.4);
    } else {
      bump('calm-minimal', 0.7);
      bump('cold-sterile', 0.3);
    }
    bump('clinical-precise', 0.25);
  }

  // 2. high-sat + warm → vibrant-maximalist or warm-cozy-organic
  if (highSat && temp === 'warm') {
    bump('vibrant-maximalist', 0.6);
    bump('warm-cozy-organic', 0.5);
    bump('playful-irreverent', 0.3);
    if (highEdge) bump('chaotic-anxious', 0.35);
  }

  // 3. high-edges + cool → industrial-brutalist or futuristic-sci-fi
  if ((expressEdge || highEdge) && temp === 'cool') {
    bump('industrial-brutalist', 0.55);
    bump('futuristic-sci-fi', 0.5);
    bump('glitchy-distorted', 0.3);
  }

  // 4. medium signals across the board → editorial-intellectual
  if (midSat && (midEdge || expressEdge) && temp !== 'warm') {
    bump('editorial-intellectual', 0.6);
    bump('corporate-formal', 0.35);
  }

  // 5. high-sat + cool → glitchy / cyberpunk territory
  if (highSat && temp === 'cool') {
    bump('glitchy-distorted', 0.45);
    bump('futuristic-sci-fi', 0.4);
    bump('vibrant-maximalist', 0.3);
  }

  // 6. low-sat + warm → craft-handmade / retro-nostalgic
  if (lowSat && temp === 'warm') {
    bump('craft-handmade', 0.5);
    bump('retro-nostalgic', 0.4);
    bump('warm-cozy-organic', 0.35);
  }

  // 7. high-sat + neutral → playful-irreverent with retro-nostalgic flavor
  if (highSat && temp === 'neutral') {
    bump('playful-irreverent', 0.5);
    bump('retro-nostalgic', 0.35);
    bump('vibrant-maximalist', 0.3);
  }

  // 8. low edges + cool → luxurious-premium / dreamy-soft
  if (lowEdge && temp === 'cool' && !lowSat) {
    bump('luxurious-premium', 0.45);
    bump('dreamy-soft', 0.4);
  }

  // 9. high edges + warm → chaotic-anxious / industrial-brutalist
  if (highEdge && temp === 'warm') {
    bump('chaotic-anxious', 0.5);
    bump('industrial-brutalist', 0.35);
  }

  // 10. neutral baseline boost so corporate-formal is reachable from drab inputs
  if (midSat && midEdge && temp === 'neutral') {
    bump('corporate-formal', 0.4);
    bump('editorial-intellectual', 0.3);
  }

  // Convert raw scores into a softmaxed confidence distribution.
  const ids = MOOD_PROMPTS.map((p) => p.id);
  const raw = ids.map((id) => scores.get(id));
  const probs = softmax(raw);
  const all_scores = MOOD_PROMPTS.map((p, i) => ({
    mood: p.id,
    confidence: probs[i],
    style_tags: p.style_tags,
  }));
  const top = all_scores
    .slice()
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
  return { method: 'heuristic', top, all_scores };
}

// Public API: classify image buffer → top-3 moods.
// When `forceHeuristic` is true (or transformers.js missing), uses heuristic path.
export async function classifyMood({
  imageBuffer = null,
  fallbackPalette = null,
  fallbackSaturation = null,
  fallbackEdgeDensity = null,
  forceHeuristic = false,
} = {}) {
  if (!forceHeuristic && imageBuffer) {
    const ok = await ensureModel();
    if (ok) {
      try {
        const result = await clipClassify(imageBuffer);
        if (result) return result;
      } catch (err) {
        // Soft-fail to heuristic — don't break callers when CLIP throws mid-run.
        if (VERBOSE) {
          process.stderr.write(`[photo] CLIP inference failed: ${err.message}\n`);
        }
      }
    }
  }
  return heuristicClassify({
    palette: fallbackPalette,
    saturation: fallbackSaturation,
    edgeDensity: fallbackEdgeDensity,
  });
}

export { MOOD_PROMPTS };
