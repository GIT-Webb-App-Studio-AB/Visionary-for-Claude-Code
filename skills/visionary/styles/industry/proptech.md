---
id: proptech
category: industry
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [light, pastel, earth, editorial, organic]
keywords: [proptech, industry]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Proptech

**Category:** industry
**Motion tier:** Expressive

## Typography
- **Display font:** Canela 400–700 (editorial real estate feel)
- **Body font:** DM Sans 400
- **Weight range:** 400–700
- **Tracking:** 0.02em display, 0em body
- **Leading:** 1.2 display, 1.55 body

## Colors
- **Background:** #F9F7F4 (warm off-white — property photography friendly)
- **Primary action:** #1A3A2A (deep forest green — premium property)
- **Accent:** #C8A96E (warm gold — aspirational)
- **Elevation model:** soft shadows (0 4px 20px rgba(0,0,0,0.06))

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 240, damping: 28, mass: 1.0
- **Enter animation:** property cards slide in with 40ms stagger, map pins drop with bounce (stiffness: 300, damping: 18)
- **Forbidden:** fast snap animations near pricing, anything that makes pricing feel unstable or impulsive

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 12px property cards, 8px inputs, 999px status badges (Available/Sold/Pending)

## Code Pattern
```css
.property-card {
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.3s ease;
}

.property-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.12);
}

.property-price {
  font-family: 'Canela', 'Georgia', serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1A3A2A;
  font-feature-settings: 'tnum' 1;
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
- Using a tech-startup aesthetic (bright primary colors, geometric sans) — proptech that wants premium listings must feel more like Architectural Digest than ProductHunt
- Animating price changes in real time with flashing numbers; price volatility signals should not be dramatized with motion
