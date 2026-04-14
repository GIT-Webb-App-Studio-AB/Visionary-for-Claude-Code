# Bloomcore Botanical

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Playfair Display Italic — flows like botanical illustration labels
- **Body font:** Lora Regular
- **Tracking:** 0.01em | **Leading:** 1.7

## Colors
- **Background:** #F0F7EE (tender leaf white)
- **Primary action:** #3A6B35 (botanical green)
- **Accent:** #8B4E2E (earth terracotta) or #B5749C (pressed flower mauve)
- **Elevation model:** soft pressed-flower depth; no hard shadows

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 160, damping: 28 }` — growing, unhurried
- **Enter animation:** bloom — scale 0.95 → 1 + fade, 400ms ease-out; like a flower opening
- **Forbidden:** bright neon, dark backgrounds, fast animations, geometric sharpness

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8–20px; botanical forms have organic edges

## Code Pattern
```css
.botanical-card {
  background: #F0F7EE;
  border: 1px solid rgba(58, 107, 53, 0.2);
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(58, 107, 53, 0.08);
}

.pressed-flower-divider {
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, #B5749C 30%, #B5749C 70%, transparent);
  margin: 24px 0;
}
```

## Slop Watch
- Botanical green must maintain 4.5:1 contrast on the light background — #3A6B35 on #F0F7EE passes; lighter greens may not without checking
- Never fill backgrounds with literal floral imagery — the palette carries the register; actual flowers in backgrounds compete with content
