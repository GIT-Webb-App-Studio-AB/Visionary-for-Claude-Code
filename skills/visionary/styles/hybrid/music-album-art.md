---
id: music-album-art
category: hybrid
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [light]
keywords: [music, album, art, hybrid]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Music Album Art

**Category:** hybrid
**Motion tier:** Kinetic

## Typography
- **Display font:** Art-direction driven — no fixed font; match the genre's visual language
- **Body font:** DM Sans (neutral fallback for track listings and credits)
- **Tracking:** varies by genre | **Leading:** 1.3

## Colors
- **Background:** Full-bleed artwork; no fixed palette
- **Primary action:** Extracted from dominant artwork color
- **Accent:** Complementary or contrast color from artwork
- **Elevation model:** mix-blend-mode overlay; type sits on image, not above it

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 160, damping: 14 }` — music has rhythm and pulse
- **Enter animation:** artwork fade-in 600ms; text elements stagger-reveal 80ms intervals
- **Forbidden:** static type on white, no glow on vinyl/CD imagery, no rounded album art containers

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px for album covers (vinyl and CD are square/circular — not rounded rectangles)

## Code Pattern
```css
.album-cover {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-title-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  padding: 32px 24px 24px;
  mix-blend-mode: normal;
}
```

## Accessibility

### Contrast
Body text must clear 4.5:1 (WCAG 2.2 AA) AND APCA Lc ≥ 75. Large text / UI labels: 3:1 and Lc ≥ 60. Run axe-core + apca-w3 during the critique loop.

### Focus
Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.

### Motion
This style exposes motion that can run longer than 5 seconds. Ship a visible pause/stop control bound to `animation-play-state` (CSS) or the JS equivalent — required by WCAG 2.2.2 (Level A). Also degrade to opacity-only transitions under `prefers-reduced-motion: reduce`.

### Touch target
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
- Album cover must be `aspect-ratio: 1` — non-square album art is a category error in physical media reference
- Never apply `border-radius` to album cover containers; vinyl records are circular, CDs are circular, cassette artwork is rectangular — none have rounded rectangles
