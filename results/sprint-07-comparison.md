# Sprint 07 Platform Play — benchmark comparison (template)

**Status:** Template stub. Run the benchmark against a stable build before
v1.4.0 release and fill in the numbers.

## How to produce the real numbers

```bash
# Baseline (v1.3.x, before Sprint 07 merged)
git checkout v1.3.0
node benchmark/runner.mjs --out results/pre-sprint-07.json

# Sprint 07 build
git checkout feat/sprint-07-platform
node benchmark/runner.mjs --out results/visionary-1.4.0-rc.json

# Diff
node benchmark/runner.mjs compare \
  --baseline results/pre-sprint-07.json \
  --target results/visionary-1.4.0-rc.json \
  > results/sprint-07-comparison.md
```

Fill in the table below with the comparison output. Expected deltas based on
the Sprint 07 theory of change:

| Dimension | v1.3.x | Sprint 07 target | Mechanism |
|---|---|---|---|
| composite_score | ~18.6 | ≥ 19.3 | 10th dimension lifts when kit is present |
| content_resilience | — (new) | ≥ 8.2 when kit present | Direct scorer output |
| craft_measurable | ~7.6 | ~7.6 (unchanged) | Scorer untouched |
| slop_detections | ~1.1 | ~0.9 | Pattern #32 catches Jane-Doe-with-kit cases |
| taste_drift_across_projects | high | low | `.taste` import carries prefs across projects |

## Sub-score breakdowns to verify at release time

1. **content_resilience distribution** — on the 20 kit-equipped gold-set
   fixtures, composite scores should cluster 7.5–9.5. Below 7 clusters
   indicate the kit-injection prompt isn't landing; retune the excerpt in
   `inject-taste-context.mjs`.
2. **Slop pattern #32 true/false positive rate** — measure across 40
   kit-equipped generations. True positive: generator hard-coded "Jane Doe"
   despite kit. False positive rate target: < 5 % (pattern only fires
   when a kit is committed, so it shouldn't fire on untouched legacy code).
3. **.taste import round-trip** — run `export` on a project with ≥ 30
   facts and ≥ 10 pairs, then `import` into a fresh project, then
   `export` again. The two exported files should differ only by
   privacy-scrubbed fields and ULIDs. Structural equality on
   preferences + typography + pairs fields.
4. **Auto-inference accuracy** — for each of the 3 inference sources
   (TS, Prisma, OpenAPI), score against hand-crafted gold kits from the
   fixture projects. Target: ≥ 85 % entity-name match, ≥ 70 % field-type
   match, ≥ 60 % constraint-detection (p95_length, nullable, enum).

## Known-open items for v1.5

- Content-resilience requires components to expose a `window.__visionary_kit__`
  seam. Components without it get scored on the one rendered state only,
  which caps the sub-score at ~6. This is a generator-side change that
  lands in the next sprint.
- YAML OpenAPI support (currently JSON-only).
- TS unions beyond `T | null` fall back to `sampleByType` — not broken,
  just lower-fidelity than Prisma enum detection.
- Community taste index (`visionary-tastes`) seeded with 5 designer packs.
  Real community fill-in happens over months.
