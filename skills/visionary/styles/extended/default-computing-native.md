---
id: default-computing-native
category: extended
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [light, dark]
keywords: [default-computing, native, macos, windows, gnome, adwaita, kde, breeze, platform-native]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Default Computing Native

**Category:** extended
**Motion tier:** Subtle

Platform-native aesthetic — macOS Sonoma/Sequoia (2024–2026), GNOME Adwaita,
KDE Breeze 6, Windows 11 Fluent, iOS 26. Respect each OS's native
conventions so the app feels like it *belongs* on the platform, not ported
to it. References: Apple Notes, Things 3, Loop, GNOME Files, System Settings,
Preview.

Use when: the target IS a desktop app, system utility, or platform-specific
tool. NOT for marketing sites or cross-platform brands — those benefit from
explicit aesthetic choices.

## Typography

- **Display font:** platform system stack — `system-ui` or the CSS font
  keyword `ui-sans-serif`. Never override
- **Body font:** same — respect the OS user-settings (user may have set
  larger type for accessibility; system-ui honors it)
- **Tracking:** 0 — platform defaults are already tuned
- **Leading:** 1.5 body, 1.2 display
- **Feature:** use `font-family: ui-sans-serif, system-ui, -apple-system,
  'Segoe UI', 'Liberation Sans', sans-serif;` — this is the 2026-correct
  stack that covers macOS, Windows, Linux without declaring specific faces

## Colors

Use CSS **system colors** (CSS Color Module Level 4):

- **Background:** `Canvas` (auto-adapts to light/dark mode)
- **Text:** `CanvasText`
- **Link:** `LinkText`
- **Visited link:** `VisitedText`
- **Selected text:** `Highlight` / `HighlightText`
- **Accent:** `AccentColor` / `AccentColorText`
- **Field background:** `Field`
- **Disabled text:** `GrayText`

The entire point of this style is to NEVER hardcode colors — let the OS pick
everything. The result adapts to:
- macOS accent-color setting (blue, purple, pink, red, orange, yellow, green, graphite)
- Windows high-contrast mode
- GNOME dark/light scheme preference
- KDE color scheme

## Motion

- **Tier:** Subtle
- **Spring tokens:** `{ bounce: 0, visualDuration: 0.2 }` — platform defaults
- **Enter animation:** 200 ms opacity fade, no translate. Platform windows
  don't slide
- **Micro-interactions:** hover tints with `color-mix(in oklch, Canvas 95%,
  CanvasText)` — a subtle opacity overlay using system colors

## Spacing

- **Base grid:** 8 px on web, but respect platform: macOS = 8/16/24/32,
  Windows 11 = 4/8/12/16
- **Border-radius:** 6 px on macOS, 4 px on Windows 11, 12 px on GNOME, 4 px
  on KDE — detect platform via `navigator.platform` or user-agent hints

## Code Pattern

```css
:root {
  /* The entire palette, in 5 lines */
  color-scheme: light dark;
  background: Canvas;
  color: CanvasText;
  accent-color: AccentColor;
}

body {
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI',
               'Liberation Sans', sans-serif;
  font-size: 15px;
  line-height: 1.5;
  padding: 24px;
}

.dcn-card {
  background: Canvas;
  color: CanvasText;
  /* 1px hairline in the platform's natural separator color */
  border: 1px solid color-mix(in oklch, CanvasText 15%, transparent);
  border-radius: 8px;
  padding: 20px;
  transition: background 120ms ease;
}
.dcn-card:hover {
  background: color-mix(in oklch, Canvas 94%, CanvasText);
}

.dcn-button-primary {
  background: AccentColor;
  color: AccentColorText;
  padding: 10px 20px;
  border-radius: 8px;
  border: 0;
  font: inherit;
  min-block-size: 44px;
}

.dcn-link {
  color: LinkText;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
}

/* forced-colors mode works automatically with system colors */
```

## Accessibility

### Contrast
System colors guarantee WCAG-level contrast by OS contract. `Canvas`/`CanvasText`
always meets 4.5:1 or better because the OS enforces it (macOS, Windows,
GNOME, KDE all verified).

### Focus
`:focus-visible { outline: 2px solid Highlight; }` — uses the OS highlight
color (same color as selection), consistent with native apps.

### Motion
`prefers-reduced-motion: reduce` drops hover color to instant. No other
motion is present.

### Touch target
44×44 default. On touch-first platforms (iPad, Surface touch) the system
already enforces larger via UIKit/WinUI conventions.

### forced-colors / Windows High Contrast
**Works by default** — system colors are the Windows High Contrast design
surface. No extra `@media (forced-colors: active)` overrides needed for
body content. Optional: add `forced-color-adjust: auto` on any custom
decorations you want to disable in forced-colors.

### RTL / Logical properties
Fully logical. System-ui renders correctly in any locale.

## Slop Watch

- Any hardcoded hex = defeats the style. System colors only
- Custom font-family = defeats the platform-native premise
- Drop shadows / gradients = foreign on most platforms
- Custom-branded accent colors = breaks the "belongs on platform" feel
- Overriding `color-scheme` = disrespects the user's OS preference
- This style is NOT for marketing sites or cross-platform brands — suggest
  `white-futurism` or `dieter-rams` instead
