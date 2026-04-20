---
id: social-media-native
category: industry
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [social, media, native, industry]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Social Media Native

**Category:** industry
**Motion tier:** Kinetic

## Typography
- **Display font:** Bricolage Grotesque 700–800 (native-feeling)
- **Body font:** system-ui, -apple-system (must feel like the platform, not a designed font)
- **Weight range:** 400–800
- **Tracking:** 0em (platform-native — no custom tracking)
- **Leading:** 1.3 short posts, 1.5 longer text

## Colors
- **Background:** platform-matched (#000000 TikTok/X, #FAFAFA Instagram-light)
- **Primary action:** platform-matched or high-contrast accent
- **Accent:** #FF2D55 (engagement red) or #FF6900 (creator orange)
- **Elevation model:** none — content IS the surface; no elevation hierarchy

## Motion
- **Tier:** Kinetic
- **Spring tokens:** stiffness: 400, damping: 20, mass: 0.8
- **Enter animation:** swipe physics — content snaps to position with momentum preservation
- **Forbidden:** slow decorative transitions that reduce scroll velocity, animation that pauses content consumption

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 50% avatars, 12px cards, 999px pills — platform-standard, no deviation

## Code Pattern
```css
.social-feed-item {
  padding: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  transition: background 0.15s ease;
}

.social-like-button {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6B7280;
  transition: color 0.1s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.social-like-button.liked {
  color: #FF2D55;
}

.social-like-button:active {
  transform: scale(0.85);
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
- Using a custom display font that fights the platform aesthetic — social-native design must feel like it grew from the platform, not was designed and placed on it
- Slow animations on like/share interactions; social engagement micro-interactions must be instantaneous (under 100ms) or they feel broken
