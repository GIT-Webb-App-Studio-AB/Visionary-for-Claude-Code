# Anxiety Urgency

**Category:** emotional
**Motion tier:** Kinetic

## Typography
- **Display font:** Helvetica Neue 700 or Inter 700 (familiar, everyday — anxiety uses known, not exotic)
- **Body font:** Inter 400
- **Weight range:** 400–700
- **Tracking:** 0em body, 0.05em uppercase labels (urgency labels must be clear)
- **Leading:** 1.3 (tight — urgency compresses space)

## Colors
- **Background:** #FFFFFF or #FFF5F5 (barely-there warning tint)
- **Primary action:** #EF4444 (urgent red)
- **Accent:** #F97316 (warning amber for secondary urgency)
- **Elevation model:** hard prominent shadows (0 4px 12px rgba(239, 68, 68, 0.25))

## Motion
- **Tier:** Kinetic (purposeful, not decorative)
- **Spring tokens:** stiffness: 600, damping: 25, mass: 0.6
- **Enter animation:** notifications slide in from top with bounce, timers pulse at critical thresholds
- **Forbidden:** slow transitions that delay urgent information, gentle easing on countdown timers

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 4px indicators, 8px alerts, 999px countdown badges

## Code Pattern
```css
@keyframes urgent-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}

.urgency-indicator {
  background: #EF4444;
  color: white;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  animation: urgent-pulse 1.5s ease-in-out infinite;
}

.urgency-countdown {
  font-size: 2.5rem;
  font-weight: 700;
  font-feature-settings: 'tnum' 1;
  color: #EF4444;
  line-height: 1;
}
```

**Blocked contexts:** Healthcare, Children's products, Mental health apps

## Slop Watch
- Using urgency animation indiscriminately — anxiety/urgency is the style for scarcity-driven commerce; it is actively harmful in healthcare or mental health contexts
- Pulsing elements that are not genuinely time-sensitive; false urgency is immediately recognized and destroys credibility
