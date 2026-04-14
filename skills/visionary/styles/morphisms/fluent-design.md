# Fluent Design

**Category:** morphisms
**Motion tier:** Subtle

## Typography
- **Display font:** Segoe UI Variable (fallback: Segoe UI, system-ui) — Windows platform font
- **Body font:** Segoe UI, system-ui, sans-serif
- **Tracking:** 0em | **Leading:** 1.5 (follows Windows text rendering)

## Colors
- **Background:** #202020 — WinUI dark canvas
- **Primary action:** #60CDFF — Fluent accent blue (light mode: #0078D4)
- **Accent:** #FFFFFF at varying opacities for layering
- **Elevation model:** depth layers — acrylic (blurred background), mica (wallpaper tint), reveals (light following cursor)

## Motion
- **Tier:** Subtle
- **Spring tokens:** ui (panel), micro (reveal hover)
- **Enter animation:** connected animation — UI elements slide along implicit connection lines between states
- **Forbidden:** physics-heavy bounce, arbitrary scale transforms — Fluent motion is directional and purposeful

## Spacing
- **Base grid:** 4px
- **Border-radius vocabulary:** 4px inputs, 8px cards, 4px buttons — restrained compared to iOS equivalents

## Code Pattern
```css
.acrylic-panel {
  background:
    linear-gradient(
      rgba(32, 32, 32, 0.6),
      rgba(32, 32, 32, 0.6)
    );
  backdrop-filter: blur(30px) saturate(125%);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
}

/* Fluent reveal effect requires JS for cursor tracking */
.reveal-hover {
  background: radial-gradient(
    circle at var(--x) var(--y),
    rgba(255,255,255,0.08) 0%,
    transparent 50%
  );
}
```

## Slop Watch
- **Calling it "Fluent" but just doing glassmorphism:** Fluent has specific blur amounts, mica integration, and reveal lighting — without cursor-reactive light reveals it is glassmorphism with Segoe UI
- **Ignoring platform context:** Fluent is Windows-native; using it in web contexts without the Windows font stack breaks the coherence
