# Frutiger Aero (Extended)

**Category:** extended/retrofuturism
**Motion tier:** Kinetic

## Typography
- **Display font:** Frutiger 95 Black or Myriad Pro Bold
- **Body font:** Trebuchet MS, Tahoma, Segoe UI (Windows 2006-era system fonts)
- **Tracking:** 0.02em | **Leading:** 1.4
- **Feature:** Text glows with colored shadows on interactive states

## Colors
- **Background:** linear-gradient(135deg, #B0E0FF 0%, #E8D4F8 50%, #D4F0E8 100%) — cascading Vista pastels
- **Primary action:** #4A90D9 (Vista button blue)
- **Accent:** #72C152 (nature green)
- **Secondary:** #FF9D6D (coral for alerts), #FFE066 (sun yellow)
- **Elevation model:** chrome + glass + shine overlays with colored glows

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 380, damping: 23, mass: 0.88 }` — springy, playful, responsive
- **Enter animation:** slide-in with glass-flip — elements slide from edge while glass overlay swipes, 0.6s
- **Micro-interactions:** hover lift with shadow depth, buttons pulse with light glow, drag has momentum
- **Forbidden:** minimal aesthetics, dark modes, sharp transitions, silence (all motion must be noticeable)

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 4–12px — the "just-right" Vista roundness (not too flat, not too round)
- **Elevation system:** 4px shadow for normal, 12px for hover, 20px for active

## Code Pattern
```css
.aero-window {
  background: linear-gradient(135deg, #B0E0FF, #E8D4F8);
  border: 2px solid #4A90D9;
  border-radius: 8px;
  box-shadow: 
    0 8px 24px rgba(74, 144, 217, 0.3),
    inset 0 1px 0 rgba(255,255,255,0.9),
    inset 0 -2px 0 rgba(0,0,0,0.1);
  padding: 16px;
  position: relative;
  overflow: hidden;
}

.aero-window::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 60%;
  background: linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%);
  border-radius: 6px 6px 0 0;
  pointer-events: none;
}

.aero-button {
  background: linear-gradient(180deg, #6BA3E5, #4A90D9);
  border: 1px solid #2E5AA8;
  border-radius: 4px;
  padding: 8px 16px;
  color: #FFFFFF;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: all 200ms ease;
}

.aero-button:hover {
  background: linear-gradient(180deg, #7BB3F5, #5A9FE5);
  box-shadow: 0 4px 12px rgba(74, 144, 217, 0.4);
  transform: translateY(-2px);
}

.aero-button:active {
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
  transform: translateY(0);
}

@media (prefers-reduced-motion: no-preference) {
  .aero-element {
    animation: aero-pulse 4s ease-in-out infinite;
  }
  
  @keyframes aero-pulse {
    0%, 100% { text-shadow: 0 0 0 rgba(74, 144, 217, 0); }
    50% { text-shadow: 0 0 12px rgba(74, 144, 217, 0.6); }
  }
}
```

## Slop Watch
- Every surface must have at least one glass sheen overlay — flat Aero breaks the aesthetic
- Colors must stay in the 2006 palette (sky blues, pastels, nature greens) — no modern saturated colors
- Shadows should be subtle blue-tinted, not grey — the blue shadow is the period marker
- Typography must use Vista-era fonts — modern sans-serifs destroy the time-capsule feeling
- Buttons need visible depth (gradient + shadow) — flat buttons are not Aero
