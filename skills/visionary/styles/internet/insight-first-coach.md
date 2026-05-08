---
id: insight-first-coach
category: internet
motion_tier: Expressive
density: sparse
locale_fit: [all]
palette_tags: [clinical, warm-neutral, off-white, charcoal]
keywords: [coaching, biometric, narrative, wellness, ai-summary, insight, health, sparse]
accessibility:
  contrast_floor_apca: 70
  touch_target_px: 44
  reduced_motion: opacity-only
scoring_hints:
  product_archetypes: [healthcare, wellness, consumer-app]
  audience_density: [casual]
  brand_tones: [warm, neutral]
---

# Insight-First Coach

**Category:** internet
**Motion tier:** Expressive (tier 2)

## Philosophy

The dashboard was designed for operators. A 4-column KPI grid, a line chart showing 90 days of resting heart rate, a ring showing 78% of weekly move goal — these are representations designed for someone who has time to synthesize data into meaning. Most users of health and wellness products are not operators. They woke up, they picked up their phone, and they want to know one thing: am I okay?

Insight-First Coach is the design language of the second generation of AI-powered wellness: Oura Advisor (released 2025), WHOOP Coach 5, Apple Watch S11 Vitals. All three made the same architectural decision in the same calendar year: move the AI-generated text summary to the top of the view, move the raw data to a secondary "see details" tier, and make the primary metric a number so large it functions as typographic composition rather than data label.

The philosophy is not that data is bad. The philosophy is that data requires interpretation, and interpretation requires cognitive work, and cognitive work at 7:43am before coffee is often too much to ask. A sentence — "Your recovery is up 12% — you landed your sleep earlier this week" — is interpretive already. The user can act on it directly. A chart requires the user to become their own analyst.

## Palette

Clinical with warmth. The clinical character prevents the palette from reading as a lifestyle brand. The warmth prevents it from reading as a hospital. The specific tension between these poles is the palette's design objective.

- **Background:** `oklch(0.98 0.003 88)` — off-white `#FAFAF7`
  Rationale: Marginally warmer than pure white — the paper-white of a consultation room rather than the clinical white of a surgical suite. The color is warm enough to signal care and human attention while remaining legible as a neutral surface.

- **Foreground / primary text:** `oklch(0.20 0.01 240)` — soft-charcoal `#2C2C2A`
  Rationale: Not pure black. Pure black on off-white reads as harsh in a sparse layout — the high contrast draws attention to the contrast itself rather than the content. Soft-charcoal at APCA Lc ≈ 96 is perceptually near-black while reducing the harshness.

- **Single accent — choose one:**
  - Oxblood `oklch(0.28 0.10 23)` — `#6B0F1A` — APCA Lc on background ≈ 88 — for heart-rate, recovery, energy contexts
  - Forest `oklch(0.30 0.09 155)` — `#2D4A3E` — APCA Lc on background ≈ 86 — for sleep, calm, restoration contexts

  Rationale: The accent serves two purposes: primary action buttons and the single highlighted metric value per view. Using a desaturated color with clinical gravity (oxblood, forest) rather than a cheerful color (coral, teal, sky-blue) positions the product as a serious wellness tool rather than a gamified app.

- **Subtle divider:** `oklch(0.90 0.005 88)` — near-paper `#E8E6E0`
  Rationale: The only purpose of this color is to separate sections with a line or background shift so faint that the user must look for it. Insight-first layouts should not subdivide aggressively — they should guide attention through hierarchy, not through box-drawing.

```css
:root {
  --color-bg:       oklch(0.98  0.003  88);
  --color-fg:       oklch(0.20  0.01  240);
  --color-accent:   oklch(0.28  0.10   23); /* oxblood variant */
  --color-divider:  oklch(0.90  0.005  88);
}
```

## Typography

Three type roles. No more.

**Role 1 — Metric number (the hero):**
The biometric number is the primary visual element on each view. It functions typographically, not as data. At 60–96px, weight 200 (thin), it occupies vertical space like a headline. The number does not explain itself — the insight sentence below explains it.

```css
.metric-hero {
  font-family: var(--font-ui);         /* Söhne, Inter Display, or system-ui */
  font-size: clamp(3.75rem, 8vw, 6rem); /* 60–96px responsive */
  font-weight: 200;
  letter-spacing: -0.03em;
  color: var(--color-accent);
  line-height: 1.0;
  font-variant-numeric: tabular-nums;
}
```

Rationale: Weight 200 makes the number feel like it is printed on the page rather than asserting itself. Heavy numbers look like alerts. Thin numbers look like information. The distinction matters at this scale.

**Role 2 — Insight sentence (the message):**
A single sentence in serif italic. This is the one element in the layout that carries personality. Humanist sans everywhere else; here, a warm editorial serif indicates that this sentence was composed — it is not a label.

```css
.insight-sentence {
  font-family: var(--font-insight);    /* Söhne Brillant, Tiempos Headline italic, GT Sectra italic */
  font-style: italic;
  font-size: clamp(1.15rem, 3vw, 1.35rem);
  line-height: 1.45;
  color: var(--color-fg);
  max-width: 32ch;                     /* One sentence per line, not a paragraph */
}
```

**Role 3 — UI labels and secondary text:**
Humanist sans, weight 400, size 0.875rem. Söhne or Inter Display at this weight at this size functions as infrastructure — it carries labels, dates, units, captions without drawing attention.

```css
:root {
  --font-ui:      'Söhne', 'Inter Display', system-ui, sans-serif;
  --font-insight: 'Söhne Brillant', 'Tiempos Headline', 'GT Sectra', 'Georgia', serif;
}

.ui-label {
  font-family: var(--font-ui);
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--color-fg);
  opacity: 0.65;
}
```

## Layout

**70% white space rule:** At any given view, at least 70% of the viewport must be background color. This is not a guideline — it is a constraint that enforces the single-insight-per-view discipline. If implementing a layout feels like it violates this ratio, the layout has too much content for this style.

**Single insight per view:** One number. One sentence. Secondary data accessible via a labeled "see details" or "all data" control that reveals a secondary panel or navigates to a data view. The primary view never shows a chart, a grid, or more than two data points simultaneously.

```css
.insight-view {
  display: grid;
  grid-template-rows: 1fr auto auto 2fr;
  min-height: 100dvh;
  padding: 3rem 1.5rem;
  max-width: 480px;
  margin-inline: auto;
}

.insight-view__metric  { grid-row: 2; }
.insight-view__sentence { grid-row: 3; margin-block-start: 1rem; }
/* Rows 1 and 4 are intentional whitespace */
```

**Data tier (secondary):** Charts, trend lines, and raw data tables exist behind a user-initiated interaction. When revealed, they use `stroke-dashoffset` animation to draw the line incrementally — the data appears as though being traced rather than snapping into view.

## Motion

**Tier 2 — Expressive.** Three specific animations, each serving a semantic purpose:

**1. State transition morph:**
When the app moves from one insight to the next (time-of-day update, new insight category), the entire view slow-morphs via opacity cross-fade over 600ms. No slide. No scale. The previous insight does not go anywhere — it becomes less present.

```css
.insight-view {
  transition: opacity 600ms cubic-bezier(0.16, 1, 0.3, 1);
}

.insight-view.is-transitioning {
  opacity: 0;
}
```

**2. Metric number count-up:**
When a numeric metric updates (e.g., new reading synced from device), the number transitions from its previous value to its new value over 800ms using `useTransition` (React) or a GSAP `to()` tween. The count-up animation reinforces that the number is measured — it arrived, it didn't snap.

```css
/* CSS-only approximation for non-JS contexts */
@keyframes count-reveal {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.metric-hero[data-updated] {
  animation: count-reveal 800ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
```

**3. Data arc draw-in:**
When a user reveals the secondary data tier, line charts and arc visualizations draw in using `stroke-dashoffset` animation over 1200ms. This creates the impression of the chart being traced by hand — aligning with the style's narrative approach to data.

```css
.chart-path {
  stroke-dasharray: var(--path-length);
  stroke-dashoffset: var(--path-length);
  transition: stroke-dashoffset 1200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.chart-path.is-visible {
  stroke-dashoffset: 0;
}
```

```css
/* Reduced motion: opacity only, no position/stroke animation */
@media (prefers-reduced-motion: reduce) {
  .insight-view { transition: opacity 300ms linear; }
  .chart-path   { transition: opacity 300ms linear; stroke-dashoffset: 0; }
  .metric-hero[data-updated] { animation: none; }
}
```

## Anti-Dashboard Rationale

Dashboards are designed to show many things simultaneously so that a skilled analyst can form their own synthesis. They are correct tools for the problem of "I need to see the system state across all dimensions at once." That is not the problem users of health coaching apps have.

The problem health coaching users have is: "I have 30 seconds, I need to know if I should change anything about my behavior today." A 4-column KPI grid answers a different question. The user must read each cell, remember what the values meant last time, compare them, form a synthesis, and derive an action. That is 6 cognitive steps. One sentence — an AI-generated insight — answers the question in 0 cognitive steps.

Three specific anti-dashboard patterns this style prohibits:

**1. No KPI grids.** Four metrics in a 2×2 or 4×1 grid is the signature layout of every health dashboard from 2015 to 2024. It survived not because users preferred it but because it was easy to build and easy to populate. Insight-first replaces it categorically. If a design calls for four metrics on one screen, the design has too many metrics on one screen.

**2. No progress rings.** Apple's Activity rings are among the most studied UI patterns in consumer health. They are also widely cited as anxiety-inducing for users who cannot close them (accessibility research: McGill University, 2023). More importantly for 2026, they have become a visual cliché — every health app has adopted rings, which means rings no longer carry design meaning. They are slop. Replace with a text statement ("You have 8 min of Zone 2 remaining today") or a soft arc sketch that does not imply a completion target.

**3. No emoji as UI icons.** Clinical context requires clinical iconography. A ❤️ for heart rate is appropriate in a social app. In a wellness coaching context, it signals playfulness rather than authority. Use precise SVG icons (thin stroke, 1.5px, 24×24) or no icons at all — rely on text labels.

## Reference Products

<!-- Reference screenshots for visual alignment review:
  1. Oura Advisor (2025): app.ouraring.com — The "Advisor" tab shows a full-screen AI narrative
     response above the raw readiness score. The score is large, centered, weight-light. The
     narrative paragraph uses a warm sans rather than an editorial serif, but the hierarchy —
     number first, explanation second — is identical to this style's intent.

  2. WHOOP Coach 5 (2025): WHOOP app v5.0+ — The "WHOOP Coach" session opens with a single
     sentence ("Based on yesterday's data, today is an optimal day for a hard effort") before
     offering to show charts. The white space ratio on the opening screen approaches 75%.

  3. Apple Watch S11 Vitals (2025): The "Vitals" glance on watchOS 12 shows a single circular
     arc (not a ring) and one sentence summary. On iPhone, the Vitals Detail view shows the AI
     summary first, with raw data accessible by scrolling past it.
-->

These three products established the design pattern this style codifies. The pattern is: AI synthesis first, raw data second, always.

## Medical Claims Warning

**This style document is not medical device design guidance.**

The following language is explicitly prohibited in any product using this style without prior regulatory legal review:
- Words: "diagnoses," "treats," "cures," "detects," "medical," "clinical" (unless in a licensed clinical context)
- Phrases: "your blood oxygen indicates," "this reading suggests a condition," "based on your ECG"
- Any claim that equates app output with medical advice or diagnosis

The following language is safe within coaching vocabulary:
- "Your recovery is up 12%"
- "You slept earlier than usual this week — that may have helped"
- "Consider an easier effort today based on yesterday's load"
- "Your resting heart rate has trended lower over 14 days"

**When NOT to use this style:**
If the product makes any FDA Class II or Class III device claims, or is subject to EU MDR Article 2 definition of medical device, this style's narrative-first approach requires review by a regulatory consultant before deployment. The coaching vocabulary may not be appropriate for medical-grade products even when technically accurate.

## Accessibility

**Large metric numbers:** `clamp(3.75rem, 8vw, 6rem)` at weight 200. APCA Lc for large text (≥24px, weight ≤300) has a relaxed floor of Lc 60 under APCA guidelines. Oxblood on off-white = Lc ≈ 88 — passes even the standard body-text floor.

**Insight sentence:** serif italic at 1.15–1.35rem. APCA Lc for body text: charcoal on off-white = Lc ≈ 96. Exceeds AAA.

**Reduced motion:** `prefers-reduced-motion: reduce` replaces all transition/animation with opacity-only cross-fades. Chart draw-in becomes opacity fade. Count-up animation is disabled; number appears directly.

**Touch targets:** All interactive elements minimum 44×44px. The sparse layout naturally creates generous tap areas. The "see details" control uses a full-width touch target.

**RTL support:** CSS logical properties throughout. The metric number and insight sentence are typographically neutral — a large number and a sentence in any language occupies the same visual position.

**Screen reader:** The metric number must have an accessible label: `<span aria-label="Recovery score: 84">84</span>`. The insight sentence reads naturally as prose.

## When to Use

- Consumer wellness apps powered by wearable data (sleep trackers, HRV monitors, activity bands)
- Fitness and nutrition coaching platforms with AI-generated personalized insights
- Mental wellness and biofeedback applications where simplicity reduces friction to engagement
- Corporate wellness programs where the audience is non-technical and time-constrained
- Rehabilitation monitoring apps where the coach (human or AI) delivers interpretation

## When NOT to Use

- FDA-regulated medical devices without regulatory review of the coaching vocabulary
- Products requiring simultaneous comparison of multiple metrics (use a dashboard style instead)
- B2B analytics platforms where the user is an analyst, not a coached individual
- Products for expert users (athletes, clinicians, researchers) who need raw data immediately without a summarization layer
- Any product where the AI-generated insight cannot be reviewed by a human expert before display
