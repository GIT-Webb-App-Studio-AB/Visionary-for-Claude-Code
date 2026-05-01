# Sprint 14 — Active Governance Hook: pre-commit + CI gate mot token-drift

**Vecka:** 25–26
**Fas:** 8 — Multi-page kvalitet (ny fas)
**Items:** 29 från roadmap (ny)
**Mål:** Förhindra att designtoken-drift smyger sig in i kodbasen mellan generations. När `/apply` har låst en stil och dess DTCG-tokens vill vi att efterföljande PRs **avvisas** om de inför färger/spacings/motion-värden som inte matchar locked tokens. Detta är den enda vägen att hålla multi-page-konsistens i AI-genererat arbete — och löser exakt det "verification tax"-problem konkurrenterna inte lyckas med.

Avgränsning: vi gör en strikt deterministisk drift-detektor (token-värde-matchning), inte en visuell. Visuell drift täcks redan av Sprint 11 (DINOv2-style-match). Här mäter vi *kod-nivå-drift*: ny komponent som använder `bg-blue-500` när locked palette inte har den blå.

## Scope

- Item 29 — Active Governance: token-drift-detektor + husky pre-commit + GitHub Action template + drift-rapport + tröskel-konfig + bypass-mekanism + visionary-stats integration.

## Pre-flight checklist

- [ ] Sprint 4 mergad — DTCG-token-export är stable
- [ ] `/apply` (Sprint 7) testad på minst 2 reella projekt så locked tokens-format är väletablerat
- [ ] Feature-branch: `feat/sprint-14-active-governance`

---

## Task 29.1 — Token-drift detector [L]

**Fil:** `hooks/scripts/lib/governance/drift-detect.mjs`

**Vad det mäter:** Skillnaden mellan tokens i ändrade filer (PR diff) vs locked tokens i `tokens/<style-id>.tokens.json`.

**Steg:**
1. Input: lista av ändrade filer (från `git diff --name-only HEAD~1`).
2. Per fil, extrahera color-, spacing-, motion-, typography-värden:
   - Tailwind-class scan (`bg-blue-500`, `p-4`, `duration-300`, `text-lg`).
   - Inline CSS scan (`color: #3B82F6`, `padding: 16px`).
   - JSX-prop scan (`<motion.div animate={{ duration: 0.3 }}>`).
3. Resolva mot Tailwind-config eller raw values → kanonisk form (alla → DTCG-format).
4. Jämför mot locked tokens. Klassificera:
   - **exact match**: värdet finns i locked tokens → OK
   - **near match**: inom 5 % numerisk tolerans (för spacing, duration) → warning
   - **drift**: inget motsvarande i locked tokens → drift
5. Returnera `{ ok, warnings: [...], drifts: [...] }`.

**AC:**
- Test: ändrad fil använder bara locked tokens → ok=true
- Test: ändrad fil inför `bg-cyan-400` när locked palette är oxblood/forest → drift
- Test: spacing-värde på 17 px när token är 16 px → warning (5 % off)

---

## Task 29.2 — husky pre-commit hook [M]

**Fil:** `.husky/pre-commit` (ny), `scripts/governance-check.mjs`

**Steg:**
1. Lägg till husky som dev-dep (om inte redan installerat).
2. Hook-script kör `node scripts/governance-check.mjs --staged`.
3. Vid `drifts.length > threshold` → exit 1 med tydlig output:
   ```
   ✗ Token drift detected (3 drifts, threshold: 0)

   src/components/Card.tsx:
     line 12: 'bg-cyan-400' is not in locked palette
     suggested: 'bg-oxblood-500' or 'bg-paper-100'

   Pass --no-verify to bypass (not recommended).
   ```
4. Vid bara warnings: exit 0, men printa varning-summary.

**AC:**
- Hook installeras vid `npm install`
- Test: pre-commit blockerar drift, släpper igenom rena commits
- `--no-verify` fungerar som dokumenterad bypass

---

## Task 29.3 — GitHub Action template [M]

**Fil:** `.github/workflows/visionary-governance.yml` (ny), `docs/governance-ci.md`

**Workflow:**
```yaml
name: Visionary Governance
on: [pull_request]
jobs:
  check-drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: '18' }
      - run: npm ci
      - run: node scripts/governance-check.mjs --base ${{ github.event.pull_request.base.sha }}
```

**Steg:**
1. Skriv workflow-fil.
2. Script-mode `--base <sha>` jämför PR mot base.
3. Output renderar i PR som kommentar via `gh pr comment` (om GH_TOKEN tillgänglig).
4. Inkludera GitLab CI-template som secondary file.

**AC:**
- Workflow körs på PR
- Drift-rapport postas som PR-kommentar (om token finns)
- Fallback: workflow failar med exit code utan kommentar

---

## Task 29.4 — Drift-rapport (mänskligt läsbar) [M]

**Fil:** `hooks/scripts/lib/governance/report.mjs`

**Format:**
```
Token Drift Report
==================
Locked style: oxblood-editorial
Locked tokens: tokens/oxblood-editorial.tokens.json

3 drifts in 2 files:

  src/components/Card.tsx
    Line 12: color value '#06B6D4' (cyan-500)
      → Not in locked palette
      → Closest match: '#7C2D12' (oxblood-700, ΔE 8.2)

  src/components/Hero.tsx
    Line 28: spacing value '24px'
      → Not in locked spacing scale [4, 8, 16, 32, 64]
      → Suggestion: '16px' or '32px'
    Line 41: duration value '0.4s'
      → Locked motion durations: [120, 240, 480]ms
      → Suggestion: '0.48s' (=480ms)
```

**AC:**
- Rapport-format renderar för 3 drift-typer (color, spacing, duration)
- "Closest match" är ΔE-baserad för colors, närmsta-skala för spacing/duration

---

## Task 29.5 — Drift-tröskel: warn vs block [S]

**Fil:** `tokens/<style-id>.tokens.json` (utöka), `hooks/scripts/lib/governance/threshold.mjs`

**Konfig per locked style:**
```json
{
  "$visionary": {
    "governance": {
      "drift_threshold": "block",  // "warn" | "block" | "off"
      "near_match_tolerance": 0.05,
      "allowed_drifts": ["spacing.gap.legacy"]  // eskaperade tokens
    }
  }
}
```

**Steg:**
1. Lägg `$visionary.governance` i token-schema.
2. Threshold-modulen läser config, defaultar till `block`.
3. `allowed_drifts` är glob-pattern över token-paths (för legacy-kod-undantag).

**AC:**
- Threshold-config respekteras
- Allowed-drifts-pattern fungerar
- Default `block` för nya projekt

---

## Task 29.6 — visionary-stats integration [S]

**Fil:** `scripts/visionary-stats.mjs`

**Nytt CLI-kommando:**
```bash
node scripts/visionary-stats.mjs --governance-report [--days 30]
```

**Output:**
```
Governance report — last 30 days
  Total commits scanned: 142
  Drift-blocked commits: 8 (5.6%)
  Top drift-tokens:
    - bg-cyan-400 (4 occurrences, all blocked)
    - duration-200 (3 occurrences, allowed via tolerance)
    - text-blue-500 (2 occurrences, all blocked)
  Bypass rate (--no-verify): 1.4% (2 commits)
```

**AC:**
- Rapport baseras på trace-entries från governance-check
- `--days N` filtrerar tidsfönster
- Bypass-rate spårad

---

## Task 29.7 — Bypass-mekanism (emergency) [S]

**Fil:** `docs/governance-bypass.md`

**Tre nivåer av bypass:**
1. **Per-commit**: `git commit --no-verify` (standard husky-bypass)
2. **Per-fil**: `// visionary-governance: ignore` magic comment
3. **Per-token (legacy)**: `allowed_drifts` i token-fil (Task 29.5)

**Steg:**
1. Magic-comment-parser: skip drift-check inom 5 rader efter kommentaren.
2. Logga varje bypass till trace med skäl/`reason` när möjligt.
3. CI-rapport flagga: hög bypass-rate (>10 %) → öppna issue automatiskt.

**AC:**
- Alla tre bypass-vägar fungerar
- Bypass-rate trackad
- Doc förklarar när vilken bypass är lämplig

---

## Task 29.8 — Tester [M]

**Fil:** `hooks/scripts/lib/governance/__tests__/*.test.mjs`

**Coverage:**
- Drift-detect: 10 fixturer (color, spacing, motion, typography, edge-cases)
- Threshold: warn vs block scenarios
- Report-rendering: alla 3 drift-typer
- Bypass: alla 3 vägar
- husky-hook: simulera staged files, verifiera exit-code

**AC:**
- `node --test` grön
- Coverage ≥ 80 % på `lib/governance/`

---

## Task 29.9 — Dokumentation [S]

**Fil:** `docs/active-governance.md` (ny), `README.md` (sektion)

**Innehåll:**
- Vad governance gör (och inte gör)
- Hur man aktiverar i nytt projekt
- Threshold-konfig per locked style
- Bypass-strategier
- Feedback-loop: när governance fångar drift → rekommendera `/visionary-apply` re-run

**AC:**
- Doc reviewed
- Onboarding-walkthrough fungerar på fresh projekt

---

## Benchmark-verifiering

**Fil:** `results/sprint-14-governance.md`

**Mätningar:**
- 50 simulerade PRs (mix av rena + drift): false-positive-rate, false-negative-rate
- Pre-commit-hook latency (förvänta < 2 s för normalstor PR)
- CI-action-latency (förvänta < 30 s)

**AC:**
- Rapport publicerad
- FP-rate < 5 %, FN-rate < 10 %

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| Tailwind-class-extraktion missar dynamic strings (`cn(\`bg-${color}\`)`) | Hög | Medel | Dokumentera begränsning, magic-comment för dynamiska fall |
| husky bryter på Windows | Medel | Hög | Test på Windows + macOS + Linux i CI; dokumentera workaround |
| Drift-rapport för pratig på stora PRs | Medel | Låg | Cap rapport till topp-20 drifts + summary |
| Locked tokens ändras under sprint → all kod är drift | Hög | Medel | "Re-baseline" command: `node scripts/governance-rebase.mjs` |
| Bypass-rate triviallt hög (devs lär sig `--no-verify`) | Medel | Hög | Bypass-dashboard via `visionary-stats`; PR-comment-namnger bypassers |

---

## Definition of Done

- [ ] Alla tasks (29.1–29.9) klara
- [ ] husky pre-commit hook installerad och testad
- [ ] GitHub Action template fungerar på reell test-PR
- [ ] Threshold-config respekteras
- [ ] Alla tre bypass-mekanismer fungerar
- [ ] FP-rate < 5 % på simulerade PRs
- [ ] `results/sprint-14-governance.md` publicerad
- [ ] Mergad till `main`

## Amendments

_Tomt._
