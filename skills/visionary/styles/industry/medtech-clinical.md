# Medtech Clinical

**Category:** industry
**Motion tier:** Subtle

## Typography
- **Display font:** IBM Plex Sans 500–600
- **Body font:** IBM Plex Sans 400
- **Weight range:** 400–600
- **Tracking:** 0em (clinical precision — no decorative tracking)
- **Leading:** 1.5 body, 1.25 display

## Colors
- **Background:** #F8F9FA
- **Primary action:** #007AFF (clinical blue — unambiguous, universally recognized)
- **Accent:** #34C759 (positive status green)
- **Elevation model:** subtle shadows (0 1px 3px rgba(0,0,0,0.08))

## Motion
- **Tier:** Subtle
- **Spring tokens:** stiffness: 500, damping: 40, mass: 0.7
- **Enter animation:** opacity 0→1 over 200ms — fast, clinical, no distraction
- **Forbidden:** bounce, kinetic animation, anything that could distract a clinician during a procedure

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 4px everywhere — consistent, not designed, just functional

## Code Pattern
```css
.clinical-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 4px;
  border-left: 4px solid #FF3B30;
  background: #FFF5F5;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1A1A1A;
}

.clinical-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #6B7280;
}
```

## Slop Watch
- Using playful rounded corners (12px+) near patient data; clinical interfaces must signal precision, not approachability
- Adding animation to status indicators; clinical status must update in place without motion that could be mistaken for a system action

**WCAG AAA required for all text in patient-facing views.**
