# End-to-End Test Scenarios

5 acceptance tests that must all pass before visionary-claude ships.

**Setup:**
```bash
# Load plugin in a test project
claude --plugin-dir ./visionary-claude

# For framework detection tests (Scenario 4): use a Next.js 15 project
cd /path/to/nextjs-15-project
claude --plugin-dir /path/to/visionary-claude

# Playwright must be installed
npx playwright install
```

---

## Scenario 1: Basic Inference Test

**Goal:** Context inference correctly maps prompt signals to a design style.

**Steps:**

1. Open Claude Code in any project with the plugin loaded
2. Enter the prompt:
   ```
   Login page for a fintech app
   ```
3. Observe the Design Reasoning Brief output

**Expected output (values may vary — all 5 signals must appear):**

```
Design Reasoning Brief
─────────────────────
Product type:    B2B SaaS / Fintech
Audience:        Finance professionals, compliance-aware users
Brand archetype: Trust Authority
Tone:            Serious, credible, data-dense
Content density: Medium

Inferred style:  Swiss Rationalism (or Newspaper Broadsheet, or another transplantation)
Accent:          Deep navy + gold or teal
Typography:      Inter (headings) + IBM Plex Mono (data)
Motion:          Minimal — no decorative animation on financial data
```

> **Note (v1.2.0):** `fintech-trust` is a blocked default style. The 8-step algorithm (v2) selects from a weighted top-3 pool of cross-domain transplantations. Transplant bonus ranges from +0% to +35% based on fit score. The Design Reasoning Brief must show all 3 candidates with probability weights.

**PASS criteria:**
- [ ] All 5 signals shown (Product type, Audience, Brand archetype, Tone, Content density)
- [ ] Inferred style is NOT a generic/pop style (not Dopamine Pop, not Vaporwave, not Rounded Joy)
- [ ] Inferred style is NOT a blocked default (not fintech-trust, not saas-b2b-dashboard, not dark-mode-first+gradient, not neobank-consumer)
- [ ] Style is a transplantation that aligns with fintech trust semantics (trust, credibility, data)
- [ ] Design Reasoning Brief appears BEFORE any code generation

**FAIL if:** Style is generic, pop, entertainment-adjacent, or a blocked default for a fintech prompt.

---

## Scenario 2: Rejection Calibration Test

**Goal:** "I hate this" updates `system.md` and the next generation avoids the rejected style.

**Steps:**

1. Generate any component (continue from Scenario 1 or start fresh)
2. Note which style was inferred and used
3. Send the rejection signal:
   ```
   I hate this
   ```
4. Verify `system.md` was updated:
   ```bash
   grep -i "rejected\|avoid" .visionary-cache/system.md
   ```
5. Generate another component with a similar prompt:
   ```
   Dashboard for the same fintech app
   ```
6. Observe the Design Reasoning Brief for the new generation

**Expected:**
- Step 4: The rejected style name appears under `## Rejected Styles` in `system.md`
- Step 6: The Design Reasoning Brief does NOT suggest the rejected style

**PASS criteria:**
- [ ] `.visionary-cache/system.md` exists after rejection
- [ ] Rejected style name appears in `system.md`
- [ ] Second generation uses a different style within the same category
- [ ] No error in `.visionary-cache/hook.log`

**FAIL if:** Style is reused after explicit rejection.

---

## Scenario 3: Visual Critique Loop Test

**Goal:** The Playwright critique loop detects generic output and triggers a fix round.

**Steps:**

1. Generate a deliberately generic component:
   ```
   Build a card component with Inter font and a blue gradient background
   ```
   > This combination (Inter + blue gradient) is the most common AI-generated UI pattern and must trigger slop detection.

2. Wait for the critique loop output:
   ```
   Visual Critique — Round 1
   ─────────────────────────
   Generic AI aesthetic detected: Inter + blue gradient (score: 2/10)
   Triggering fix round...
   ```

3. Observe that at least one fix round runs automatically

**Expected:**
- Critique detects the Inter + blue gradient pattern
- Originality score: ≤ 4/10
- At least one fix round triggered (up to 3 maximum)
- Final component uses a different font for the headline (not Inter)
- OR final component uses a non-gradient background
- OR critique score increases ≥ 3 points between round 1 and final round

**PASS criteria:**
- [ ] Critique output shown with round number and dimension scores
- [ ] Originality dimension ≤ 4/10 for Inter + blue gradient
- [ ] At least 1 fix round runs automatically
- [ ] Final output differs meaningfully from the initial generation

**FAIL if:** Generic AI output passes critique undetected. Score of ≥ 7 for Inter + blue gradient is a test failure.

---

## Scenario 4: Framework Detection Test

**Goal:** `detect-framework.sh` correctly identifies a Next.js 15 project and writes the detection cache.

**Setup:** Run this test from inside a Next.js 15 project with `"next": "^15"` in `package.json`.

**Steps:**

1. Open Claude Code inside the Next.js 15 project:
   ```bash
   cd /path/to/nextjs-15-project
   claude --plugin-dir /path/to/visionary-claude
   ```

2. Verify the detection cache was written at session start:
   ```bash
   cat .visionary-cache/detected-framework.json
   ```

**Expected `detected-framework.json`:**
```json
{
  "framework": "nextjs",
  "version": "15",
  "styling": "tailwind",
  "tailwindVersion": "4",
  "appRouter": true,
  "notes": ["Tailwind v4 CSS-first config detected", "App Router — use server components by default"],
  "detectedAt": "2026-04-14T..."
}
```

Exact values depend on the project. Minimum requirements:
- `framework` must be `"nextjs"`
- `version` must start with `"15"`
- File must exist at `.visionary-cache/detected-framework.json`

**PASS criteria:**
- [ ] `.visionary-cache/detected-framework.json` exists
- [ ] `framework` field = `"nextjs"`
- [ ] `version` field starts with `"15"`
- [ ] No error output in `.visionary-cache/hook.log`

**FAIL if:** File does not exist, or `framework` is `"unknown"`.

---

## Scenario 5: Motion Library Test

**Goal:** Generated React components use `motion/react` (not the deprecated `framer-motion`).

**Steps:**

1. Generate an animated component:
   ```
   Build an animated hero section with a staggered entrance
   ```

2. Check for deprecated import:
   ```bash
   grep -r "from 'framer-motion'\|from \"framer-motion\"" .
   ```
   **Expected: No matches.**

3. Check for correct import:
   ```bash
   grep -r "from 'motion/react'\|from \"motion/react\"" .
   ```
   **Expected: At least one match.**

4. Verify spring tokens are used:
   ```bash
   grep -r "spring\|stiffness\|damping\|mass" .
   ```
   **Expected: Spring parameters present.**

5. Verify WCAG motion safety:
   ```bash
   grep -r "prefers-reduced-motion" .
   ```
   **Expected: At least one match.**

**PASS criteria:**
- [ ] Zero `framer-motion` imports in generated files
- [ ] At least one `motion/react` import in generated files
- [ ] Spring tokens (`stiffness`, `damping`) present in animation config
- [ ] `prefers-reduced-motion` media query wraps animation declarations

**FAIL if:** Any `framer-motion` import found. This is a critical failure — Framer Motion is the deprecated package name and generates a deprecation warning in all Motion for React v11+ environments.

---

## Test Run Checklist

Run all 5 scenarios in sequence. Check each item before declaring Sprint 11 complete.

| Scenario | Test | Status |
|----------|------|--------|
| 1 | Fintech prompt → transplantation style (not generic, not blocked default) | [ ] |
| 2 | "I hate this" → system.md updated | [ ] |
| 2 | Next generation avoids rejected style | [ ] |
| 3 | Inter + blue gradient → slop detected | [ ] |
| 3 | Fix round triggers automatically | [ ] |
| 4 | Next.js 15 project → detected-framework.json written | [ ] |
| 4 | `framework: "nextjs"`, `version: "15"` | [ ] |
| 5 | Zero `framer-motion` imports | [ ] |
| 5 | `motion/react` import present | [ ] |
| 5 | `prefers-reduced-motion` guard present | [ ] |

**Sprint 11 complete when:** All 10 items above are checked.
