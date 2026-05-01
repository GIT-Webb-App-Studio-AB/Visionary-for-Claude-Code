# Visual Embeddings (DINOv2)

Sprint 11 adds a visual off-style detector. Whereas the existing heuristic stack measures formal properties (entropy, gestalt grouping, ΔE2000), DINOv2 measures *style similarity* against curated anchors.

## Pipeline

1. Playwright captures screenshot @ 1200×800.
2. `lib/visual/dinov2-embed.mjs` lazy-loads onnxruntime-web (WebGPU-preferred) and runs DINOv2-small.
3. `lib/visual/style-match.mjs` cosines the rendered embedding against anchors for the active style; maps to `visual_style_match` 0..10.
4. `lib/visual/ood-detect.mjs` flags renders > 2σ from the style centroid (Mahalanobis with diagonal covariance).
5. `lib/visual/inject.mjs` produces an additionalContext block for the critic, with strict instruction to cite the visual aspect when score < 6.

## Setup (manual)

1. Install peer dep: `npm install onnxruntime-web sharp`
2. Download model: `node scripts/download-dinov2.mjs` (saves to `~/.visionary/models/dinov2-small.onnx`)
3. Curate 50 styles × 5 anchors each at `models/style-anchors/<style-id>/*.png`
4. Build index: `node scripts/build-anchors.mjs`

## Toggles

| Env | Default | Effect |
|---|---|---|
| `VISIONARY_VISUAL_EMBED` | on | Set to `0` for fallback to 10-dim critique without visual_style_match |
| `VISIONARY_VISUAL_VERBOSE` | off | `1` prints stack-load diagnostics to stderr |

## Score mapping

| Cosine sim | visual_style_match | Interpretation |
|---|---|---|
| ≥ 0.85 | 10 | textbook in-style render |
| ≥ 0.70 | 8 | good match |
| ≥ 0.55 | 5 | partial match |
| ≥ 0.40 | 3 | mostly off-style |
| < 0.40 | 1 | clearly off-style |

OOD classification uses Mahalanobis sigma: ≤1σ in-distribution, ≤2σ marginal, >2σ OOD.
