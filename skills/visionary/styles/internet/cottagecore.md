---
id: cottagecore
category: internet
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, pastel, organic]
keywords: [cottagecore, internet]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Cottagecore

**Category:** internet
**Motion tier:** Expressive

## Typography
- **Display font:** Playfair Display — serif with ink-trap elegance, literary and warm
- **Body font:** Lora 400 — book-weight serif for readability
- **Tracking:** 0.01em | **Leading:** 1.75 — generous leading for a leisurely read

## Colors
- **Background:** #FDFAF5 — warm near-white like aged paper or cream linen
- **Primary action:** #5C8A5A — sage green, muted and natural
- **Accent:** #C17D8A — dusty rose, the cottagecore signature
- **Elevation model:** none — depth through typography and whitespace, not shadows

## Motion
- **Tier:** Expressive
- **Spring tokens:** gentle (page transitions), ui (hover reveals)
- **Enter animation:** fade-up with very gentle ease (500ms, cubic-bezier(0.22, 1, 0.36, 1))
- **Forbidden:** hard cuts, spring bounce, anything mechanical or urgent

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8px for cards, 4px for inputs, 999px for botanical tags — softness without excess

## Code Pattern
```css
.cottagecore-card {
  background: #FDFAF5;
  border: 1px solid rgba(92,138,90,0.2);
  border-radius: 8px;
  padding: 32px;
  font-family: 'Lora', serif;
}

.cottagecore-heading {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  color: #3D5A3E;
  letter-spacing: 0.01em;
}

/* Botanical divider */
.botanical-rule {
  border: none;
  text-align: center;
  color: #5C8A5A;
  opacity: 0.6;
}
.botanical-rule::before {
  content: '— ❧ —';
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
- **Dark mode cottagecore:** The entire aesthetic depends on warm light and cream backgrounds — dark mode destroys the pastoral feel
- **Sans-serif type:** Using Inter or Poppins in a cottagecore context looks like someone added floral clip art to a SaaS dashboard
