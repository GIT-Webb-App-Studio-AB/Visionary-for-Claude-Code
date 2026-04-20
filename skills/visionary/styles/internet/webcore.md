---
id: webcore
category: internet
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, pastel, editorial]
keywords: [webcore, internet]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Webcore

**Category:** internet
**Motion tier:** Expressive

## Typography
- **Display font:** Times New Roman — the browser-default serif of the early web; every Windows 95/98 machine rendered page headings in Times New Roman before custom font embedding existed; it is not chosen for beauty but for historical accuracy as the default typographic condition
- **Body font:** Arial — the Windows system sans-serif that replaced Helvetica in the browser default stack; used simultaneously and inconsistently with Times New Roman in the same composition, exactly as real 1990s HTML pages did before CSS cascading was enforced
- **Mixed typography rule:** Comic Sans MS must appear in at least one element (sidebar labels, footers, or alert boxes) — this is not ironic decoration but historical accuracy; Comic Sans shipped with Windows 95 and was genuinely used by web authors who found it friendly; the mixed-font chaos is the composition
- **Tracking:** 0em (default browser tracking — no CSS letter-spacing was applied in 1996) | **Leading:** 1.2 (browser default line-height before the CSS property was widely understood)

## Colors
- **Background:** #C0C0C0 — Windows 95 system grey; the exact hex value of the Windows desktop and dialog box background; not light grey (#D3D3D3, too soft), not silver (#A9A9A9, too dark); this is the precise platform color that defined the 1990s computing experience
- **Primary action:** #000080 — classic browser hyperlink navy; the default `<a>` link color in Netscape Navigator and Internet Explorer before CSS color overrides; not blue (#0000FF, too bright), not dark blue (#00005A, too dark); this is the exact default browser unvisited link color
- **Accent:** #800080 — visited link purple; the exact default browser visited link color; in 1990s web design, visited/unvisited link color changes were one of the only "design" features available; the purple pair to the navy is not decorative choice but browser default behavior preserved as aesthetic
- **Elevation model:** Windows 95 beveled borders — 2px inset highlight/shadow mechanism; top and left edges use #FFFFFF (light source hits these faces), bottom and right edges use #808080 (shadow faces); this is the exact CSS implementation of the Windows 95 3D button/panel widget style; no box-shadow property (that didn't exist until CSS3)

## Motion
- **Tier:** Expressive
- **Spring tokens:** `--spring-dial-up: steps(8, end) 2400ms` (stepped time function simulating progressive data loading), `--spring-page-load: linear 3200ms` (flat linear for loading bar simulation — no easing because dial-up modems don't accelerate)
- **Enter animation:** `progressive-dial-up-loading` — elements appear in stages using `clip-path: inset(0 100% 0 0)` animating to `inset(0 0% 0 0)` in 8 discrete steps over 2400ms, simulating the left-to-right progressive rendering of images on a 28.8kbps modem connection; text elements appear with `opacity: 0` toggling to `opacity: 1` in a single step (text loaded as raw bytes, instantly readable once received)
- **Forbidden:** smooth gradients between colors (the web of 1996 was flat color only; gradient support came with IE 5.5 in 2000), border-radius of any value (CSS border-radius was not supported until Firefox 2 in 2006; every 1990s web element had square corners), anything post-2000 (CSS animations, web fonts, transforms, flexbox, grid)

## Spacing
- **Base grid:** 4px (HTML table-based layouts used pixel-precise table cell measurements; the "grid" was literally HTML table cellpadding/cellspacing in integer pixels)
- **Border-radius vocabulary:** everything: 0px — no exceptions; border-radius did not exist in the 1990s web; any rounded corner immediately breaks the historical accuracy; buttons: 0px; inputs: 0px; images: 0px; the Windows 95 beveled border achieves visual separation without any rounding

## Code Pattern
```css
/* Windows 95 system grey page base */
.webcore-page {
  background-color: #C0C0C0;
  font-family: "Times New Roman", Times, serif;
  color: #000000;
  margin: 0;
  padding: 8px;
}

/* Mixed typography — intentional chaos matching period HTML */
.webcore-page h1 {
  font-family: "Times New Roman", Times, serif;
  font-size: 24px;
  font-weight: bold;
  color: #000080;
  margin-bottom: 4px;
}

.webcore-sidebar-label {
  font-family: "Comic Sans MS", "Comic Sans", cursive;
  font-size: 12px;
  color: #000000;
}

/* Windows 95 beveled button — exact border-color spec */
.webcore-button {
  background-color: #C0C0C0;
  border-width: 2px;
  border-style: solid;
  border-color: #FFFFFF #808080 #808080 #FFFFFF;
  padding: 4px 12px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 13px;
  cursor: pointer;
  outline: none;
  border-radius: 0;
}

/* Active state — bevel reversal when depressed */
.webcore-button:active {
  border-color: #808080 #FFFFFF #FFFFFF #808080;
  padding: 5px 11px 3px 13px;
}

/* Classic browser link colors — unvisited */
.webcore-page a:link {
  color: #000080;
  text-decoration: underline;
}

/* Visited link purple — browser default preserved */
.webcore-page a:visited {
  color: #800080;
  text-decoration: underline;
}

.webcore-page a:hover {
  color: #000080;
}

/* Windows 95 panel/dialog box treatment */
.webcore-panel {
  background-color: #C0C0C0;
  border-width: 2px;
  border-style: solid;
  border-color: #FFFFFF #808080 #808080 #FFFFFF;
  padding: 8px;
}

/* Title bar strip — Windows 95 active window */
.webcore-titlebar {
  background: linear-gradient(to right, #000080, #1084D0);
  color: #FFFFFF;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  margin: -8px -8px 8px -8px;
}

/* Progressive dial-up loading simulation */
@keyframes progressive-dial-up-loading {
  from { clip-path: inset(0 100% 0 0); }
  to   { clip-path: inset(0 0% 0 0); }
}

.webcore-load-image {
  animation: progressive-dial-up-loading 2400ms steps(8, end) both;
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
- **Adding smooth CSS gradients to any surface:** The web of 1995-1999 had no gradient support. CSS `background: linear-gradient()` was introduced in CSS3 and did not have cross-browser support until 2011. Any gradient immediately places the design in the post-2008 era and breaks the historical accuracy that webcore depends on. Backgrounds must be flat `background-color` values. The Windows 95 titlebar gradient (the one exception) was rendered by the operating system, not HTML/CSS.
- **Using border-radius on any element:** CSS `border-radius` was introduced experimentally in Firefox 2.0 (2006) via `-moz-border-radius` and did not achieve cross-browser support until IE9 in 2011. Every button, panel, input, and image in 1990s web design had hard square corners — not because designers preferred them, but because the technology did not exist to do otherwise. Webcore is specifically the grey-desktop interface aesthetic; any rounded corner signals a decade-later design sensibility and undermines the platform authenticity.
