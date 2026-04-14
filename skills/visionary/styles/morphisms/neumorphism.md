# Neumorphism

**Category:** morphisms
**Motion tier:** Subtle

## Typography
- **Display font:** Manrope Light (300) — softness of the letterform matches the softness of the shadows
- **Body font:** Manrope Regular
- **Tracking:** 0.01em | **Leading:** 1.6

## Colors
- **Background:** #E0E5EC — the exact grey that enables dual-shadow depth trick
- **Primary action:** #5B9CF6 — pressed-state indicator (flat color, no shadow)
- **Accent:** #C879FF — used sparingly on active states only
- **Elevation model:** dual soft shadows — one light (top-left, white), one dark (bottom-right, grey)

## Motion
- **Tier:** Subtle
- **Spring tokens:** micro (press), ui (toggle)
- **Enter animation:** none — neumorphism is static; motion breaks the material illusion
- **Forbidden:** scale transforms, glow, backdrop-filter — destroys the monochromatic depth trick

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 12px cards, 50% circles for icon buttons, 8px inputs — avoid sharp corners entirely

## Code Pattern
```css
.neu-card {
  background: #E0E5EC;
  border-radius: 12px;
  box-shadow:
    8px 8px 16px #b8bec7,
   -8px -8px 16px #ffffff;
}

.neu-pressed {
  box-shadow:
    inset 4px 4px 8px #b8bec7,
    inset -4px -4px 8px #ffffff;
}
```

## Slop Watch
- **Wrong background color:** Any color other than the specific mid-grey range (approximately #D1D9E6–#E8EDF5) makes the shadows look like cheap drop shadows
- **Using on dark backgrounds:** Neumorphism is a light-mode-only technique — dark neumorphism is a different (worse) thing
