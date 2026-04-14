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

## Style Selection Algorithm (v2)

The 186-style catalogue is too large to evaluate manually. This 8-step funnel narrows the field systematically, with controlled randomness to ensure no two users get identical output for the same prompt.

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

### Step 4.5 — Taste Profile Adjustment (NEW)

Read `system.md` (if it exists in the project root or `.visionary-cache/`). Apply adjustments to the Step 4 composite score:

| Taste signal in system.md | Score adjustment |
|---|---|
| **Rejected style** (exact match) | -100 (remove from candidates entirely) |
| **Rejected category** (style is in a rejected category) | -25 |
| **Rejected typography** (style uses a rejected font) | -15 |
| **Rejected color** (style's palette overlaps a rejected color) | -10 |
| **Positive signal** (style matches an approved direction) | +15 |
| **PERMANENTLY FLAGGED** (3+ rejections) | -100 (treat as blocked default) |

If `system.md` does not exist, skip this step entirely — do not create it.

**Reading system.md:**
```
Look for these sections:
  ### Rejected styles        → exact style name matches
  ### Rejected typography    → font name matches
  ### Rejected colors        → hex or color name matches
  ### Rejected motion        → motion pattern matches
  ### Positive signals       → direction/style matches
  ### Design DNA (confirmed) → strong positive matches (+20)
```

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
