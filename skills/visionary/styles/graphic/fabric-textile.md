# Fabric Textile

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** Lora — warm serif with calligraphic rhythm, textile-adjacent
- **Body font:** Lora Regular
- **Tracking:** 0.005em | **Leading:** 1.7

## Colors
- **Background:** #F2EBE0 (unbleached linen)
- **Primary action:** #7A5C44 (woven umber)
- **Accent:** #C4956A (natural dye terracotta)
- **Elevation model:** subtle textile-weave texture overlay; no hard shadows

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 160, damping: 30 }`
- **Enter animation:** fade 200ms ease; gentle 3px upward shift
- **Forbidden:** sharp transitions, metallic sheen, bounce

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 4–8px; fabric drapes — no hard edges

## Code Pattern
```css
.fabric-surface {
  background-color: #F2EBE0;
  background-image: url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h2v2H0zm2 2h2v2H2z' fill='%23C4956A' fill-opacity='0.08'/%3E%3C/svg%3E");
}
```

## Slop Watch
- The textile SVG pattern must be subtle (opacity 0.08 or less) — heavy patterns compete with content
- Never use Playfair Display here; its high contrast reads as editorial, not handcrafted textile
