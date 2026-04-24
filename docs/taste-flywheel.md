# Taste flywheel

How Visionary's critique gets better as you use it.

## The loop in one picture

```
user brief
   │
   ▼
style selection ──── taste/facts.jsonl      (Sprint 5: what you've liked / disliked)
   │                 taste/pairs.jsonl       (Sprint 5: what you picked in /variants)
   ▼
generate (round 1)
   │
   ▼
critic ensemble ──── taste/accepted-examples.jsonl  (Sprint 6: your historical good outputs)
   │                                                   │
   │◄────── top-3 RAG anchors from past acceptances ───┘
   ▼
round 2/3 refine
   │
   ▼
accepted? ─── yes ──▶ append to accepted-examples.jsonl + screenshot
   │                                                 │
   no                                                │
   │                                                 │
   ▼                                                 │
feedback loop closed ───────────────────────────────┘
```

## The RAG step (Sprint 6 Item 17)

Before the critic scores round 1's output, the hook:

1. Embeds the current brief with `hooks/scripts/lib/embed-brief.mjs` (384-dim hashed n-gram, zero-dep).
2. Cosine-ranks it against every entry in `taste/accepted-examples.jsonl`.
3. Picks top-3 as anchors.
4. Injects them into the critic's system prompt:

   > _"This user previously rated the following outputs as acceptable for similar briefs. Calibrate your scoring to their demonstrated taste:_
   > _Example 1: brief='pricing page for B2B SaaS' → style='editorial-serif-revival', final calibrated composite 8.4/10 [screenshot attached]_
   > _Example 2: …"_

The anchors are **scoring calibration**, not required matches. A critic still grades the current output on its merits; the anchors tell it "this user's floor is X", not "this output must look like example Y".

## Cold-start fallback

RAG needs history. A brand-new installation has zero accepted examples — forcing the first 5 generations to "match the user's taste" is bad taste, because there IS no user taste yet.

**Rule.** When `taste/accepted-examples.jsonl` has fewer than **5 entries**, skip brief-embedding + RAG retrieval entirely. Instead, the critic's system prompt receives a **designer-pack baseline anchor**:

> _"No personal history yet — using Dieter Rams' ten principles of good design as a calibration baseline."_

The default pack is Rams (functional minimalism). Other packs are selectable via `/designer <name>`:

| Pack name      | Anchor discipline                                  | When it fits                                  |
|----------------|----------------------------------------------------|-----------------------------------------------|
| `rams`         | Functional minimalism, "as little design as possible" | Dashboards, professional tools, enterprise B2B |
| `kowalski`     | Editorial typographic intensity, contrast          | Editorial, content-heavy marketing, magazines |
| `vignelli`     | Grid-first, Helvetica, disciplined modular scale   | Admin, data-dense layouts, wayfinding         |
| `scher`        | Typographic maximalism, colour as primary          | Culture, arts, bold brand launches            |
| `greiman`      | Layered, digital-native, playful geometry          | Experimental, editorial-digital hybrids       |

The critic receives the pack's principles verbatim as anchor text. Scores are graded against the pack's own rubric until the user accrues ≥ 5 accepted examples, at which point the flywheel takes over and designer-pack anchors become a fallback only when no close brief-match exists in the RAG set.

## Why 5 entries?

Cold-start fallback ends when RAG can produce a reliable top-3 with meaningful variance. Fewer than 5 entries means one example dominates the top-3, which amplifies rather than calibrates — the critic starts scoring "does it look like the one thing I've seen?" instead of "does it meet this user's taste range?".

5 is a heuristic, not a law. The number can be lowered with `VISIONARY_RAG_MIN_EXAMPLES=3` if you explicitly want personalisation to kick in faster at the cost of noisier anchors.

## Rotation

`taste/accepted-examples.jsonl` is capped at **50 entries**. When the cap is exceeded, the rotation rule is:

1. Find the `product_archetype` with the most entries.
2. Delete the oldest entry in that archetype.

This keeps the set diverse — a user who's built 20 dashboards won't crowd out their single accepted editorial page.

## Dimensionality + embedder swaps

The current embedder is zero-dep (see `hooks/scripts/lib/embed-brief.mjs`). Output is 384-dim. When / if we swap to `@xenova/transformers` with `all-MiniLM-L6-v2`, or to Anthropic's embeddings API:

- The schema tolerates 256–1024 dims.
- Entries are tagged with `embedder_id`; readers never compare across embedders.
- Swapping is **additive** — old entries stay tagged `hashed-ngram-v1` and new entries are tagged whatever the new embedder reports. Both coexist until enough new-embedder entries accumulate to serve as an independent RAG set, at which point old entries can be re-embedded or aged out naturally.

## How to audit

```
/visionary-taste status      # includes accepted-examples count + RAG activation state
cat taste/accepted-examples.jsonl | wc -l
ls taste/screenshots
```

Or inspect a single entry: `head -n1 taste/accepted-examples.jsonl | python -m json.tool`.

## Opt-out

`VISIONARY_DISABLE_TASTE=1` disables the whole flywheel — captures, harvest, context injection, AND RAG retrieval. See `docs/taste-privacy.md` for the full opt-out matrix.

## Related docs

- `docs/taste-privacy.md` — data model, retention, opt-out flags
- `docs/style-embeddings.md` — embedder contract + future swap plan
- `docs/critique-principles.md` — what the critic is trying to measure
- `skills/visionary/schemas/accepted-example.schema.json` — on-disk format
