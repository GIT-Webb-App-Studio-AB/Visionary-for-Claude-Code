# SaaS B2B Dashboard

**Category:** industry
**Motion tier:** Subtle → Expressive (scales with archetype)

## Typography
- **Display font:** Space Grotesk 600–700
- **Body font:** DM Sans 400 (with tabular-nums for data cells)
- **Weight range:** 400–700
- **Tracking:** -0.01em display, 0em body
- **Leading:** 1.2 display, 1.5 body, 1.0 table rows

## Colors
- **Background:** #F8F9FA
- **Primary action:** #2563EB
- **Accent:** #10B981
- **Elevation model:** shadows (0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06))

## Motion
- **Tier:** Subtle for data tables, Expressive for onboarding flows
- **Spring tokens:** stiffness: 350, damping: 35, mass: 0.8
- **Enter animation:** skeleton → content fade (300ms), row stagger 30ms per row
- **Forbidden:** kinetic animation near financial data, surprise transitions during active user tasks

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 6px cards and inputs, 4px table rows, 999px status badges — functional variation

## Code Pattern
```tsx
const DashboardCard = ({ title, metric, trend }: CardProps) => (
  <div className="rounded-md bg-white p-6 shadow-sm border border-gray-100">
    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
      {title}
    </p>
    <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-gray-900">
      {metric}
    </p>
    <span className={`inline-flex items-center text-sm font-medium ${
      trend > 0 ? 'text-emerald-600' : 'text-red-500'
    }`}>
      {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
    </span>
  </div>
);
```

## Slop Watch
- Using a gradient primary button; B2B dashboards signal reliability through flatness, not consumer-style gradients
- Animating chart data on every re-render; data should update in place, not re-animate when filters change
