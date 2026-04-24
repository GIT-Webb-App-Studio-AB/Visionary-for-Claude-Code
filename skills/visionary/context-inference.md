# Context Inference Engine

Scores incoming requests against 5 signals to determine the optimal design style.

## Output Shape

```typescript
interface StyleBrief {
  category: StyleCategory;        // one of 12 category names
  style_id: string;               // e.g. "fintech-trust-ui"
  motion_level: 0 | 1 | 2 | 3;  // 0=static, 1=subtle, 2=expressive, 3=kinetic
  density: 'sparse' | 'balanced' | 'dense';
  palette_direction: string;       // e.g. "cool neutrals, single accent"
  locale: LocaleConfig;           // detected language and character requirements
}

interface LocaleConfig {
  lang: string;                   // BCP 47 tag: "sv", "de", "ja", "ar", etc.
  script: 'latin' | 'latin-ext' | 'cjk-jp' | 'cjk-kr' | 'cjk-sc' | 'cjk-tc' | 'arabic' | 'devanagari' | 'cyrillic';
  font_subset: string;            // Google Fonts subset param: "latin,latin-ext"
  sample_chars: string;           // chars to verify rendering: "å ä ö" for sv
  html_lang: string;              // <html lang="..."> value
  text_direction: 'ltr' | 'rtl'; // for Arabic, Hebrew, etc.
}
```

## Language & Locale Detection

Detect the target language from the user's prompt, content language, or explicit `lang` attribute. This is a **Stage 0** operation — it must happen before style scoring.

### Detection Signals (in priority order)
1. **Explicit request**: "Swedish site", "japansk sida", "RTL Arabic"
2. **Content language**: If the user writes in Swedish, the output is Swedish
3. **Character evidence**: å ä ö → Swedish/Finnish, ü ö ä ß → German, ñ → Spanish
4. **Domain signals**: `.se` domain → Swedish, `.de` → German, etc.

### Locale Lookup Table

| Language | lang | script | font_subset | sample_chars | Notes |
|----------|------|--------|-------------|-------------|-------|
| Swedish | sv | latin-ext | `latin,latin-ext` | å ä ö Å Ä Ö | **CRITICAL**: Never substitute å→a, ä→a, ö→o. "Bokföring" not "Bokfoering". |
| Finnish | fi | latin-ext | `latin,latin-ext` | ä ö å Ä Ö Å | Same chars as Swedish |
| Norwegian | nb | latin-ext | `latin,latin-ext` | æ ø å Æ Ø Å | |
| Danish | da | latin-ext | `latin,latin-ext` | æ ø å Æ Ø Å | |
| German | de | latin-ext | `latin,latin-ext` | ä ö ü ß Ä Ö Ü | ß has no uppercase (use SS) |
| French | fr | latin-ext | `latin,latin-ext` | é è ê ë à â ç ô | Accent marks are mandatory, not optional |
| Spanish | es | latin-ext | `latin,latin-ext` | ñ á é í ó ú ü ¿ ¡ | ¿ and ¡ required in questions/exclamations |
| Portuguese | pt | latin-ext | `latin,latin-ext` | ã õ á é ç â ê | |
| Polish | pl | latin-ext | `latin,latin-ext` | ą ć ę ł ń ó ś ź ż | |
| Czech | cs | latin-ext | `latin,latin-ext` | č ď ě ň ř š ť ů ž | |
| Turkish | tr | latin-ext | `latin,latin-ext` | ç ğ ı İ ö ş ü | Dotless ı and dotted İ are distinct |
| Icelandic | is | latin-ext | `latin,latin-ext` | ð þ á é í ó ú ý æ ö | |
| Romanian | ro | latin-ext | `latin,latin-ext` | ă â î ș ț | Use ș/ț (comma below), NOT ş/ţ (cedilla) |
| Russian | ru | cyrillic | `cyrillic` | а б в г д е ё ж | See typography-matrix.md for Cyrillic fonts |
| Japanese | ja | cjk-jp | — | あ ア 漢 | See typography-matrix.md CJK section |
| Korean | ko | cjk-kr | — | 한글 테스트 | See typography-matrix.md CJK section |
| Chinese (Simplified) | zh-CN | cjk-sc | — | 中文测试 | See typography-matrix.md CJK section |
| Chinese (Traditional) | zh-TW | cjk-tc | — | 中文測試 | See typography-matrix.md CJK section |
| Arabic | ar | arabic | — | العربية | RTL layout required. See typography-matrix.md |
| Hebrew | he | hebrew | — | עברית | RTL layout required |
| Hindi | hi | devanagari | — | हिन्दी | See typography-matrix.md |
| English | en | latin | `latin` | (no special chars) | Default if undetected |

### Font Subset Rules

**Google Fonts URL must include the correct subset:**
```
CORRECT:  fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&subset=latin,latin-ext
WRONG:    fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700
```

Without `latin-ext`, characters like å ä ö render as fallback system font — breaking the design.

**Font compatibility check:**
Before selecting a font, verify it supports the required script:
- Most Google Fonts support `latin-ext` (covers Nordic, Central European)
- Not all fonts support `cyrillic`, `cjk`, or `arabic` — check typography-matrix.md
- If the chosen display font lacks the script → fall back to the CJK/script-specific font from typography-matrix.md

### Content Generation Rules

**CRITICAL — never transliterate or strip diacritics:**
```
CORRECT: "Bokföring som bara fungerar"
WRONG:   "Bokfoering som bara fungerar"
WRONG:   "Bokforing som bara fungerar"

CORRECT: "Créez votre compte"
WRONG:   "Creez votre compte"

CORRECT: "Über uns"
WRONG:   "Uber uns"
```

This is not optional. Stripping diacritics is equivalent to misspelling every word. It signals that the tool doesn't understand the language, destroying trust in the generated output.

**HTML lang attribute is mandatory:**
```html
CORRECT: <html lang="sv">
WRONG:   <html lang="en"> (when content is Swedish)
WRONG:   <html> (missing lang attribute)
```

## Content Kit Override (Stage 0.3 — Sprint 07 Task 21.6)

Before language/locale detection, check if `visionary-kit.json` exists in
the project root. When present, the UserPromptSubmit hook
(`hooks/scripts/inject-taste-context.mjs`) injects a compact excerpt into
`additionalContext` as a section titled `## Content kit (visionary-kit.json
— required data shapes)`.

When that section appears in your context:

1. **Do NOT invent placeholder data.** No "Jane Doe", "John Smith", "Acme
   Corp", or `name@example.com`. Use the sample shapes verbatim for your
   first render. The critic's slop scanner (Sprint 07 pattern #32) flags
   placeholder names when a kit is present.
2. **Respect constraints.** If the kit says `name.p95_length=28`, design
   for 28-char names — test truncation / wrapping, never shrink font size
   to fit.
3. **Respect diacritics.** If any constraint has `may_contain_diacritics`,
   the locale + font stack must render å ä ö ü é etc. correctly.
4. **Render every required_state.** The kit's `required_states` list is
   the contract: `loading`, `empty`, `error`, `populated` each must render
   without layout collapse. The content-resilience scorer (Sprint 07 Task
   21.5) grades this.
5. **Honour component density hints.** `component_constraints.table.p95_rows
   = 47` means your design must survive 47-row tables (scrolling, pagination,
   virtualisation — pick one; don't assume always-10).
6. **Plumb kit data as props.** Expose a kit-injection seam
   (`window.__visionary_kit__` or a kit-prop) so the Playwright render step
   can swap in p50/p95/empty states during critique. Components that hard-
   code their fixtures score low on `content_resilience`.

Kit guidance **does not override** taste signals or the Style Brief — it
constrains the *content shape* the component renders, not the *aesthetic*
it renders with.

## Design System Override (Stage 0.5)

Before running the 8-step algorithm, check if a persistent design system exists:

1. Check: does `design-system/MASTER.md` exist in the project root?
   - **YES** → Load it. Product type, colors, typography, motion tier, and spacing are already decided. Skip Steps 1-3. Still run Step 4.5 (taste adjustment) and Step 6 (variety penalty) to avoid staleness.
   - **NO** → Run the full 8-step algorithm as normal.

2. Check: does `design-system/pages/[requested-page].md` exist?
   - **YES** → Load it. Override values from MASTER.md with page-specific values.
   - **NO** → Use MASTER.md values for all fields.

3. User explicit instruction always overrides both MASTER and page files.

---

## Styles Index (`_index.json`)

The 200+-style catalogue is too large to evaluate manually — and far too large to load into every LLM call. `skills/visionary/styles/_index.json` is a compact structured index of every style's metadata, produced by `scripts/build-styles-index.mjs`. It is the canonical input for Steps 1–3 of the selection algorithm below (pure filters: no LLM reasoning needed).

**Index entry schema** (fields are omitted when absent — keeps size under 500 B/entry):

```json
{
  "id": "bauhaus",
  "category": "historical",
  "path": "skills/visionary/styles/historical/bauhaus.md",
  "motion_tier": "Subtle",
  "density": "balanced",
  "locale_fit": ["all"],
  "palette_tags": ["dark", "light", "neon"],
  "keywords": ["bauhaus", "historical"],
  "accessibility": {
    "contrast_floor": 4.5,
    "touch_target_px": 44,
    "reduced_motion": "opacity-only"
  },
  "scoring_hints": {
    "product_archetypes": ["editorial", "developer"],
    "audience_density": ["balanced", "power"],
    "brand_tones": ["neutral", "corporate"]
  }
}
```

**How selection uses it:**

- **Steps 1–3** (category filter → motion tier → density / locale / blocked defaults): deterministic set operations over `_index.json`. No style bodies are read. No LLM call.
- **Step 4** (rubric scoring): operates on the **top-15 index entries** (≈ 6 KB) rather than the 200+ full style markdowns (≈ 1.6 MB). The scorer sees `category`, `motion_tier`, `density`, `keywords`, `scoring_hints` — enough signal to rank, not enough to bloat the prompt.
- **Step 7 → Code generation**: only after a winner is picked does the pipeline read the single winning style's full `.md` body. Runners-up are discarded.

**Rebuilding the index:**

```bash
node scripts/build-styles-index.mjs          # rebuild
node scripts/build-styles-index.mjs --check  # CI / pre-commit drift guard
```

The index is idempotent and deterministic — two sequential runs produce byte-identical output. Commit the regenerated `_index.json` together with any style file you add, rename, or re-tag.

**Runtime note:** The deterministic filter logic for Steps 1–3 lives today in the skill's prompt instructions rather than in a Node pre-processing layer. A runtime adapter (Sprint 02) will move these filters out of the LLM call entirely — at which point the skill loses the filter-specific tokens from every prompt.

---

## Style Selection Algorithm (v2)

The 200+-style catalogue is too large to evaluate manually. This 8-step funnel narrows the field systematically, with controlled randomness to ensure no two users get identical output for the same prompt.

```
186 styles
  ↓ Step 1: Category filter (product type → 3-4 candidate categories)
~40 styles
  ↓ Step 2: Motion tier filter (audience + context → tier)
~20 styles
  ↓ Step 2.5: Component type compatibility filter
~14 styles
  ↓ Step 3: Blocked default removal
~10 styles
  ↓ Step 4: Archetype + tone scoring (explicit rubric, 5 signals × 1-5)
  ↓ Step 4.5: Taste profile adjustment (boost/penalize from system.md)
Top 5 candidates
  ↓ Step 5: Context-aware transplantation bonus (+15% to +35%)
  ↓ Step 6: Variety penalty (session -100%/-50%, cross-session -30% decay)
Top 3 finalists
  ↓ Step 7: Weighted random selection (not deterministic pick)
Winner → present in Design Reasoning Brief with runner-up
```

### Step 1 — Category Filter: Product Type → Candidate Categories

Map the detected product type to 2-3 **domain categories** plus 1-2 **transplant categories**. Always include at least one transplant.

**Extended catalog:** Load `product-types.md` and look up the detected product type. If found, use its `Domain categories`, `Transplant categories`, `Color mood`, `Typography mood`, `Motion tier`, and `Anti-patterns` fields. Pass `Color mood` and `Typography mood` as additional hints to Step 4 scoring — they inform the rubric but do not bypass weighted random selection.

**Fallback:** If the product type is not in `product-types.md`, use the table below (merge the 2 closest rows for unlisted types).

| Product Type | Domain Categories | Transplant Categories | Notes |
|---|---|---|---|
| **Fintech / Accounting / Bank** | industry (fintech-trust, neobank, bloomberg) | historical (swiss-rationalism, bauhaus, art-deco, dieter-rams), hybrid (newspaper-broadsheet) | Transplant is almost always better — finance is visually stale |
| **SaaS B2B / Dashboard** | contemporary (bento-grid, glass-dashboard, data-visualization) | historical (bauhaus, swiss-rationalism, constructivism), hybrid (catalog-archive) | Avoid sidebar+KPI+table cliche |
| **Healthcare / Wellness** | industry (medtech-clinical, healthcare-wellness) | cultural (scandinavian-nordic, japanese-minimalism), emotional (zen-void) | |
| **E-commerce / Retail** | industry (ecommerce-retail) | hybrid (fashion-editorial, catalog-archive), material (paper-editorial) | |
| **Developer Tools / API** | industry (developer-tools) | contemporary (terminal-cli), historical (constructivism), typography (mono-aesthetic) | |
| **Creative Agency / Portfolio** | hybrid (photography-portfolio, fashion-editorial) | historical (swiss-rationalism, new-wave-swiss-punk), typography (kinetic-type, big-bold-type) | |
| **Education / EdTech** | industry (edtech) | emotional (playful-joyful, whimsical-storybook), cultural (scandinavian-nordic) | |
| **Legal / GovTech** | industry (legaltech, govtech-civic) | historical (swiss-rationalism, dieter-rams), hybrid (newspaper-broadsheet, scientific-journal) | |
| **Consumer App / Social** | contemporary (gamification), emotional (dopamine-design, playful-joyful) | internet (y2k-futurism, vaporwave), futurist (spatial-ar) | |
| **Luxury / Premium** | emotional (luxury-aspirational) | material (leather-craft, metal-chrome, glass-crystal), historical (art-deco, art-nouveau) | |
| **Media / Editorial** | contemporary (responsive-editorial) | hybrid (newspaper-broadsheet, print-to-web-editorial), typography (serif-revival, condensed-editorial) | |
| **Gaming** | industry (gaming) | futurist (sci-fi-hud, neon-dystopia), internet (cyberpunk-neon, synthwave) | |
| **Real Estate / PropTech** | industry (proptech) | hybrid (map-cartographic, architecture-inspired), material (concrete-brutalist-material) | |
| **Food / Restaurant** | emotional (romantic-soft) | material (paper-editorial, wood-natural), cultural (latin-fiesta, scandinavian-nordic) | |
| **Non-profit / NGO** | emotional (trust-safety, caregiver) | cultural (scandinavian-nordic), historical (swiss-rationalism), hybrid (newspaper-broadsheet) | |
| **Travel / Hospitality** | emotional (romantic-soft, luxury-aspirational) | hybrid (photography-portfolio, map-cartographic), cultural (any regional match) | |
| **Music / Events** | hybrid (music-album-art) | internet (synthwave, vaporwave), typography (kinetic-type, big-bold-type) | |
| **Sports / Fitness** | emotional (energetic-athletic) | hybrid (sports-analytics), futurist (sci-fi-hud) | |

**If the product type is not in this table:** pick the 2 closest rows and merge their candidate categories.

### Step 2 — Motion Tier Filter

Remove styles whose motion tier is incompatible with the context:

| Context | Allowed tiers | Rationale |
|---|---|---|
| Financial data visible | Subtle only | Animation near money = distrust |
| Medical / legal / gov | Static, Subtle | Accuracy > flair |
| Consumer marketing | Subtle, Expressive | Engagement matters |
| Creative / portfolio | Expressive, Kinetic | Showing off is the point |
| Developer tools | Subtle, Expressive | Devs appreciate craft but hate theatrics |
| Entertainment / gaming | Expressive, Kinetic | Immersion expected |

### Step 2.5 — Component Type Compatibility Filter (NEW)

Not every style can handle every component type. Remove styles that are structurally incompatible with the requested UI.

| Component Type | Required capabilities | Incompatible styles (remove) |
|---|---|---|
| **Dashboard** (KPIs, charts, tables) | Dense grid, tabular data, multi-panel | `zen-void`, `big-bold-type`, `kinetic-type`, `liminal-space`, `dreamcore`, `psychedelic` |
| **Data table / List view** | Column alignment, row density, monospace numbers | `handwritten-gestural`, `dada`, `post-internet-maximalism`, `moodboard-collage` |
| **Form / Input-heavy** | Clear labels, input styling, validation states | `newspaper-broadsheet` (columns break forms), `op-art`, `glitchcore` |
| **Hero / Landing page** | Large type, CTA prominence, scroll narrative | All styles compatible (no filter) |
| **Navigation / Sidebar** | Vertical list, active states, compact spacing | `newspaper-broadsheet` (column-based), `big-bold-type` (too large) |
| **Card grid / Catalog** | Uniform card sizing, image + text, filterable | `condensed-editorial` (too tight), `terminal-cli` (no visual cards) |
| **Settings / Admin** | Dense controls, toggles, sectioned forms | Same as Form + `art-nouveau` (ornament conflicts with utility) |
| **Modal / Dialog** | Focused content, overlay, close action | All styles compatible (no filter) |
| **Pricing page** | Comparison columns, feature lists, CTA hierarchy | `newspaper-broadsheet` works well here, `zen-void` too sparse |

**Multiple component types in one page:** Use the most restrictive filter. A dashboard with forms = dashboard filter + form filter combined.

### Step 3 — Blocked Default Removal

Remove any style flagged in the Anti-Default Bias section. If the user explicitly named a blocked style, skip this step.

### Step 4 — Archetype + Tone Scoring (Explicit Rubric)

Score each remaining candidate on 5 signals. Use this rubric — do not "score mentally" or guess.

#### Signal A: Product Archetype Fit (weight: 35%)

| Score | Criteria |
|---|---|
| **5** | The style was designed for this exact domain (e.g. bloomberg-terminal for trading) |
| **4** | The style shares core visual properties with the domain (e.g. swiss-rationalism's precision fits accounting) |
| **3** | The style is neutral — it neither fits nor conflicts with the domain |
| **2** | The style is a stretch — it could work but requires significant adaptation |
| **1** | The style actively conflicts with the domain (e.g. psychedelic for healthcare) |

#### Signal B: Audience Alignment (weight: 25%)

| Score | Criteria |
|---|---|
| **5** | Style density matches audience exactly (dense for power users, sparse for casual) |
| **4** | Density is close — minor adjustment needed (e.g. slightly too sparse for a data-heavy user) |
| **3** | Density is neutral — could go either way |
| **2** | Significant density mismatch (sparse style for data-heavy audience) |
| **1** | Complete mismatch (zen-void for a Bloomberg-style power user) |

#### Signal C: Brand Archetype Match (weight: 20%)

| Score | Criteria |
|---|---|
| **5** | Style's typography, color, and motion perfectly match the detected archetype |
| **4** | Style matches on 2 of 3 dimensions (e.g. typography + color match, motion differs) |
| **3** | Style matches on 1 dimension only |
| **2** | Style conflicts on 2 dimensions — forced adaptation would feel inauthentic |
| **1** | Style conflicts on all dimensions — fundamentally wrong archetype |

#### Signal D: Tone Match (weight: 15%)

| Score | Criteria |
|---|---|
| **5** | Style's emotional register exactly matches the requested tone |
| **4** | Close match — style leans slightly warmer/colder/more serious/more playful than requested |
| **3** | Neutral — style doesn't strongly convey any tone |
| **2** | Noticeable mismatch — style feels wrong for the context |
| **1** | Extreme mismatch (playful-joyful for a law firm) |

#### Signal E: Content Density Fit (weight: 5%)

| Score | Criteria |
|---|---|
| **5** | Style's layout system perfectly accommodates the requested content types |
| **3** | Style can handle it with minor adaptation |
| **1** | Style fundamentally cannot render the requested content (e.g. no grid for tables) |

**Composite score** = (A × 0.35) + (B × 0.25) + (C × 0.20) + (D × 0.15) + (E × 0.05), scaled to 0-100.

Score on paper. Show the per-signal scores in the Design Reasoning Brief so the user can see the logic.

#### Few-shot taste anchors (FSPO, Sprint 05)

When prior `/variants`-picks exist for this project, the UserPromptSubmit hook `inject-taste-context.mjs` injects up to 8 **taste pairs** into `additionalContext` under the heading `## Prior variant picks`. Each pair records:

```
User previously picked <chosen style> when shown <chosen + rejected alternatives>
under context: "<brief summary>"
```

These pairs are selected by the diversity sampler (`hooks/scripts/lib/pair-sampler.mjs`, Task 15.4) using cosine distance over the 8-dimensional style embeddings in `skills/visionary/styles/_embeddings.json`. The sampler:

1. Computes each pair's signal vector as `embedding(chosen) − mean(embedding(rejected))`.
2. Picks the anchor pair with highest cosine similarity to the current brief vector.
3. Greedily adds pairs that maximise the minimum cosine distance to already-chosen pairs.
4. Stops at 8 or when the pool runs out. Mean pairwise distance on real data sits around 1.0 on the -1..1 cosine range — plenty of diversity for 8 slots.

**How to use the pairs in scoring:**

- Treat them as weak prior preference, not hard rules. A pair that picked `swiss-muller-brockmann` over `glassmorphism` in a fintech context should add ~5 points to `swiss-muller-brockmann`-adjacent candidates and subtract ~3 from `glassmorphism`-adjacent candidates when the current brief's context matches.
- Stack adjustments from multiple matching pairs — three pairs picking Swiss styles over glass styles is a stronger signal than one.
- Do not exceed ±15 cumulative adjustment from FSPO alone. The explicit facts in Step 4.5 carry more authoritative signal; FSPO is the soft prior that fills in gaps between facts.
- If a pair's context clearly does not match (different product archetype, different component type), ignore it — the sampler already biased toward relevant pairs but it does not guarantee fit.

FSPO pairs are written to `taste/pairs.jsonl` by `update-taste.mjs` when the user picks from a `/variants` output (phrases: "pick A", "go with B", "take #2", "variant C"). The `/variants` command writes a `last-variants-brief.json` snapshot that the pair-capture reads to identify chosen / rejected styles and context.

### Step 4.5 — Taste Profile Adjustment (Sprint 05 rewrite)

Read the active taste profile and apply structured score adjustments to each Step 4 candidate.

**Data source (current):** `taste/facts.jsonl` at the project root. One JSON object per line, conforming to `skills/visionary/schemas/taste-fact.schema.json`. A line = one `(scope, signal)` fact with evidence and a lifecycle flag (`active` / `permanent` / `decayed`).

**Data source (legacy, runtime-fallback only):** `system.md` at the project root. If `taste/facts.jsonl` does NOT exist but `system.md` does, an auto-migration runs on the next UserPromptSubmit hook tick — see `scripts/migrate-system-md-to-facts.mjs`. A migrated `system.md` starts with `<!-- MIGRATED ...` and is ignored at runtime.

The UserPromptSubmit hook `inject-taste-context.mjs` surfaces the filtered, scoped, ranked top-12 facts into the current prompt's `additionalContext` so you can consume them inline — you do not need to file-read `facts.jsonl` yourself. Match the injected entries to each candidate style by:

- `target_type == "style_id"` — exact match to the candidate's id
- `target_type == "category"` — the candidate's category equals the target value
- `target_type == "palette_tag"` — the candidate's frontmatter `palette_tags` array contains the target
- `target_type == "motion_tier"` — the candidate's motion tier equals the target
- `target_type == "typography_family"` — the candidate's declared display font family matches (case-insensitive substring)
- `target_type == "density_level"` — the candidate's density equals the target (`sparse` / `balanced` / `dense`)
- `target_type == "color"` — the candidate's palette contains the color (hex or name)
- `target_type == "pattern"` — soft match only (keyword overlap between candidate body / keywords and the target phrase)

**Adjustment table** (multiply the displayed base by `fact.confidence` except for the hard-block):

| Fact flag | Direction | Target match | Base adjustment |
|---|---|---|---|
| `permanent` | `avoid` | Exact (style_id / category) | **Remove from candidates entirely** (hard-block) |
| `permanent` | `avoid` | Axis match (palette / motion / typography / density) | -30 × confidence |
| `permanent` | `prefer` | Any match | +25 × confidence |
| `active` | `avoid` | Exact (style_id) | -25 × confidence |
| `active` | `avoid` | Axis match | -15 × confidence |
| `active` | `avoid` | `pattern` (keyword soft-match) | -10 × confidence |
| `active` | `prefer` | Exact / axis match | +15 × confidence |
| `active` | `prefer` | `pattern` | +8 × confidence |
| `decayed` | any | any | **Skip** (hidden from scoring until reactivated) |

Confidence is a number in `[0, 1]` stored on the fact. A brand-new heuristic signal starts at ~0.55–0.85; repeated evidence bumps it toward 1.0; decay halves it.

**Worked mini-example** — candidate `swiss-rationalism` in a project where the injected profile contains:

```
- avoid style_id::fintech-trust (conf 0.90, 2 evidence [permanent])
- prefer typography_family::grotesque (conf 0.75, 3 evidence)
```

`swiss-rationalism` is not `fintech-trust` → hard-block does not apply. Its display font is Grotesque → the prefer-typography_family fact matches → adjustment = +15 × 0.75 = **+11.25** added to the composite score.

**Scope filtering:** the hook only injects facts whose scope matches the current context (`level == "global"` OR `level == "project"` with the matching project key). Facts stored for other projects never leak. If you want to force-inject facts from a different scope for debugging, use `/visionary-taste show <scope>`.

**Why this replaced the 3-rejection binary flag:** the old system collapsed "disliked once" and "disliked three times" into the same downstream effect (nothing, then suddenly PERMANENTLY FLAGGED). The structured model lets confidence rise gradually, lets multiple evidence kinds count independently (git deletes + explicit rejections + pairwise passes accumulate), and lets positive signals boost scores with the same mechanism they suppress others — so the pipeline learns preferences, not just aversions.

### Step 5 — Context-Aware Transplantation Bonus (IMPROVED)

The flat +25% is replaced with a context-dependent bonus based on **shared properties** between the transplant style and the target domain.

#### Transplant Fit Score

Evaluate how many properties the transplant style shares with the target domain's needs:

| Shared property | Examples | Points |
|---|---|---|
| **Information hierarchy** | swiss-rationalism's grid → financial data hierarchy | +3 |
| **Trust/authority signal** | newspaper-broadsheet's editorial weight → legal credibility | +3 |
| **Density compatibility** | bauhaus grid → dashboard data density | +2 |
| **Emotional register match** | art-deco's luxury → premium fintech | +2 |
| **Typography fit** | serif-revival's authority → legaltech trust | +2 |
| **Color palette adaptability** | dieter-rams neutral palette → works in any domain | +1 |

**Sum the points → Transplant Fit Score (0-13+):**

| Fit Score | Bonus | Label |
|---|---|---|
| 8+ | +35% | Excellent transplant — strongly prefer over domain style |
| 5-7 | +25% | Good transplant — the standard cross-domain bonus |
| 3-4 | +15% | Acceptable transplant — slight preference over domain |
| 0-2 | +0% | Poor transplant — no bonus, style doesn't bridge well |

**Blocked transplantations** (never combine, regardless of score):
- Psychedelic + Healthcare (visual overload in clinical context)
- Anxiety/Urgency + Finance (triggers panic)
- Playful + Legal/GovTech (signals incompetence)
- Glitchcore + any context requiring data integrity (broken signals = untrustworthy)

### Step 6 — Variety Penalty (SESSION + CROSS-SESSION)

#### Within-session variety (same as before):
- **Same style reused**: -100 (never repeat in one session)
- **Same category reused**: -50
- **Same motion tier**: no penalty

#### Cross-session variety (NEW):

Read the `### Style history` section of `system.md`. Each entry has a date and style name.

| Recency | Penalty | Rationale |
|---|---|---|
| Used in last 24 hours | -40 | Too fresh — user literally just saw this |
| Used in last 3 days | -25 | Recent — prefer something different |
| Used in last 7 days | -10 | Mild discouragement |
| Used 7+ days ago | 0 | Enough time has passed — style is fresh again |

**Writing to style history:** After the final style is selected (Step 7), append an entry to `system.md`:
```
### Style history
- 2026-04-14: swiss-rationalism (fintech dashboard)
- 2026-04-12: newspaper-broadsheet (legal landing page)
```

If `system.md` does not exist, create it with the `### Style history` section only (do not create empty rejected/positive sections — those are created by update-taste.sh on first rejection).

### Step 7 — Weighted Random Selection (NEW)

**Do not always pick the highest-scoring candidate.** Instead, select randomly from the top 3, with weights proportional to their scores.

#### Weight calculation

Take the top 3 candidates after all adjustments. Normalize their scores to weights:

```
Candidate A: effective score 95  → weight = 95
Candidate B: effective score 88  → weight = 88
Candidate C: effective score 72  → weight = 72
Total = 255

Probability: A = 95/255 = 37%, B = 88/255 = 35%, C = 72/255 = 28%
```

**Selection method:** Pick a random number conceptually. With weights 37/35/28, each candidate has a realistic chance of being selected. The highest-scoring style wins most often, but not always.

**Why this matters:** If 100 users ask for "fintech dashboard", they should NOT all get swiss-rationalism. Some should get newspaper-broadsheet, some should get dieter-rams. This is what makes visionary-claude feel like a design partner, not a lookup table.

**Edge cases:**
- If only 1 candidate remains after filtering: pick it (no randomization needed)
- If only 2 candidates remain: weight between those 2
- If the score gap between #1 and #2 is > 30 points: skip randomization, pick #1 (the gap means the others are genuinely poor fits)

### Output: Top 3 Candidates + Selected Winner

Present in the Design Reasoning Brief:

```
Style Selection (showing work):
  #1: swiss-rationalism     — score: 95 (37% probability)  ← SELECTED
  #2: newspaper-broadsheet  — score: 88 (35% probability)
  #3: dieter-rams           — score: 72 (28% probability)

  Selected: swiss-rationalism
  Transplant: historical → fintech (+35% excellent fit)
  Why: "12-column mathematical grid communicates precision.
        Helvetica's neutrality builds trust without decoration."

  Taste profile: No rejections on file. No cross-session conflicts.
  Component compatibility: Dashboard — dense grid verified.
```

The user sees the probabilities and alternatives. If they dislike the selection, they can say "try #2 instead" — no need to re-run the algorithm.

### Worked Example (v2)

```
Request: "Bokföringssida för svenska företag, dashboard + fakturor"
Product type: Fintech / Accounting
Component types: Dashboard + Data table + Form
Locale: sv (å ä ö)

Step 1 — Categories:
  Domain: industry (fintech-trust, bloomberg-terminal, neobank)
  Transplant: historical (swiss-rationalism, bauhaus, art-deco, dieter-rams),
              hybrid (newspaper-broadsheet)

Step 2 — Motion tier: Financial data → Subtle only
  Removes: constructivism (Expressive), kinetic-type (Kinetic)

Step 2.5 — Component compatibility: Dashboard + Table + Form
  Removes: newspaper-broadsheet (columns break forms)
  Keeps: swiss-rationalism, bauhaus, dieter-rams, art-deco,
         fintech-trust, bloomberg-terminal

Step 3 — Blocked defaults:
  Removes: fintech-trust

Step 4 — Rubric scoring:
  swiss-rationalism:
    A (archetype fit): 4 × 0.35 = 1.40  (grid precision fits accounting)
    B (audience):      5 × 0.25 = 1.25  (dense, power-user compatible)
    C (brand match):   4 × 0.20 = 0.80  (Ruler archetype, close match)
    D (tone):          4 × 0.15 = 0.60  (serious, credible)
    E (density):       5 × 0.05 = 0.25  (grid handles tables perfectly)
    Composite: 4.30 × 20 = 86

  bauhaus:
    A: 3 × 0.35 = 1.05  (form-follows-function fits, primary colors stretch)
    B: 4 × 0.25 = 1.00  (grid-capable but less flexible)
    C: 3 × 0.20 = 0.60  (Ruler wants navy/gold, Bauhaus wants primaries)
    D: 3 × 0.15 = 0.45  (slightly too avant-garde for accounting)
    E: 4 × 0.05 = 0.20
    Composite: 3.30 × 20 = 66

  dieter-rams:
    A: 4 × 0.35 = 1.40  (invisible UI = let data speak)
    B: 4 × 0.25 = 1.00  (functional density)
    C: 4 × 0.20 = 0.80  (grey/beige is close to Ruler navy/gold)
    D: 4 × 0.15 = 0.60  (serious, no decoration)
    E: 3 × 0.05 = 0.15  (minimal — might under-serve dense dashboard)
    Composite: 3.95 × 20 = 79

  art-deco:
    A: 2 × 0.35 = 0.70  (luxury ≠ SME bookkeeping)
    B: 3 × 0.25 = 0.75
    C: 3 × 0.20 = 0.60
    D: 2 × 0.15 = 0.30  (too glamorous)
    E: 3 × 0.05 = 0.15
    Composite: 2.50 × 20 = 50

  bloomberg-terminal:
    A: 5 × 0.35 = 1.75  (designed for finance)
    B: 5 × 0.25 = 1.25  (maximum density)
    C: 2 × 0.20 = 0.40  (amber-on-black conflicts with Ruler navy/gold)
    D: 3 × 0.15 = 0.45
    E: 5 × 0.05 = 0.25
    Composite: 4.10 × 20 = 82 (but no transplant bonus — same domain)

Step 4.5 — Taste profile: system.md not found → skip

Step 5 — Transplantation bonus (context-aware):
  swiss-rationalism → fintech:
    Shared: information hierarchy (+3), trust signal (+3), density (+2), adaptable palette (+1) = 9
    Fit score 9 = Excellent → +35%
    86 × 1.35 = 116

  dieter-rams → fintech:
    Shared: trust signal (+3), density (+2), adaptable palette (+1) = 6
    Fit score 6 = Good → +25%
    79 × 1.25 = 99

  bauhaus → fintech:
    Shared: density (+2), adaptable palette (+1) = 3
    Fit score 3 = Acceptable → +15%
    66 × 1.15 = 76

  art-deco → fintech:
    Shared: authority signal (+2) = 2
    Fit score 2 = Poor → +0%
    50 × 1.0 = 50

  bloomberg-terminal (same domain → no bonus):
    82 × 1.0 = 82

Step 6 — Variety:
  Session: first generation → no session penalty
  Cross-session: system.md not found → no cross-session penalty

Step 7 — Weighted random selection (top 3):
  #1: swiss-rationalism  = 116 → weight 38%
  #2: dieter-rams        = 99  → weight 33%
  #3: bloomberg-terminal  = 82  → weight 27%

  Random selection: swiss-rationalism (38% chance)
  (Next time this exact prompt runs, dieter-rams or bloomberg-terminal might win instead)

RESULT:
  Selected: swiss-rationalism
  Runner-up: dieter-rams
  Also-ran: bloomberg-terminal
  Transplant: historical → fintech (Excellent fit, +35%)
  Component check: Dashboard + Table + Form — all compatible
  Locale: sv (å ä ö verified, latin-ext subset)
```

## 12 Brand Archetypes → Visual Tokens

| Archetype | Color tendency | Display font | Motion tier |
|-----------|---------------|--------------|-------------|
| Ruler | Navy, deep gold | DM Serif Display | Subtle |
| Sage | Deep blue, grey | Playfair Display | Subtle |
| Explorer | Earthy greens | Fraunces | Expressive |
| Creator | Warm orange | Bricolage Grotesque | Expressive |
| Innocent | Light, white | Manrope light | Subtle |
| Hero | Red/black | Syne wide | Expressive |
| Caregiver | Warm greens | Chillax | Subtle |
| Jester | Vibrant, unexpected | Cabinet Grotesk | Kinetic |
| Lover | Rich warm tones | Sentient | Expressive |
| Outlaw | High contrast, acid | Syne | Kinetic |
| Magician | Purple, teal | Space Grotesk | Expressive |
| Everyman | Neutral warm | Plus Jakarta Sans | Subtle |

## DNA Blend Ratio Rules

When blending two styles (primary + secondary):
- Ruler archetype → 90% primary style, 10% accent only
- Caregiver archetype → 80% calm style, 20% energy
- Outlaw archetype → 40% structure, 60% chaos
- All others → 70% primary / 30% secondary default

## Anti-Default Bias — Blocked Styles

The following styles are **BLOCKED as primary style** unless the user explicitly names them. They produce output indistinguishable from generic AI design tools. The algorithm removes them in Step 3.

| Blocked Style | Why Blocked | Transplant Alternatives |
|---|---|---|
| `fintech-trust` | Every AI tool's "dark fintech" | `newspaper-broadsheet`, `swiss-rationalism`, `dieter-rams`, `art-deco` |
| `saas-b2b-dashboard` | Generic sidebar+KPI+table | `bauhaus`, `swiss-rationalism`, `bento-grid`, `catalog-archive` |
| `dark-mode-first` + gradient text | Developer tool landing cliché | `constructivism`, `kinetic-type`, `bauhaus`, `terminal-cli` |
| `neobank-consumer` | Generic rounded-corner fintech | `art-deco`, `scandinavian-nordic`, `paper-editorial` |
| Generic "modern SaaS" (white + blue + Inter) | UI/UX Pro Max default output | Any of the 186 styles |

### Variety Tracking

**Within session:**
- **Same style**: -100 in Step 6 (never repeat)
- **Same category**: -50 in Step 6 (strongly discourage)

**Across sessions (via `system.md` → `### Style history`):**
- Last 24h: -40
- Last 3 days: -25
- Last 7 days: -10
- 7+ days ago: 0 (fresh again)

See Step 6 for full specification.

### Originality Floor

If the critique loop Originality score falls **below 6/10**:
1. Identify which blocked default pattern leaked through
2. Re-run Step 7 — pick the next candidate from the weighted pool
3. If all 3 candidates score below 6/10: escalate to the user with the top 3 and let them choose

## Style Taxonomy

Load `styles/_index.md` for the full 186-style lookup table. Do not hardcode style names here.
