# Sprint 11 — Visual embeddings: DINOv2 ONNX i scoring-stacken

**Vecka:** 19–20
**Fas:** 5 — Critique-uppgradering
**Items:** 26 från roadmap (ny)
**Mål:** Lägga till en visuell embedding-baserad off-style-detektor i critique-stacken. DINOv2 är empiriskt bättre än CLIP på low-level visuella attribut (färg, textur, stil) — exakt det vi behöver för "ser sidan ut som stilen säger?". Vår nuvarande hashed n-gram embedding (8-axis, zero-dep) är en grov proxy för kategori-matchning men säger inget om visuell likhet med stil-anchor. Det här är största kvalitetshöjaren i Q2-roadmappen.

Logik: heuristic-stacken (Shannon entropy, DBSCAN gestalt, ΔE2000) mäter formal egenskaper. DINOv2-cosine mot stil-anchor mäter "är detta en brutalist-komponent eller bara en mörk komponent?" — strukturellt annorlunda fråga.

## Scope

- Item 26 — DINOv2 ONNX-integration: onnxruntime-web setup, modell-bundling, embedding-extraktion, anchor-set per stil, cosine-similarity + OOD-detection, ny critique-dimension `visual_style_match`, kalibrering, fallback.

## Pre-flight checklist

- [ ] Sprint 9 mergad — Motion Scoring v2 stable
- [ ] Sprint 10 — MCP-server kan vänta tills 11 är klar (parallellt OK)
- [ ] Bundle-size budget review: vi lägger till ~22 MB modellfil — bekräfta att download-en-gång + cache-strategy är acceptabel
- [ ] Topp-50 stilar identifierade för anchor-curation (de andra 152 får fallback-anchors från category-similarity)
- [ ] Feature-branch: `feat/sprint-11-dinov2-embeddings`

---

## Task 26.1 — onnxruntime-web setup + WebGPU-detection [M]

**Fil:** `hooks/scripts/lib/visual/onnx-runtime.mjs` (ny), `package.json`

**Steg:**
1. Lägg till `onnxruntime-web@^1.26` som dep.
2. Wrapper-modul exponerar `loadModel(path)` + `runInference(model, input)`.
3. Detektera WebGPU stöd; fall back till CPU-execution-provider om frånvarande.
4. Cache loadad modell i memory (en gång per session).
5. Diagnostik-flagg: `VISIONARY_VISUAL_VERBOSE=1` printar "WebGPU active / CPU fallback / failed: <reason>" till stderr.

**AC:**
- Test: `loadModel('./test-fixtures/tiny.onnx')` lyckas
- WebGPU-test: skip på CI-runners utan GPU; bekräfta CPU-path fungerar
- Memory-cache: andra `loadModel`-anrop på samma path returnerar samma instance

---

## Task 26.2 — DINOv2-small ONNX modell-bundling [M]

**Fil:** `models/dinov2-small.onnx` (ny, ~22 MB), `scripts/download-dinov2.mjs` (ny)

**Steg:**
1. Hämta DINOv2-small (vits14, 22M params) ONNX-export från HuggingFace `facebook/dinov2-small` eller använd `optimum`-CLI för konvertering.
2. INT8-quantize för storleksreduktion (~22 MB → ~6 MB möjligt) — beslut: behåll FP16 om INT8 tappar > 5 % i style-classification-accuracy.
3. Lägg modellen i `models/`. **Inte committed till git** — för stor. Lazy-download vid första användning, sparas i `~/.visionary/models/`.
4. SHA-256-checksum i `models/dinov2-small.sha256` så download verifierar integritet.
5. Download-script: `node scripts/download-dinov2.mjs` (manuellt) + auto-trigger från `loadModel` om frånvarande.

**AC:**
- Modell laddas ner < 30 s på 50 Mbps
- Checksum verifieras
- `.gitignore` exkluderar `models/*.onnx` men committar `.sha256`

---

## Task 26.3 — Embedding-extraktor [M]

**Fil:** `hooks/scripts/lib/visual/dinov2-embed.mjs`

**Steg:**
1. Input: PNG/JPEG-buffer från Playwright-screenshot.
2. Pre-process: resize till 224×224, normalize per ImageNet-stats, layout NCHW float32.
3. Run inference, extract `cls_token` från output (768-dim för DINOv2-small).
4. Normalize till unit-length (L2).
5. Returnera `Float32Array(768)`.

**AC:**
- Test: två renders av samma komponent → cosine ≥ 0.95
- Test: render av brutalism vs render av glassmorphism → cosine < 0.6
- Inference-tid ≤ 100 ms på CPU för 1200×800-screenshot (efter resize)

---

## Task 26.4 — Anchor-set per stil [L]

**Fil:** `models/style-anchors/{style-id}/*.png` (ny), `models/style-anchors/_index.json`

**Process:**
1. Identifiera topp-50 stilar (mest använda enligt usage-traces).
2. Per stil: kurera 5 reference-bilder (1200×800). Mix av:
   - 2 från egen "best-of" gallery (om finns)
   - 2 AI-genererade kanoniska exempel (Visionary v1 outputs som fick hög distinctiveness-score)
   - 1 från extern referens (real product, screenshot, ev. fair-use)
3. Beräkna embedding för varje, lagra `_index.json`:
   ```json
   {
     "neon-dystopia": {
       "anchors": [
         { "image": "anchor-1.png", "embedding": [0.041, -0.18, ...] }
       ],
       "centroid": [0.038, -0.17, ...],
       "covariance_diagonal": [0.014, 0.022, ...]
     }
   }
   ```
4. Resterande 152 stilar: fallback till category-centroid (alla brutalism-substyles delar bas-anchor).

**AC:**
- 50 stilar × 5 anchors = 250 bilder kurerade (inte commitas, hostas via release-asset eller separate repo)
- `_index.json` innehåller embeddings + centroids (small file, OK att committa)
- Auto-build-script: `node scripts/build-anchors.mjs` re-genererar `_index.json` från images

---

## Task 26.5 — Cosine-similarity + style_match_score [M]

**Fil:** `hooks/scripts/lib/visual/style-match.mjs`

**Steg:**
1. Input: rendered embedding + active style id.
2. Hämta anchor-set för stilen från `_index.json`.
3. Beräkna cosine-similarity mot:
   - Bästa anchor (max över alla 5)
   - Centroid
4. Returnera `style_match_score` = max-similarity, normaliserat till [0, 1].
5. Mappa till `visual_style_match`-dimensionen (0–10) i critique:
   - sim ≥ 0.85 → 10
   - sim ≥ 0.70 → 8
   - sim ≥ 0.55 → 5
   - sim ≥ 0.40 → 3
   - < 0.40 → 1

**AC:**
- Test: rendered brutalism mot brutalism-anchor → score ≥ 8
- Test: rendered brutalism mot fintech-trust-anchor → score ≤ 4
- Edge: stil utan kuraterade anchors → fallback till category-centroid med konfidens-flagga

---

## Task 26.6 — OOD-detection [M]

**Fil:** `hooks/scripts/lib/visual/ood-detect.mjs`

**Steg:**
1. Beräkna Mahalanobis-distance mellan rendered embedding och stilens centroid + diagonal-kovarians (`_index.json`).
2. Klassificera:
   - distance ≤ 1σ → in-distribution (normal)
   - 1σ < distance ≤ 2σ → marginal (varning, inte block)
   - > 2σ → OOD (off-style — flagga för critic)
3. Returnera `{ in_distribution: bool, distance_sigma: float, classification }`.
4. Critic-prompt får OOD-flagga: "rendered komponent ligger 2.4σ från stil-centroid — påpeka *vilka* visuella drag avviker".

**AC:**
- Test: clearly off-style render → OOD
- Test: textbook in-style render → in_distribution
- Distance reported i evidence-array

---

## Task 26.7 — Integration som ny critique-dimension [M]

**Fil:** `hooks/scripts/capture-and-critique.mjs`, `agents/visual-critic.md`, `skills/visionary/schemas/trace-entry.schema.json`

**Steg:**
1. Lägg till `visual_style_match` som 11:e dimension i critique-output.
2. Vikt i totalpoäng: 0.10 (lika med övriga icke-a11y-dim).
3. Critic-prompt uppdateras: "Om `visual_style_match < 6`, citera vilken sub-aspekt avviker (color-temperature, density, decoration, etc.)".
4. Trace-schema: lägg till `visual.embedding_path`, `visual.style_match_score`, `visual.ood_classification`.

**AC:**
- 11-dim critique-output validerar mot schema
- Critic-rapport refererar visual-evidence vid score < 6
- Toggle: `VISIONARY_VISUAL_EMBED=0` → fallback till 10-dim som tidigare

---

## Task 26.8 — Kalibrering mot gold-set [M]

**Fil:** `scripts/calibrate-visual-match.mjs` (ny)

**Steg:**
1. Utöka gold-set med 30 entries: per entry, human-rated `visual_style_match` 0–10.
2. Fitta linjär kalibrering på cosine-sim → human-score.
3. Spara konstanter i `skills/visionary/calibration/visual-match.json`.
4. Justera threshold-mappning från Task 26.5 baserat på fit.

**AC:**
- R² ≥ 0.6 (eller dokumentera varför inte)
- Calibration-fil committad
- `node scripts/calibrate-visual-match.mjs --report` printar fit-stats

---

## Task 26.9 — Fallback när WebGPU/onnxruntime saknas [S]

**Fil:** `hooks/scripts/lib/visual/style-match.mjs` (extend)

**Steg:**
1. Om `loadModel` misslyckas eller WebGPU saknas på en CI-runner: skippa `visual_style_match`-dim.
2. Critique-output flagga: `dimensions_skipped: ["visual_style_match"]` med skäl.
3. Total-score viktas om till 10 dim istället för 11.
4. Stderr-warning: "Visual style match disabled (no ONNX runtime / WebGPU)".

**AC:**
- CI utan GPU kör critique utan crash
- Total-score skalas korrekt vid skipped dim

---

## Task 26.10 — Tester [M]

**Fil:** `hooks/scripts/lib/visual/__tests__/*.test.mjs`

**Coverage:**
- ONNX-runtime-wrapper: load + cache
- Embedding-extraktor: shape + L2-norm = 1
- Style-match: known-good vs known-bad fixtures
- OOD: in/out-of-distribution edge-cases
- Fallback: simulera missing modell, bekräfta graceful skip
- Schema-validation av visual-payload

**AC:**
- `node --test` grön
- Coverage ≥ 80 % på `lib/visual/`

---

## Task 26.11 — Benchmark-verifiering [M]

**Fil:** `results/sprint-11-visual-match.md`

**Pre/post-mätning på 30-prompt-suite:**
- `visual_style_match` mean (baseline N/A — ny dim, rapportera fördelning)
- Distinctiveness-dim correlation med visual_style_match (förvänta måttlig positiv korrelation; om > 0.85 är de redundanta)
- Off-style-detektion rate (förvänta 5–15 % flag-rate på generella prompts; inom rimligt fönster)
- Wall-clock-tid per critique (förvänta +200–400 ms)

**AC:**
- Rapport publicerad
- Korrelation distinctiveness ↔ visual_match analyserad

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| 22 MB model-download avskräcker | Hög | Medel | Lazy-download först vid behov; tydlig progress-bar; cache i `~/.visionary/models/` |
| ONNX runtime-web bugar på Node 18 | Medel | Hög | Pinned version 1.26.0, dokumenterad Node 18.18+-baseline |
| Anchor-set kvalitet ojämn över 50 stilar | Hög | Medel | Iterativ kuration, prioritera mest-använda 20 först, övriga 30 efterhand |
| WebGPU instabilt i Headless Playwright | Medel | Låg | Default till CPU EP i Playwright-context, WebGPU bara i interactive |
| INT8-kvantisering tappar style-discrimination | Medel | Medel | Behåll FP16 som default, INT8 som opt-in |

---

## Definition of Done

- [ ] Alla tasks (26.1–26.11) klara
- [ ] DINOv2-modell auto-downloads + verifieras
- [ ] 50 stilar har kurerade anchors + embeddings i `_index.json`
- [ ] `visual_style_match` är 11:e critique-dimension
- [ ] Kalibrering kommitterad
- [ ] Fallback fungerar på CI utan GPU
- [ ] `results/sprint-11-visual-match.md` publicerad
- [ ] Mergad till `main`

## Amendments

_Tomt._
