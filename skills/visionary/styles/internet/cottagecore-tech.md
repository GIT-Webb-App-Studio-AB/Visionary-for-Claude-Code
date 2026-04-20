---
id: cottagecore-tech
category: internet
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, pastel, earth, editorial, organic]
keywords: [cottagecore, tech, internet]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Cottagecore Tech

**Category:** internet
**Motion tier:** Expressive

## Typography
- **Display font:** Lora 600 italic — warm editorial serif at weight 600; the italic weight references handwritten natural forms without losing authority; italic specifically (not roman) is the cottagecore-tech signature
- **Body font:** Source Sans 3 or DM Sans — functional clarity is mandatory; the body face must be completely legible at small sizes because this is developer tooling; the warmth is in the display, not the data
- **Tracking:** -0.01em (Lora display — optical tightening for large italic), 0em (body) | **Leading:** 1.35 (display), 1.6 (body — generous for reading documentation)

## Colors
- **Background:** #F7F4EE — warm off-white; slightly cooler than pure cottagecore (which runs #FAF7F0) because the tech utility read requires slightly more neutrality; the warmth is present but not dominant
- **Primary action:** #4A7C59 — sage; nature-derived and readable on the light background; passes WCAG AA at normal weight; references living plant color not forest darkness
- **Accent:** #8B6F4A — warm brown for borders, secondary actions, code block backgrounds; references natural wood and craft materials; the material of the desk the developer works at
- **Elevation model:** Subtle — 1px border (#8B6F4A at 30% opacity) + very light box-shadow (0 2px 8px rgba(74, 59, 38, 0.08)); references the physical craft of binding a notebook or framing pressed flowers; NOT digital glass morphism (no blur), NOT drop shadows from overhead light (too digital)

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 140, damping: 16, mass: 1 — purposeful but not mechanical; slightly slower than default spring to feel considered rather than snappy
- **Enter animation:** fade-up — opacity 0 to 1 combined with translateY(12px) to translateY(0) over 400ms with natural ease cubic-bezier(0.25, 0.46, 0.45, 0.94); no overshoot (not playful enough for cottagecore-tech); the metaphor is a page settling after being turned
- **Forbidden:** Dark-background entrance animations (dark bg forced = wrong category), mechanical snap-in or bounce (too tech, too playful — loses the pastoral calm), instant cuts (no patience for the grow), going full pastoral with elaborate leaf/vine animations that obscure the functional content

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8px (panels, cards — gentle curve like a bound notebook corner), 6px (buttons), 4px (inputs, form elements, inline code), 12px (status badges), 0px never used — no hard industrial corners

## Code Pattern
```css
/* Cottagecore tech panel — warm, legible, craft-referencing */
.cottagecore-tech-panel {
  background: #F7F4EE;
  border: 1px solid rgba(139, 111, 74, 0.3);
  border-radius: 8px;
  padding: 28px 32px;
  box-shadow: 0 2px 8px rgba(74, 59, 38, 0.08);
  font-family: 'Source Sans 3', 'DM Sans', system-ui, sans-serif;
}

/* Code block — warm grey background, Courier Prime, forest text */
.cottagecore-codeblock {
  background: #EDE8DF;
  border: 1px solid rgba(139, 111, 74, 0.2);
  border-radius: 4px;
  padding: 20px 24px;
  font-family: 'Courier Prime', 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.65;
  /* Dark forest text — not pure black, warm-dark */
  color: #2C3B2A;
  overflow-x: auto;
  /* Left border accent — page-edge reference */
  border-left: 3px solid #4A7C59;
}

/* Navigation — unobtrusive, warm, functional */
.cottagecore-tech-nav {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 8px;
  background: #F0EBE1;
  border-radius: 8px;
  border: 1px solid rgba(139, 111, 74, 0.2);
}

.cottagecore-tech-nav a {
  font-family: 'Source Sans 3', system-ui, sans-serif;
  font-size: 0.9rem;
  color: #2C3B2A;
  text-decoration: none;
  padding: 6px 14px;
  border-radius: 6px;
  transition: background 200ms ease, color 200ms ease;
}

.cottagecore-tech-nav a:hover {
  background: #E8E1D4;
  color: #4A7C59;
}

.cottagecore-tech-nav a[aria-current="page"] {
  background: #4A7C59;
  color: #F7F4EE;
}

/* Semantic status indicators — nature metaphors for system states */
.status-growing {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Source Sans 3', system-ui, sans-serif;
  font-size: 0.8125rem;
  color: #2D6A3F;
  background: rgba(74, 124, 89, 0.12);
  border: 1px solid rgba(74, 124, 89, 0.3);
  border-radius: 12px;
  padding: 4px 12px;
}

/* growing = active / in-progress state */
.status-growing::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4A7C59;
  animation: pulse-grow 2s ease-in-out infinite;
}

/* dormant = idle / paused state */
.status-dormant {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Source Sans 3', system-ui, sans-serif;
  font-size: 0.8125rem;
  color: #6B5B3E;
  background: rgba(139, 111, 74, 0.1);
  border: 1px solid rgba(139, 111, 74, 0.25);
  border-radius: 12px;
  padding: 4px 12px;
}

.status-dormant::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #8B6F4A;
}

/* wilted = error / failed state */
.status-wilted {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Source Sans 3', system-ui, sans-serif;
  font-size: 0.8125rem;
  color: #8B4A3A;
  background: rgba(139, 74, 58, 0.1);
  border: 1px solid rgba(139, 74, 58, 0.25);
  border-radius: 12px;
  padding: 4px 12px;
}

/* Fade-up entrance */
@keyframes fade-up-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cottagecore-tech-panel[data-animate] {
  animation: fade-up-in 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@keyframes pulse-grow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.8); }
}
```

## Accessibility

### Contrast
Body text must clear 4.5:1 (WCAG 2.2 AA) AND APCA Lc ≥ 75. Large text / UI labels: 3:1 and Lc ≥ 60. Run axe-core + apca-w3 during the critique loop.

### Focus
Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.

### Motion
Under `prefers-reduced-motion: reduce`, keep opacity transitions but drop transform/scale/translate — transform is a vestibular trigger. No autoplay exceeds 5 s without a pause control.

### Touch target
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
- **Dark backgrounds (#1A2A1A, #0D1A0D):** The cottagecore-tech palette is fundamentally light — warm off-white grounds the work surface. A dark background requires inverting the entire color system and immediately reads as dark-mode developer aesthetic (VS Code dark theme territory) rather than the cozy-daylight developer aesthetic this hybrid targets. If the design needs a dark mode, it must be a separate theme, not a background choice within the light variant.
- **Going full pastoral at the expense of functional legibility:** Cottagecore-tech is a specific hybrid — the moment decorative botanical elements, elaborate vine borders, or hand-illustrated backgrounds compete with code readability or navigation clarity, the "tech" half of the hybrid has been abandoned. Code blocks must remain high-contrast and monospace-clear. Navigation links must be findable. Status indicators must communicate immediately. Aesthetic warmth lives in the display typography and the background tint; functional elements must meet legibility standards unconditionally.
