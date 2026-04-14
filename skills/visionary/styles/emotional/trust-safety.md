# Trust Safety

**Category:** emotional
**Motion tier:** Subtle

## Typography
- **Display font:** Source Serif 4 600
- **Body font:** Source Sans 3 400
- **Weight range:** 400–600
- **Tracking:** 0em (accessible and clear — no decorative tracking)
- **Leading:** 1.6 body (generous for careful reading)

## Colors
- **Background:** #FFFFFF or #F8F9FA
- **Primary action:** #2563EB (trustworthy blue — empirically associated with safety)
- **Accent:** #059669 (confirmation green for positive trust signals)
- **Elevation model:** clean shadows (0 1px 4px rgba(0,0,0,0.08))

## Motion
- **Tier:** Subtle
- **Spring tokens:** stiffness: 400, damping: 40, mass: 0.9
- **Enter animation:** opacity 0→1, 250ms — predictable, never surprising
- **Forbidden:** unexpected motion, elements that appear from unexpected positions, animations near security indicators or badges

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 6px consistent — neither overly friendly nor overly formal; reliably in between

## Code Pattern
```css
.trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: 6px;
  font-family: 'Source Sans 3', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: #059669;
}

.trust-shield-icon {
  color: #2563EB;
  flex-shrink: 0;
}

.trust-form-field {
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  padding: 12px 16px;
  font-family: 'Source Sans 3', sans-serif;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.trust-form-field:focus {
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  outline: none;
}
```

## Slop Watch
- Using violet or teal as primary instead of blue — decades of UX research show blue is the trust signal; deviating requires strong brand rationale, not just taste preference
- Animating security indicators (shield icons, lock icons, verification badges) — anything that moves near a security signal creates doubt rather than confidence
