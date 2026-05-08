---
name: visionary-from-photo
description: >
  Use a photograph (URL or local file) as primary design input. Visionary
  extracts a 5-colour oklch palette, classifies mood via local CLIP, and
  measures edge-density to derive a motion-tier — then feeds all three into
  Stage 1 inference as a biased style pool + palette override. The next
  /visionary generation inherits the photo's palette, visual tempo and
  texture. Invoked as /visionary-from-photo or /from-photo.
---

# /visionary-from-photo — Photo-Driven Style Selection

Most users moodboard before they wireframe. This command collapses that step:
show Visionary a photo of dunes, a brutalist façade, a Holzer installation, a
Memphis poster — and the next generation runs with the photo's palette, mood
and visual energy already wired into Stage 1 (Context Inference).

This is a signature feature. Neither v0, Lovable nor Stitch ships it. Foto
becomes a first-class source for `StyleBrief` alongside taste-profile,
content-kit and prompt — not a tile in a Pinterest board you have to translate
yourself.

## Usage

```
/visionary-from-photo <url-or-path> [optional brief]
```

Examples:

```
/visionary-from-photo https://example.com/desert.jpg
/visionary-from-photo ./moodboards/brutalist.png "landing for a concrete co-op"
/visionary-from-photo C:\Users\me\Pictures\holzer.jpg "manifesto page, dark"
/visionary-from-photo /home/me/refs/saharan-dunes.jpg
```

The optional brief is appended to whatever Stage 1 derives from the photo —
useful when the photo carries the *aesthetic* but you still need to specify
the *product* ("hero section for a fintech app", "dashboard for an analytics
SaaS", etc.).

## What it does

The command runs a four-step pipeline (see
`hooks/scripts/lib/photo/from-photo-pipeline.mjs` for orchestration):

1. **Palette extraction** — `sharp` normalises the image to 800px on the long
   edge, then `node-vibrant` extracts 5 swatches (Vibrant, LightVibrant,
   DarkVibrant, Muted, DarkMuted). Each is converted to oklch via `culori`.
   Dominant temperature (`warm` / `cool` / `neutral`) is derived from the
   weighted mean hue of the three vibrant swatches; mean saturation is the
   average chroma.
2. **Mood classification** — local CLIP ViT-B/32 via `@xenova/transformers`
   (zero network calls after first install). The image is matched zero-shot
   against 16 mood-prompts ("calm minimal interior", "raw concrete brutalist",
   "vibrant maximalist poster", …). Top-3 moods + softmax confidence are
   returned, each carrying a list of `style_tags` from the catalog.
   • Fallback: when the CLIP model is not yet downloaded or the runtime is
   missing, this step degrades gracefully to `top: []` and the rest of the
   pipeline continues using palette + edges only.
3. **Edge-density → motion-tier** — Sobel-x and Sobel-y kernels via
   `sharp.convolve()`, summed to per-pixel magnitude, thresholded at 50/255.
   The fraction of high-gradient pixels buckets to:
   • `< 5%` → tier 0 (Static)
   • `5–15%` → tier 1 (Subtle)
   • `15–30%` → tier 2 (Expressive)
   • `> 30%` → tier 3 (Kinetic)
4. **Inject into Stage 1** — palette becomes a `palette_override` (HARD
   signal, see `skills/visionary/context-inference.md` Photo-driven inference
   section). The union of top-3 mood `style_tags` becomes a
   `biased_style_pool` (SOFT signal — `+20` boost in Stage 4 scoring).
   Motion-tier is a HARD signal that overrides stil-default unless the user
   passes `--motion-override <0|1|2|3>`.

The next `/visionary` invocation reads this state and generates accordingly.
The receipt shows `source: "photo-inferred"` plus a preview of the extracted
palette so the bias is transparent.

## Composition with other flags

`/visionary-from-photo` is **complementary**, not exclusive, to the existing
style-control commands:

| Other flag/command            | Photo behaviour                                   |
|-------------------------------|---------------------------------------------------|
| `/visionary --blend "a:0.7+b:0.3"` | `--blend` wins. Photo only narrows Stage 2 hints. |
| `/visionary --vs <style>`     | `--vs` overrides photo palette + style pool.       |
| `/visionary --no-vs`          | No effect on photo. Photo signals still apply.     |
| `/visionary-mood <phrase>`    | Both contribute. Photo palette is HARD; mood-phrase is SOFT and merges with photo's `biased_style_pool`. |
| `/visionary-taste`            | Permanent-avoid facts override photo picks. A banned style stays banned even if it's the top mood match. |
| `--motion-override 0..3`      | HARD-wins over photo-derived motion-tier.          |

In short: **explicit user input always beats inferred photo input**. Photo
is the most informative *default* — not a lock.

## Privacy

Photos are cached locally under `${CLAUDE_PLUGIN_DATA}/photo-cache/<sha256>.png`
(falls back to `<projectRoot>/.visionary-cache/photo-cache/` when the env var
is unset). The cache is *permanent by design* — the photo is design input,
not a transient. Repeated invocations on the same URL skip the network
fetch via SHA256-keyed lookup.

**Nothing leaves the machine.** CLIP runs locally via `transformers.js`
(ONNX). URL-fetched photos are downloaded once and treated as local files
thereafter. There is no upload to any external API.

URL safety: only `http:` and `https:` schemes are accepted. The
`VISIONARY_DISABLE_NETWORK=1` env var blocks URL fetches entirely (path-input
still works). This protects against SSRF and supports air-gapped use.

## Setup requirements

Optional dependencies (the pipeline reports missing pieces with actionable
error messages — none of these are added to `package.json` automatically):

- **`sharp`** — required for both palette-extraction and edge-detection.
  Install: `npm install sharp`. Without it the command surfaces a clear
  install-instruction error.
- **`node-vibrant`** — required for swatch extraction. The pipeline falls
  back to a histogram-based palette if Vibrant returns < 3 valid swatches
  (low-contrast photo case, surfaced in the receipt).
- **`@xenova/transformers`** — optional but recommended for CLIP mood
  classification. First run downloads the ViT-B/32 model (~150 MB) into
  `~/.visionary/models/Xenova/clip-vit-base-patch32/`. Subsequent runs are
  offline. Without it, mood classification is skipped (palette + edges still
  apply).

Run `node scripts/download-clip-model.mjs` ahead of time to pre-warm the model
cache and avoid first-call latency spikes.

## Reference implementation

- Pipeline orchestrator: [`hooks/scripts/lib/photo/from-photo-pipeline.mjs`](../hooks/scripts/lib/photo/from-photo-pipeline.mjs)
- Edge detection: [`hooks/scripts/lib/photo/edge-detect.mjs`](../hooks/scripts/lib/photo/edge-detect.mjs)
- Palette extraction (Task 35.1): `hooks/scripts/lib/photo/extract-palette.mjs`
- CLIP mood classifier (Task 35.2): `hooks/scripts/lib/photo/clip-classifier.mjs`
- Tests: `hooks/scripts/lib/photo/__tests__/`
- Inference rules: `skills/visionary/context-inference.md` ("Photo-driven inference" section)

## Acceptance criteria (Sprint 18 Tasks 35.3 + 35.4)

- 10 test photos produce visually-traceable UIs (palette appears in the rendered
  DOM; motion tier matches photo energy on ≥ 7/10).
- Pipeline completes in < 8 s end-to-end after first CLIP load (parallel
  mood + edges).
- Receipt surfaces palette, top-3 mood, and motion-tier so the user can verify
  what was inferred.
- Edge-detection bucket boundaries are exact: density 0.05 → tier 1, 0.15 →
  tier 2, 0.30 → tier 3 (lower-inclusive, upper-exclusive).

## Related

- `/visionary` — main generation command. Photo state is consumed by Stage 1.
- `/visionary-mood` — alternate mood-via-text input. Composes with photo.
- `/visionary --blend` — explicit anchor recipe. Wins over photo.
- `/visionary-taste` — permanent-avoid facts override photo picks.
- `/variants` — three-way preview. Photo narrows the pool, variants surfaces
  three orthogonal picks inside it.
