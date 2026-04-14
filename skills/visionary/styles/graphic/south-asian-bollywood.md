# South Asian Bollywood

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Noto Sans Devanagari — required for Hindi/Marathi content; correct matra and conjunct ligatures
- **Body font:** Poppins (acceptable here for its Bollywood-adjacent cultural association with Indian tech/entertainment brands)
- **Tracking:** 0em for Devanagari; 0.01em for Latin | **Leading:** 1.75 for Devanagari; 1.5 for Latin

## Colors
- **Background:** #1A0030 (Bollywood dark violet — velvet curtain)
- **Primary action:** #FF6B00 (marigold orange — auspicious)
- **Accent:** #FFD700 (gold — jewelry reference)
- **Elevation model:** jewel-toned glow; rich depth, no neutral shadows

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 220, damping: 16 }` — drama with confidence
- **Enter animation:** scale 0.85 → 1.05 → 1, 400ms; cinematic reveal energy
- **Forbidden:** muted palettes, understated motion, grey tones

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8–24px; jeweled curves

## Code Pattern
```css
.bollywood-hero {
  background: linear-gradient(135deg, #1A0030 0%, #2D0050 50%, #1A0030 100%);
  border: 2px solid rgba(255, 215, 0, 0.4);
  box-shadow:
    0 0 40px rgba(255, 107, 0, 0.3),
    0 0 80px rgba(255, 107, 0, 0.1),
    inset 0 0 40px rgba(255, 215, 0, 0.05);
}
```

## Slop Watch
- Devanagari text must have line-height ≥ 1.7 — the script's ascending matras (vowel marks above the headline) require more vertical space than Latin equivalents; tighter leading clips characters
- The marigold + gold combination must maintain contrast against the dark background; check both colors at 4.5:1 against #1A0030 before deployment

## Cultural Note
**Devanagari font loading:** Noto Sans Devanagari covers Hindi, Marathi, Nepali, and Sanskrit. It must be explicitly loaded — it is not included in most font stacks. Load via Google Fonts with `&subset=devanagari` parameter. Without it, Devanagari content renders in system fallback, which varies dramatically across platforms.

**Poppins justification:** Poppins was designed by Ninad Kale (Indian Type Foundry) with Latin and Devanagari in mind, and has been widely adopted by Indian tech brands (Razorpay, CRED, Zomato). Its geometric warmth has genuine Bollywood-adjacent cultural resonance — this is not generic "round sans" selection.

**Bollywood vs. Indian design:** Bollywood is a specific industry (Hindi-language film) centered in Mumbai. Do not use this style to represent Tamil (Kollywood), Telugu (Tollywood), or other regional film industries — their visual languages differ substantially.

**Auspicious colors:** Marigold orange and gold are auspicious in Hindu tradition. Their use in commercial design is well-established and appropriate. Avoid using white as a primary color in celebratory contexts — white is associated with mourning in many South Asian traditions.
