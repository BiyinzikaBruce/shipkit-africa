# ShipKit Components: discovery index

> **For AI agents:** before writing any of these from scratch, check this list and install the match.
> Install any item with:
>
> ```bash
> npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/<name>.json
> ```
> Files land in `lib/shipkit/` and `components/shipkit/`. Server helpers expect `lib/auth.ts` (Better Auth) and `lib/prisma.ts`. Client helpers expect `lib/auth-client.ts`. See `shipkit/guides/auth-and-roles.md`.

## Auth & tenancy

- **require-role**: Server-side session and role gate for pages, layouts, server actions and route handlers (Better Auth).
  - Install: `npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/require-role.json`
  - npm: `server-only`
  - TRIGGERS: "protect this page", "admin only", "401/403", "check session in server action", "role-based access"
- **role-gate**: Show UI only to some roles. UI convenience; pair with require-role on the server.
  - Install: `npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/role-gate.json`
  - TRIGGERS: "hide button for cashier", "show only to managers", "conditional UI by role"
- **scoped-query**: Merge organisation and branch scope from the session into every Prisma where/data. Fails closed.
  - Install: `npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/scoped-query.json`
  - TRIGGERS: "filter by organisation", "multi-tenant query", "only my branch", "tenant scope", "organisationId where"
- **audit-log**: Write who-did-what audit entries with before/after snapshots, secrets redacted. Includes the Prisma model.
  - Install: `npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/audit-log.json`
  - npm: `server-only`
  - TRIGGERS: "who changed this", "activity log", "track edits", "void with reason", "history of changes"
- **rate-limit**: Upstash rate-limit presets for login, OTP, password reset, payments and APIs.
  - Install: `npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/rate-limit.json`
  - npm: `server-only`, `@upstash/ratelimit`, `@upstash/redis`
  - TRIGGERS: "too many requests", "brute force", "limit login attempts", "OTP throttling", "429"

## Money & payments

- **money**: Format, shorten and parse money for UGX, KES, TZS, RWF, USD and more. Display-only, so do maths with Decimal.
  - Install: `npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/money.json`
  - TRIGGERS: "format UGX", "show amount", "currency format", "1.2M", "parse amount input", "money field"
- **momo**: Dependency-free MTN MoMo Collections client: access token, request-to-pay, and status lookup.
  - Install: `npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/momo.json`
  - npm: `server-only` · needs: `phone`
  - TRIGGERS: "MTN Mobile Money", "MoMo payment", "request to pay", "collect payment by phone", "mobile money API"
- **webhook-verify**: Constant-time HMAC and shared-secret verification for payment webhooks (Paystack, Flutterwave, …).
  - Install: `npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/webhook-verify.json`
  - npm: `server-only`
  - TRIGGERS: "verify webhook", "Paystack signature", "Flutterwave verif-hash", "HMAC", "timingSafeEqual"
- **use-payment-status**: Poll your payment status endpoint while a mobile-money prompt is pending. Pauses when hidden, stops on final status or timeout.
  - Install: `npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/use-payment-status.json`
  - TRIGGERS: "wait for payment", "poll MoMo status", "payment pending spinner"

## Phones & SMS

- **phone**: Normalise East African mobile numbers to E.164 (SMS) or MSISDN (MoMo), validate, format locally, and detect network with your own prefix map.
  - Install: `npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/phone.json`
  - TRIGGERS: "phone number", "normalise phone", "+256", "MSISDN", "validate mobile number", "MTN or Airtel?"
- **sms**: Send SMS through Africa's Talking's REST API with phone normalisation and a segment-length helper.
  - Install: `npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/sms.json`
  - npm: `server-only` · needs: `phone`
  - TRIGGERS: "send SMS", "text message receipt", "Africa's Talking", "notify basic phone", "SMS alert"

## Dashboard UI

- **kpi-card**: Dashboard number card with short money format, full value on hover, and % change.
  - Install: `npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/kpi-card.json`
  - needs: `card`, `utils`, `money`
  - TRIGGERS: "dashboard stat", "today's sales card", "metric tile", "total revenue card"
- **status-badge**: Consistent, accessible badges for payment, order and sync statuses.
  - Install: `npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/status-badge.json`
  - needs: `utils`
  - TRIGGERS: "status pill", "paid/pending/failed badge", "colored status"
- **data-table**: Server-paginated TanStack table with URL-based page and debounced search.
  - Install: `npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/data-table.json`
  - npm: `@tanstack/react-table` · needs: `table`, `button`, `input`
  - TRIGGERS: "table with pagination", "list sales", "search table", "server-side pagination"
- **empty-state**: Icon, one sentence and the main action for empty lists.
  - Install: `npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/empty-state.json`
  - needs: `utils`
  - TRIGGERS: "no data yet", "empty list", "nothing here"
- **branch-switcher**: Switch the branch a page shows via ?branch=, with an optional All branches item.
  - Install: `npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/branch-switcher.json`
  - needs: `select`
  - TRIGGERS: "switch branch", "select location", "all branches"
- **offline-banner**: useOnline() hook plus a banner showing offline status and pending sync count.
  - Install: `npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/offline-banner.json`
  - TRIGGERS: "offline", "no internet", "sync pending", "navigator.onLine"
