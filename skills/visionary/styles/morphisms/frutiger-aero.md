# Frutiger Aero

**Category:** morphisms
**Motion tier:** Expressive

## Typography
- **Display font:** Frutiger (or Myriad Pro as fallback) — the style takes its name partly from Adrian Frutiger's typefaces
- **Body font:** Trebuchet MS, Tahoma, system-ui (2006-era web fonts)
- **Tracking:** 0.01em | **Leading:** 1.5

## Colors
- **Background:** #C8E8F4 — sky blue gradient that evokes Windows Vista Aero
- **Primary action:** #4A90D9 — Vista-era button blue with glass sheen
- **Accent:** #72C152 — nature green used for life/growth metaphors
- **Elevation model:** glows + reflections — elements have specular highlights, glass sheen overlays, diffuse blue glows

## Motion
- **Tier:** Expressive
- **Spring tokens:** gentle (panel open), ui (hover lift)
- **Enter animation:** scale from 0.95 + vertical drop with glass sheen reveal
- **Forbidden:** flat transitions, hard edges, anything that looks "post-2014 flat"

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8px cards, 4px inputs, 999px pills — moderate rounding that predates the very-round era

## Code Pattern
```css
.aero-panel {
  background: linear-gradient(
    180deg,
    rgba(255,255,255,0.6) 0%,
    rgba(180,220,255,0.3) 50%,
    rgba(255,255,255,0.1) 100%
  );
  backdrop-filter: blur(8px) brightness(1.05);
  border: 1px solid rgba(255,255,255,0.7);
  border-radius: 8px;
  box-shadow:
    0 2px 8px rgba(0,100,200,0.2),
    inset 0 1px 0 rgba(255,255,255,0.8);
}

/* Characteristic lens flare / specular overlay */
.aero-panel::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.4), transparent);
  border-radius: 8px 8px 0 0;
  pointer-events: none;
}
```

## Slop Watch
- **Too modern the typography:** Using Inter or DM Sans destroys the period feel — lean into Trebuchet MS or Myriad Pro clones
- **Missing the specular highlight:** Frutiger Aero without the top-half glass sheen just looks like early glassmorphism — the reflection overlay is the signature
