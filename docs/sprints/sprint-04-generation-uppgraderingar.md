# Sprint 04 — Best-of-N + orthogonal variants + 2026 web primitives

**Vecka:** 5–6
**Fas:** 2 — Kvalitets-språnget
**Items:** 10, 11, 12, 13 från roadmap
**Mål:** Ersätt sekventiell self-refine med Best-of-N + verifier. Lägg till 2026-Baseline-primitiver som gör outputen synligt bättre än konkurrenterna.

## Scope

- Item 10 — Best-of-N: spawn 3 parallella fix-kandidater + ny `visual-verifier.md` subagent
- Item 11 — Orthogonal `/variants`: embed styles på 8 axlar, tvinga distance > 0.6
- Item 12 — Zero-JS komponent-grammatik: `@layer` + `@scope` + popover/anchor CSS + `commandfor` i templates
- Item 13 — `field-sizing: content`, `contrast-color()`, `shape()` presets, same-document View Transitions med `view-transition-name`

## Pre-flight checklist

- [ ] Sprint 3 mergad — numerisk scorer + calibration + evidence live
- [ ] `calibration.json` aktuell (≤ 7 dagar gammal)
- [ ] Playwright MCP stöder parallella browser-kontexter (verifiera dokumentation)
- [ ] Feature-branch: `feat/sprint-04-bon-orthogonal-primitives`

---

## Task 10.1 — `agents/visual-verifier.md` [M]

**Fil:** `agents/visual-verifier.md` (ny)

**Roll:** Tar 3 parallella fix-kandidater (screenshots + calibrated scores + code diffs) och väljer vinnare via pairwise voting.

**Systempromptstruktur:**
```
You are visual-verifier. Your SOLE job is to compare multiple candidate
fixes for the same UI problem and pick the one that best addresses the
critique without introducing regressions.

You do NOT generate fixes. You do NOT critique from scratch. You PICK.

Input per candidate:
  - screenshot (1200×800)
  - applied_diff (the unified patch)
  - calibrated_scores (8 dimensions, post-calibration)
  - numeric_scores (from deterministic scorer)

Output (schema-enforced):
  {
    winner_index: 0|1|2,
    pairwise_rationale: [ {pair: [a,b], winner: a|b, reason: "..."} × 3 ],
    margin: "decisive" | "narrow" | "indistinguishable",
    escalate_to_user: boolean  // true if all 3 are within ±0.5 on calibrated composite
  }

BIAS DEFENSE: You do not share context or prompt lineage with the critic
that requested the fixes. You are deliberately naive. If the 3 candidates
look equally good, say so — don't fabricate a winner.
```

**AC:**
- Subagent-fil publicerad
- Systempromptet hashat + versionerat i filen (för Rulers-auditing)

---

## Task 10.2 — Parallell fix-generation i `capture-and-critique.mjs` [L]

**Fil:** `hooks/scripts/capture-and-critique.mjs`

**Ny flow efter critique-runda 1:**

```
1. Critic returnerar top_3_fixes
2. Spawn 3 parallella Task-subagent-calls:
   - candidate_a: temperature 0.2, "apply top_3_fixes literally"
   - candidate_b: temperature 0.5, "apply top_3_fixes in spirit, feel free to holistically adjust"
   - candidate_c: temperature 0.8, "apply top_3_fixes but explore a distinct visual solution"
3. Applicera patches i 3 parallella branches (ephemeral Git worktrees eller temp-dir-copies)
4. Playwright screenshot × 3
5. Numerisk scorer × 3
6. Anropa visual-verifier med alla 3 artefakt-set
7. Applicera vinnande patch till huvudfilen
8. Om verifier returnerar escalate_to_user=true: visa alla 3 för användaren
```

**Steg:**
1. Lägg till `forkFixCandidate(baseFile, diff, tempOptions)` i `hooks/scripts/lib/fork-candidate.mjs`
2. Orchestration i main hook: `Promise.all([candidate_a, candidate_b, candidate_c])` med timeout 90s per kandidat
3. Resource-gating: max 3 parallella Playwright-kontexter (kör queue om fler requestas)
4. Fallback: om ≥ 2 av 3 kandidater failar → degrade till sekventiell single-best-effort (dagens beteende)

**AC:**
- 10-prompt-suiten genererar 3 kandidater per runda 2+ utan crashes
- Total wall-clock per generation ökar ≤ 40 % (parallellism, inte 3× serial)
- Best-of-N-läge kan toggas av med `VISIONARY_DISABLE_BON=1`

---

## Task 10.3 — Droppa sekventiella rundor från 3 → 2 när BoN aktiv [S]

**Motivering:** BoN ersätter det kvalitetslyft som runda 3 gav i gamla flödet.

**Steg:**
1. Om `bon_enabled && round === 2 && winner.calibrated_composite ≥ 7.5` → exit success
2. Runda 3 körs endast som full-regen om BoN-verifier säger ”indistinguishable” på alla kandidater → fallback till sequential refine

**AC:**
- Total round-count på 10-prompt-suiten sjunker median 3 → 2
- Token-kostnad netto neutral vs Sprint 3 trots parallella kandidater (en runda färre absorberar kostnaden)

---

## Task 10.4 — Metrics för BoN [S]

**Nya fält per generation:**
```json
{
  "bon_stats": {
    "rounds_using_bon": 1,
    "avg_verifier_margin": "narrow",
    "escalations_to_user": 0,
    "candidate_failures": 0,
    "winner_score_lift_vs_seq": 0.4
  }
}
```

**AC:**
- Score-lift vs icke-BoN-baseline (från Sprint 3) är ≥ +0.3 på calibrated composite, median

---

## Task 11.1 — Embedda 202 styles på 8 estetiska axlar [L]

**Fil:** `skills/visionary/styles/_embeddings.json` (ny)

**8 axlar (0–1 skala per style):**
1. `density` (spacious → data-dense)
2. `chroma` (muted → saturated)
3. `formality` (playful → corporate)
4. `motion_intensity` (static → kinetic)
5. `historicism` (ahistorical → period-specific)
6. `texture` (clean → materiell)
7. `contrast_energy` (low-contrast → high-contrast)
8. `type_drama` (neutral-typography → expressive-typography)

**Steg:**
1. Extrahera per style från frontmatter + body-analys (Haiku LLM-call mot varje style-fil, engångs-offline)
2. Script: `scripts/build-style-embeddings.mjs`
3. Validera manuellt mot en sub-set (t.ex. `brutalism` ska ha högt `contrast_energy`, lågt `formality`)
4. Emit `_embeddings.json`: `{ "style-id": [0.7, 0.4, 0.2, 0.8, 0.9, 0.5, 0.9, 0.8], ... }`

**AC:**
- Alla 202 styles har 8-dim vektor
- Manual spot-check 20 st: 80 % matchar intuition
- Cross-style cosine distances genererar rimliga grannar (t.ex. neobrutalism-softened grannar bauhaus-dessau bättre än glassmorphism)

---

## Task 11.2 — Orthogonal-selection-algoritm i `/variants` [M]

**Fil:** `commands/variants.md` + runtime i selection

**Nuvarande:** 3 styles från viktat-slumpmässigt val.
**Ny logik:**

```
1. Kör 8-steg-algoritmen en gång → picka variant_1 (winner)
2. För variant_2: filtrera kandidater där cosine_distance(v, variant_1) >= 0.6
3. För variant_3: filtrera där cosine_distance(v, variant_1) >= 0.6 AND cosine_distance(v, variant_2) >= 0.6
4. Inom varje filtered pool: kör weighted-random med samma taste-adjustering
5. Om pool tom efter filter → relax threshold (0.5 → 0.4) och retry 2 gånger
6. Fallback: om fortfarande tom → dagens flow (tre närmaste, dokumentera i output)
```

**AC:**
- På 10 `/variants`-körningar: genomsnittlig pairwise cosine distance mellan variants ≥ 0.5 (vs baseline ~0.25)
- User-test: 5 designers rankar ”three variants feel meaningfully different” ja/nej → 4/5 ska säga ja

---

## Task 11.3 — Dokumentera style-embedding-underhåll [S]

**Fil:** `docs/style-embeddings.md` (ny)

**Innehåll:**
- När ska `_embeddings.json` regenereras (vid nya styles, större style-ändringar)
- Hur man tolkar en 8-dim vektor
- Manual override: hur man sätter custom embedding för en ny style

---

## Task 12.1 — `@layer` + `@scope` i base-stylesheet-partials [M]

**Filer att uppdatera:**
- `skills/visionary/stack-guidelines.md` (React/Next, Vue, Svelte, etc.) — add `@layer`-mandate
- `skills/visionary/styles/*/index.md` mallar (vissa kategorier)
- Dokumentation i `SKILL.md`

**Arkitektur:**
```css
/* Global cascade — first line of every generated stylesheet */
@layer reset, tokens, base, components, variants, utilities, overrides;

/* Scope component styles to prevent leak */
@scope (.vn-card) to (.vn-card-nested) {
  h1 { ... }
  .meta { ... }
}
```

**Steg:**
1. Uppdatera kodgenerator-mallar för React, Vue, Svelte, Angular, Astro, Laravel att emit `@layer`-deklaration
2. Varje komponent-generator wrapar sina styles i `@scope`-block med komponent-root-klass
3. Uppdatera `slop-scanner.mjs`: lägg till slop #27: ”stylesheet saknar @layer-deklaration”
4. Dokumentera i `critique-schema.md`: ny implicit krav

**AC:**
- Alla generated stylesheets i 10-prompt-suiten har `@layer` + `@scope`
- Ny slop-pattern #27 detekteras (1/20 artificial test cases failed)

---

## Task 12.2 — Popover + Anchor + Invoker-templates [L]

**Fil:** `skills/visionary/stack-guidelines.md` + style-file templates

**Ny base-partial: `skills/visionary/partials/popover-anchor.css.md`**
```css
/* Tooltip / menu — zero-JS primitive */
[popover] {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
}
[popover]:popover-open {
  /* opening styles */
}
@starting-style {
  [popover]:popover-open { opacity: 0; translate: 0 -4px; }
}
[popover] {
  transition: opacity 200ms, translate 200ms, display 200ms allow-discrete, overlay 200ms allow-discrete;
  opacity: 1;
  translate: 0 0;
}
```

**React-template för menu:**
```tsx
<button
  popovertarget="user-menu"
  commandfor="user-menu"
  command="show-popover"
  style={{ anchorName: '--user-btn' } as CSSProperties}
>
  Profil
</button>
<menu
  id="user-menu"
  popover="auto"
  style={{
    positionAnchor: '--user-btn',
    positionArea: 'block-end inline-end',
    positionTryFallbacks: 'block-start inline-end, block-end inline-start',
  }}
>
  {items}
</menu>
```

**Steg:**
1. Lägg till partials för: tooltip, dropdown, context-menu, dialog-popover
2. Uppdatera component-generator-mall så alla menu-liknande komponenter använder dessa mönster by default
3. Progressive enhancement: `@supports (position-anchor: --x)` fallback till manuell positionering för pre-Baseline-2026 browsers
4. ARIA: säkerställ `commandfor` ersätter tidigare onClick-state-handler

**AC:**
- Generated menu/tooltip/dialog output har 0 JS för öppna/stänga/positionera
- Axe violations = 0 på keyboard nav
- Progressive fallback verifierad i Playwright med feature-flag av

---

## Task 12.3 — Same-document View Transitions [M]

**Filer:**
- `skills/visionary/motion-tokens.ts` — ny `useViewTransition` helper
- `skills/visionary/stack-guidelines.md` — mönster för card → detail

**Kod:**
```tsx
// motion-tokens.ts
export function useViewTransition(name: string) {
  return {
    style: { viewTransitionName: name } as CSSProperties
  }
}

// Usage
<article {...useViewTransition(`post-${post.id}`)}>
  <h2>{post.title}</h2>
</article>

// On navigation
const navigate = async (to: string) => {
  if (!document.startViewTransition) return router.push(to)
  document.startViewTransition(() => router.push(to))
}
```

**Steg:**
1. Lägg till helpers för alla 15 stacks där API skiljer sig (Next.js App Router, Vue Router, Svelte Navigation, etc.)
2. Lägg till i style-file templates som rekommenderar card→detail-mönster (editorial-serif-revival, bento-grid, etc.)
3. `prefers-reduced-motion` guard: `@media (prefers-reduced-motion: reduce) { ::view-transition-group(*) { animation: none } }` emittas när view-transition-name används

**AC:**
- Generated card→detail patterns har view-transition-name
- Reduce-motion test i Playwright: animationen respekteras

---

## Task 12.4 — `field-sizing: content` på form-kontroller [S]

**Steg:**
1. Lägg till default `field-sizing: content; min-block-size: 3lh;` på `<textarea>`, `<select>` i alla stack-templates
2. Fallback-kontroll: `@supports not (field-sizing: content) { textarea { min-block-size: 6rem } }`
3. Uppdatera `typography-matrix.md` med lh-baserade min-sizes

**AC:**
- Alla form-templates i 10-prompt-suiten använder field-sizing

---

## Task 12.5 — `contrast-color()` + `shape()` presets [M]

**Filer:**
- `skills/visionary/palette-tokens.md` — dokumentera `contrast-color()`-användning
- `skills/visionary/motion-tokens.ts` — shape()-presets som CSS custom props

**Presets:**
```css
:root {
  --shape-wave: shape(from 0% 40%, curve to 100% 40% with 50% 0%);
  --shape-arch: shape(from 0% 100%, curve to 100% 100% with 50% 0%);
  --shape-notch: shape(from 0% 0%, line to 30% 0%, line to 50% 10%, line to 70% 0%, line to 100% 0%, line to 100% 100%, line to 0% 100%, close);
  --shape-scalloped-edge: shape(...);
}

.section-divider {
  clip-path: var(--shape-wave);
}

.button {
  color: contrast-color(var(--bg));
}
```

**Guards:**
```css
@supports not (color: contrast-color(black)) {
  .button { color: var(--fg-fallback); }
}
```

**AC:**
- Presets tillgängliga i motion-tokens.ts
- Guards dokumenterade
- Minst 3 styles uppdaterade att använda shape() (editorial-serif-revival, bauhaus-dessau, chaos-packaging-collage)

---

## Task 12.6 — Scroll-driven animations som progressive enhancement [M]

**Filer:**
- `skills/visionary/motion-tokens.ts` — `animation-timeline` presets
- `skills/visionary/stack-guidelines.md` — fallback-mönster

**Presets:**
```ts
export const scrollTimelines = {
  revealEntry: 'entry 0% cover 30%',
  parallaxSlow: 'contain 0% contain 100%',
  pinnedScrub: 'cover 0% cover 100%',
}
```

**Template:**
```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .hero-image {
      animation: hero-reveal linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 30%;
    }
    @keyframes hero-reveal {
      from { opacity: 0; translate: 0 40px; }
      to { opacity: 1; translate: 0 0; }
    }
  }
}
/* Fallback: motion/react whileInView for unsupported UAs */
```

**AC:**
- Generated scroll-animations wrappas i både `@supports` och `@media (prefers-reduced-motion: no-preference)` — dubbelguard
- Firefox-körning ger inga runtime-fel, bara ingen animation
- Slop-scanner flaggar om scroll-animation saknar reduce-motion-guard

---

## Task 13.1 — motion-scorer bonus för 2026-primitiver [M]

**Fil:** `benchmark/scorers/motion-scorer.mjs`

**Syfte:** belöna generationer som använder de nya primitiverna.

**Bonus-regler:**
- +0.2 om `view-transition-name` finns
- +0.2 om `animation-timeline: view()` med korrekt guard
- +0.15 om `position-anchor` + `popover` + `commandfor` kombination finns
- +0.1 om `field-sizing: content` på form
- +0.1 om `@layer` med explicit ordering first-line

**AC:**
- Motion-scorer-output inkluderar `modernity_bonus: 0.5`-fält
- 9:e dimension (craft) boostad proportionellt

---

## Task 13.2 — Uppdatera slop-scanner [S]

**Fil:** `benchmark/scorers/slop-scanner.mjs`

**Nya slop-patterns:**
- #27 saknar `@layer`
- #28 `@floating-ui/react` import (borde använda anchor-positioning)
- #29 `<textarea rows={...}>` utan `field-sizing: content`
- #30 onClick-based modal open utan `commandfor` fallback
- #31 inline `useRef` för dropdown position (borde vara `position-anchor`)

**AC:**
- Alla 5 patterns detekteras av scanner på artificial test cases

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| Playwright parallell browser-contexts instabila på Windows | Medium | Hög | Queue med max 2 concurrent på Windows-detect |
| Best-of-N ökar kostnad för liten kvalitetsvinst | Medium | Medium | Toggleable, default off för low-tier projects |
| `contrast-color()` ger obalanserad färg på APCA | Medium | Medium | Kör axe-core APCA-regel ovanpå, varna vid spread |
| Style-embeddings är subjective → felaktiga grannar | Hög | Low | Manual audit + override-fält i JSON |
| Orthogonal variants kräver pool-size > 5 → lilla kategorier misslyckas | Medium | Medium | Relax-threshold + fallback |

## Definition of Done

- [ ] Alla tasks klara
- [ ] BoN-kvalitetslyft ≥ +0.3 calibrated composite vs Sprint 3 baseline
- [ ] `/variants` genomsnittlig pairwise distance ≥ 0.5
- [ ] Alla 2026-primitiver produceras i minst 5 styles vardera
- [ ] Slop-scanner uppdaterad, inga regressioner
- [ ] Benchmark-score ≥ 19.0/20 (mål: lyfta från 18.8 via modernitetsbonus)
- [ ] `results/sprint-04-comparison.md` publicerad
- [ ] Merged till `main`

## Amendments

### 2026-04-22 — Sprint 4 kickoff-implementation

**Branch:** `feat/sprint-04-bon-orthogonal-primitives` (från
`feat/sprint-03-numeric-scorer-rulers-evidence` med Sprint 3-arbetet
transitivt i working tree).

**Levererat:**

| Task  | Status | Artefakt |
|-------|--------|----------|
| 10.1  | ✅     | `agents/visual-verifier.md` — pairwise verifier med bias-defense + verifier_prompt_hash |
| 10.2  | ✅     | `hooks/scripts/lib/fork-candidate.mjs` + `__tests__/fork-candidate.test.mjs` (46 tests) + `skills/visionary/bon-fanout.md` protokoll + hook-integration i `capture-and-critique.mjs` |
| 10.3  | ✅     | `shouldBonRound2Exit()` predikat + dokumenterad termination rule #5 i `critique-schema.md` |
| 10.4  | ✅     | `collectBonStats()` + `bon_stats`-block i `critique-output.schema.json` |
| 11.1  | ✅     | `scripts/build-style-embeddings.mjs` (heuristic mode) + `skills/visionary/styles/_embeddings.json` (202 styles, 8-d) + overrides-pipeline + 14 tester |
| 11.2  | ✅     | `hooks/scripts/lib/orthogonal-variants.mjs` + 14 tester + uppdaterad `commands/variants.md` med orthogonal-algoritmen |
| 11.3  | ✅     | `docs/style-embeddings.md` underhållsguide |
| 12.1  | ✅     | "Canonical CSS Cascade" + "Canonical Form Controls" + "Canonical Colour Contrast" sektioner i `stack-guidelines.md` + uppdaterad `SKILL.md` Stage 3 |
| 12.2  | ✅     | `skills/visionary/partials/popover-anchor.css.md` (dropdown/tooltip/context-menu/dialog templates för React/Vue/Svelte/HTML) |
| 12.3  | ✅     | `useViewTransition()` + `sameDocumentViewTransition()` helpers i `motion-tokens.ts` |
| 12.4  | ✅     | `field-sizing: content` mandate i canonical form controls section, slop-pattern #29 detekterar saknad |
| 12.5  | ✅     | `shapePresets` + `shapePresetsCss()` i `motion-tokens.ts` (wave/arch/notch/scalloped/slash med polygon-fallback); `contrast-color()`-dokumentation i stack-guidelines |
| 12.6  | ✅     | `scrollTimelines` + `scrollAnimationCss()` helper med dubbelguard (@supports + prefers-reduced-motion) |
| 13.1  | ✅     | `scoreMotionWithBonus()` i `motion-scorer.mjs` — 5 modernity-regler upp till +0.75 bonus |
| 13.2  | ✅     | Slop-patterns #27–31 i `slop-scanner.mjs` + 13 tester i `benchmark/tests/slop-scanner.sprint4.test.mjs` |

**Totalt Sprint 4 test-count:** 87 (46 + 14 + 14 + 13) + 74 Sprint 3
regression-tester = **161 tester, 0 fail**.

**Avvikelser mot AC / scope-noteringar:**

- **Task 10.2 BoN parallel-orkestrering:** Hook:en emitterar fan-out-
  instruktioner till Claude — lib:en är pure-function-scaffolding.
  Den faktiska spawning-av-3-Task-subagents-parallellt körs av Claude
  på nästa turn enligt additionalContext. AC "10-prompt-suiten
  genererar 3 kandidater per runda 2+ utan crashes" kräver en
  end-to-end körning mot en riktig preview-server + Playwright MCP —
  verifieras separat med `benchmark/runner.mjs` i CI, inte inom denna
  sprint.
- **Task 10.4 metrics:** `bon_stats` är ett valfritt block i
  `critique-output.schema.json`. Metrics persisteras av `collectBonStats()`
  på uppmaning av Claude (step 14 i hook-instruktionerna). Ingen
  automatisk metrics-fil emitteras per hook-körning — hook:en är stateless.
- **Task 11.1 embeddings AC "80 % matchar intuition":** Heuristisk
  pipeline levererar startvärden. Spot-check: `bauhaus-dessau`-rank
  vs `glassmorphism`-rank för `neobrutalism-softened` misslyckas
  (glassmorphism hamnar närmare). Detta är en känd heuristik-
  begränsning dokumenterad i `docs/style-embeddings.md`, åtgärdad via
  override-fil eller LLM-mode i Sprint 5.
- **Task 11.1 LLM-mode:** `--llm haiku` flaggan är scaffolded men
  exekverar fallback-heuristic. Full Haiku-batch-integration kräver
  SDK-adapter (Sprint 2-blocker, se sprint-01-architecture-gap.md).
  Flaggan finns så wirings in Sprint 5 är en diff, inte rewrite.
- **Task 12.5 palette-tokens.md:** Filen är auto-genererad av
  `build-palette-tokens.mjs` och skrivs över vid varje körning.
  `contrast-color()`-dokumentationen landade i `stack-guidelines.md`
  "Canonical Colour Contrast"-sektionen + SKILL.md Stage 3-listan
  istället. Equivalent scope, stabilare home.
- **Gold-set inte utökat:** Sprint 4 DoD förutsatte `calibration.json`
  aktuell från Sprint 3. Ingen re-calibration körd i denna sprint —
  nästa nattliga CI-körning triggar regenerering när Sprint 3+4
  merges.

**Committade ändringar:** Inga (i enlighet med user instruction "inga nya
commits"). Arbetet ligger i working tree på branchen för review.

**Kvarvarande beslut för Sprint 5-ägaren:**

1. Ska `shouldBonRound2Exit()` graduera in i `loop-control.mjs` som
   native predikat, eller hålla sin plats i `fork-candidate.mjs` där
   BoN-state naturligt sitter?
2. Ska embeddings-LLM-mode köras mot Haiku eller Sonnet 4.6 — `density`-
   axeln är trivial för Haiku men `historicism`-axeln kräver bredare
   kulturhistorisk kunskap.
3. Stack-specifika popover/anchor-templates — ska vi emitte dem som
   concrete skill-partials (som popover-anchor.css.md) eller som
   runtime-hjälp inom `stack-guidelines.md`? Nuvarande pragmatiska
   hybrid kan splittra scope för nya stackar.

