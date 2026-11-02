# Design Guide: dashboards, POS and admin screens

> Load this before building any UI. ShipKit apps are **work tools**: tills, dashboards, stock rooms. People use them for hours, often on cheap Android phones in bright light. Design for speed, clarity and trust.

## 1. Principles

1. **Clarity over decoration.** Every pixel helps someone finish a task.
2. **Numbers are the hero.** Totals, balances and stock are the biggest and clearest things on screen.
3. **Mobile-first.** Design at 360px, then scale up. A cashier's screen is often a phone.
4. **Fast feedback.** Every tap responds within 100ms: pressed state, spinner, toast.
5. **Forgiving.** Confirm destructive actions, allow undo where possible, never lose a half-filled form.

## 2. Tokens (Tailwind v4, `app/globals.css`)

```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --color-brand-50:  #f3f0ff;
  --color-brand-500: #7c5cff;
  --color-brand-600: #6a48f0;
  --color-accent-500: #22d3ee;

  --color-success-500: #16a34a;
  --color-warning-500: #d97706;
  --color-danger-500:  #dc2626;

  --radius-card: 0.875rem;
}
```

- **One brand colour.** Use it for primary buttons, active nav and focus rings, and nothing else.
- **Semantic colours** only carry meaning: green = paid/success, amber = pending/warning, red = failed/destructive.
- Light mode by default for tills (readable in sunlight). Dark mode is optional for admins.
- Change the brand colour per project in `design-style-guide.md` if the client has one. Keep everything else.

## 3. Type and numbers

| Use | Size / weight |
|---|---|
| Page title | `text-2xl font-semibold` |
| Section title | `text-lg font-semibold` |
| Body | `text-sm` (dashboards) / `text-base` (forms) |
| KPI number | `text-3xl font-bold tabular-nums` |
| Money in tables | `text-sm tabular-nums text-right` |

- **`tabular-nums` on every number** so columns line up.
- Money always shows the currency once per context: "UGX 1,250,000" in a header, plain numbers in a column whose header says "Amount (UGX)".
- Big numbers in KPIs can be shortened ("UGX 1.2M") with the full value in a tooltip.

## 4. Layout patterns

**Dashboard (OWNER / MANAGER)**
```
[ KPI ][ KPI ][ KPI ][ KPI ]      ← today: sales, cash, MoMo, items sold
[ Chart: last 7/30 days      ]
[ Table: latest activity     ]
```
- Branch switcher top-right (owners see "All branches").
- Date range picker with presets: Today, Yesterday, This week, This month.

**POS / cashier screen**
- Product search with the keyboard focused on load. Barcode scanners type into it.
- Cart on the right (desktop) or a bottom sheet (phone), with the **total huge and always visible**.
- Payment buttons: **Cash**, **MTN MoMo**, **Airtel Money**, **Card**. Each at least 48px tall.
- After the sale: a receipt view with print, SMS and new-sale actions.

**Tables**
- Search plus 1–3 filters above. Pagination below (25 per page).
- Status as a coloured badge. Row actions in a `⋯` menu. Destructive actions are last and red.
- On phones, rows become cards (key fields only).

## 5. States (every list and page)

| State | Show |
|---|---|
| Loading | Skeleton rows in the real layout (not a lone spinner) |
| Empty | Icon + one sentence + the main action ("No sales yet today. **New sale**") |
| Error | What failed + **Try again** button. Never a raw stack trace |
| Offline | Banner: "You're offline. Changes will sync when you reconnect." |

## 6. Forms

- Labels above fields. Errors under the field in red, in plain words ("Enter a phone number like 0772 123 456").
- Phone inputs accept local formats and normalise them (`phone` component).
- Money inputs: numeric keypad (`inputMode="decimal"`), formatted on blur.
- Primary button bottom-right on desktop, full-width on phones. Disabled while submitting, with a spinner.
- Long forms are split into steps, with progress saved.

## 7. Accessibility

- Contrast at least 4.5:1 for text. Don't rely on colour alone, so badges also have text.
- Every input has a label. Every icon button has `aria-label`.
- Visible focus rings (`focus-visible:ring-2 ring-brand-500`).
- Tap targets at least 44×44px.

## 8. Don'ts

- ❌ Lorem ipsum, stock photos, fake testimonials or made-up stats
- ❌ Gradients, glassmorphism or animations that slow down a till
- ❌ Hiding totals below the fold
- ❌ Icons without labels for important actions
- ❌ More than one primary button per screen
