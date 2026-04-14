# Disco Op Art

**Category:** extended
**Motion tier:** Kinetic

## Typography
- **Display font:** Syne or Bebas Neue — geometric boldness for optical environments
- **Body font:** DM Sans
- **Tracking:** 0.04em | **Leading:** 1.3

## Colors
- **Background:** High-contrast black #000000 + white #FFFFFF alternating
- **Primary action:** #FF006E (disco pink)
- **Accent:** #00E5FF (electric cyan) + #FFE000 (gold)
- **Elevation model:** optical illusion creates perceived depth; no traditional shadows

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 200, damping: 20 }`
- **Enter animation:** optical pulse — pattern scale or rotation creates visual vibration
- **Forbidden:** muted colors, gray tones, static backgrounds without optical movement

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px for op-art geometry; 999px for disco circle motifs

## Code Pattern
```css
.op-art-pattern {
  background-image: repeating-linear-gradient(
    45deg,
    #000000 0px, #000000 10px,
    #FFFFFF 10px, #FFFFFF 20px
  );
  animation: op-pulse 2s ease-in-out infinite alternate;
}

@keyframes op-pulse {
  from { background-size: 28px 28px; }
  to   { background-size: 32px 32px; }
}

.disco-ball-light {
  background: conic-gradient(
    from 0deg,
    #FF006E, #FFE000, #00E5FF, #FF006E
  );
  border-radius: 999px;
  animation: spin 3s linear infinite;
}
```

## Slop Watch
- Op-art pulse animation must be `alternate` direction — unidirectional pattern scaling builds then disappears, destroying the optical oscillation
- Disco colors must be fully saturated — desaturating any of the three colors (pink, cyan, gold) neutralizes the chromatic vibration that makes disco lighting work
