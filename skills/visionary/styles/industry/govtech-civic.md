# Govtech Civic

**Category:** industry
**Motion tier:** Subtle

## Typography
- **Display font:** Source Serif 4 600
- **Body font:** Source Sans 3 400
- **Weight range:** 400–600
- **Tracking:** 0em (accessibility-first — no decorative tracking that reduces legibility)
- **Leading:** 1.6 body (WCAG reading guidance)

## Colors
- **Background:** #FFFFFF
- **Primary action:** #005EA2 (US federal blue / gov.uk blue — trusted, not branded)
- **Accent:** #D83933 (accessible civic red for alerts)
- **Elevation model:** subtle borders (1px solid #DFE1E2) over shadows — cleaner for print-to-screen parity

## Motion
- **Tier:** Subtle
- **Spring tokens:** stiffness: 400, damping: 40, mass: 0.9
- **Enter animation:** opacity 0→1, 200ms — efficient, never decorative
- **Forbidden:** kinetic animation, decorative transitions, anything that increases cognitive load for diverse citizen users

## Spacing
- **Base grid:** 8px (USWDS/GOV.UK compatible)
- **Border-radius vocabulary:** 4px consistent — following government design system standards

## Code Pattern
```css
/* USWDS-compatible patterns */
.civic-alert {
  border-left: 4px solid #005EA2;
  padding: 16px;
  background: #E8F4FD;
  border-radius: 0;
}

.civic-button {
  background: #005EA2;
  color: #FFFFFF;
  border-radius: 4px;
  padding: 10px 20px;
  font-family: 'Source Sans 3', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
}

.civic-button:focus-visible {
  outline: 4px solid #FFBE2E;
  outline-offset: 2px;
}
```

## Slop Watch
- Attempting to "modernize" with gradients or bold brand colors — govtech credibility requires restraint; citizens must trust the form before they submit data
- Reducing focus ring visibility for aesthetics; government interfaces require visible focus states for keyboard and assistive technology users
