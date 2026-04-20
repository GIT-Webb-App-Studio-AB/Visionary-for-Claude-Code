---
id: ambient-copilot
category: modern
motion_tier: Subtle
density: sparse
locale_fit: [all]
palette_tags: [light, pastel, editorial]
keywords: [ai, copilot, ambient, invisible, contextual, assistant, slash-menu]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Ambient Copilot

**Category:** modern
**Motion tier:** Subtle

AI as an invisible layer, not a chat widget. The 2023–2024 pattern was "drop a
chat panel on the right side of the screen and call it AI". 2026 is moving
away from that: AI surfaces appear only where a user demonstrates intent — at
the cursor, over selected text, as a command-K palette, as inline suggestions —
and vanish when the intent is consumed. Linear's AI Studio, Granola's
transcripts, Raycast AI, Arc's Max — all share this pattern.

This style is the set of conventions that make ambient AI feel trustworthy and
non-invasive: precise surfaces, short latency motion, zero permanent chrome.

## Typography

- **Display font:** Geist or SF Pro Display — calm, neutral, non-assertive.
  Avoid Inter (too product-generic, makes the AI panel read like "just another card")
- **Body font:** Geist Regular, 15px (one step tighter than editorial — ambient
  surfaces need to feel like micro-UI, not content)
- **Tracking:** -0.005em | **Leading:** 1.55
- **Feature:** Monospaced inline code snippets — ambient AI often returns code
  or structured output. Use Geist Mono or JetBrains Mono inside the surfaces,
  Geist for prose

## Colors

- **Background (surface):** `color-mix(in oklch, Canvas 92%, var(--ai-tint, oklch(0.72 0.15 258)) 8%)`
  — the surface tints toward a single consistent "AI color" (pick one per product;
  saturating, not decorating)
- **Primary text:** `CanvasText` — respect OS theme, never override
- **Primary action:** `oklch(0.72 0.15 258)` — the product's AI color. Can be
  blue, violet, teal, or green. NEVER rainbow
- **Accent:** a single dimmer shade of the AI color at 40 % L
- **Streaming state:** `color-mix(in oklch, var(--ai-tint) 100%, transparent 60%)` —
  animated opacity pulse while tokens arrive
- **Forbidden:** multi-color gradients (screams "AI slop"), glitch effects,
  neon, sparkle icons — all of these make AI look gimmicky

## Motion

- **Tier:** Subtle
- **Spring tokens:** `{ bounce: 0.1, visualDuration: 0.22 }` — fast, confident
- **Enter animation:** surfaces should appear from the cursor / trigger point
  with a `@starting-style` scale 0.96 → 1 + blur 6px → 0 over 180ms. No drop-in
  from above, no slide — the surface "crystallizes" at the trigger location
- **Streaming indicator:** when tokens are arriving, pulse the surface border
  opacity 0.4 → 1 → 0.4 on a 1.2s cycle. Never a spinner — spinners feel legacy
- **Exit animation:** on accept/dismiss, fade + scale 1 → 0.97 in 120ms. Short.
  Ambient UI values latency over elegance
- **Forbidden:** bounce, glow pulses, typing-dots indicators, jitter, parallax

## Spacing

- **Base grid:** 4px (tighter than product grid — ambient surfaces are
  information-dense within a small footprint)
- **Border-radius vocabulary:** 12px on surfaces, 8px on internal pills, 6px on
  inline inputs
- **Surface size:** narrow — max 380px inline-size at the trigger. This is a
  discoverable tool, not a panel
- **Placement:** use CSS anchor positioning to pin surfaces to the trigger.
  Never absolute positioning math in JS

## Code Pattern

```css
:root {
  --ai-tint: oklch(0.72 0.15 258);           /* product-chosen AI color */
  --ai-surface: color-mix(in oklch, Canvas 92%, var(--ai-tint) 8%);
  --ai-border:  color-mix(in oklch, CanvasText 12%, transparent);
}

.ambient-surface {
  background: var(--ai-surface);
  color: CanvasText;
  border: 1px solid var(--ai-border);
  border-radius: 12px;
  padding: 12px 14px;
  font: 400 15px/1.55 Geist, ui-sans-serif, system-ui;
  max-inline-size: 380px;

  /* CSS anchor positioning — pin to the trigger */
  position-anchor: --ai-trigger;
  inset-block-start: anchor(bottom);
  inset-inline-start: anchor(start);
  translate: 0 6px;

  /* @starting-style entry — Baseline 2024 */
  transition: opacity 180ms ease-out, scale 180ms cubic-bezier(0.16, 1, 0.3, 1),
              filter 180ms ease-out;
  opacity: 1; scale: 1; filter: blur(0);
}
@starting-style {
  .ambient-surface {
    opacity: 0;
    scale: 0.96;
    filter: blur(6px);
  }
}

/* Streaming indicator — no spinner */
.ambient-surface[data-streaming="true"] {
  border-color: var(--ai-tint);
  animation: stream 1.2s ease-in-out infinite;
}
@keyframes stream {
  0%, 100% { border-color: color-mix(in oklch, var(--ai-tint) 40%, transparent); }
  50%      { border-color: color-mix(in oklch, var(--ai-tint) 100%, transparent); }
}

/* Inline suggestion (ghost text) */
.ambient-ghost {
  color: color-mix(in oklch, CanvasText 45%, transparent);
  font-style: normal; /* never italic — italic = content, not suggestion */
}

@media (prefers-reduced-motion: reduce) {
  .ambient-surface[data-streaming="true"] { animation: none; }
  @starting-style { .ambient-surface { opacity: 0; scale: 1; filter: blur(0); } }
}
```

## Accessibility

### Contrast
Surfaces inherit from `Canvas` / `CanvasText`, so contrast is handled by the
OS. The 8 % AI-tint mix must not drop body text below 4.5:1 — the adaptive
surface keeps that margin in both light and dark modes.

### Focus
The surface itself should trap focus while open (like a dialog), and first
focus lands on the first actionable item. Close on `Escape`. Return focus to
the trigger on close.

### Motion
Streaming pulse is gated on `prefers-reduced-motion: no-preference`. The
`@starting-style` entry degrades to instant under reduce.

### Touch target
44×44 on all interactive elements inside the surface. The surface itself is
not clickable — only its controls.

### Semantics
The surface must use `role="dialog"` (if modal) or `role="tooltip"` + `aria-describedby`
(if advisory). Streaming state must set `aria-busy="true"`. Accepted
suggestions must announce via `aria-live="polite"`.

### RTL / Logical properties
`inset-inline-start`, `inset-block-start`, `margin-inline` throughout. Anchor
positioning's `anchor(start)` / `anchor(end)` respects writing direction.

## Slop Watch

- Chat-bubble UI = not ambient. Bubbles mean "chatbot", ambient means
  "suggestion at cursor"
- Rainbow gradients on AI surfaces = the #1 AI-slop indicator. Single tint only
- Sparkle emoji / icon = fail. Use a simple single-weight glyph
- Typing-dots indicator = legacy pattern. Use the border-pulse
- Persistent right-rail chat panel = wrong style. Propose `social-media-native`
  or a product-specific chat layout instead
