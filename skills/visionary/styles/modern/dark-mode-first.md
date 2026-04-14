# Dark Mode First

**Category:** modern
**Motion tier:** Expressive

## Typography
- **Display font:** Geist (or Inter) — optimized for dark rendering on screens
- **Body font:** Geist Regular
- **Tracking:** -0.01em | **Leading:** 1.5 | **Weight range:** 400/500/600/700

## Colors
- **Background:** #09090B (zinc-950)
- **Primary action:** #FAFAFA (zinc-50)
- **Accent:** #3B82F6
- **Elevation model:** layered zinc scale — #09090B → #18181B → #27272A → #3F3F46; no glows by default

## Motion
- **Tier:** Expressive
- **Spring tokens:** `stiffness: 200, damping: 24`
- **Enter animation:** fade + scale (opacity 0, scale 0.96 → 1, 200ms ease-out)
- **Forbidden:** white backgrounds, light mode token bleeding, CSS `filter: invert()` dark mode implementation

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8px base; 12px cards; 6px inputs; 4px badges

## Code Pattern
```css
/* shadcn/ui dark token mapping */
:root.dark {
  --background:    9 9 11;        /* zinc-950 */
  --foreground:  250 250 250;     /* zinc-50  */
  --card:         24 24 27;       /* zinc-900 */
  --card-foreground: 250 250 250;
  --border:       39 39 42;       /* zinc-800 */
  --input:        39 39 42;
  --ring:         59 130 246;     /* blue-500 */
}
.dark-card {
  background: rgb(var(--card));
  border: 1px solid rgb(var(--border));
  border-radius: 12px;
}
```

## Slop Watch
Dark mode is not `background: #000000; color: #FFFFFF`. Use the zinc scale — pure black has no depth. Never use `filter: invert()` for dark mode; it destroys image colors and semantic meaning. Always design dark-first with a complete token set, not by inverting light tokens.
