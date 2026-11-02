<div align="center">

# 🚢 ShipKit

**Build production Next.js apps for African businesses with AI coding agents.**

Roles and branches · Mobile money · SMS · Weak internet · Money that adds up

[🌐 Docs](https://biyinzikabruce.github.io/shipkit-africa/) · [🧩 Components](https://biyinzikabruce.github.io/shipkit-africa/#components) · [📦 npm](https://www.npmjs.com/package/shipkit-africa)

```bash
npx shipkit-africa init
```

By **[Biyinzika Bruce](https://github.com/BiyinzikaBruce)** · Tech Power Africa

</div>

---

## Why ShipKit

AI agents write code fast, but out of the box they write it for a generic Silicon Valley SaaS. Business software in Kampala, Nairobi or Kigali needs different things, and the gaps cost real money:

| Real-world need | What agents usually do | What ShipKit makes them do |
|---|---|---|
| Owner → Manager → Cashier, across branches | One "admin" flag, no branch scoping | Role enums, `requireRole` on every action, every query scoped to organisation and branch |
| Mobile money (MTN, Airtel) | Stripe only | MoMo request-to-pay pattern, server-side verification, idempotent webhooks |
| Money that must add up | Floats and client-side totals | `Decimal` everywhere, server-computed totals, transactions, no hard deletes |
| Users with basic phones | Email only | SMS receipts and alerts via Africa's Talking |
| 3G, cheap Android phones | Heavy client bundles | Server Components, offline outbox, 360px-first UI |
| Security | Trusts the client | `input: false` on roles, Zod on every input, audit logs, rate limits |

## What's inside

| Part | Where | What it is |
|---|---|---|
| **Framework** | [`framework/`](./framework) | `master_prompt.md`, the planning workflow and 7 guides your agent reads |
| **Components** | [`registry/`](./registry) | 17 shadcn-installable pieces: auth guards, tenancy, money, phone, MoMo, SMS, webhooks, dashboard UI |
| **Installer** | [`cli/`](./cli) | `npx shipkit-africa init` drops the framework and agent rules into any project |
| **Checks** | [`typecheck/`](./typecheck) | Compiles every component (strict TS) and unit-tests the helpers |
| **Docs site** | [`index.html`](./index.html) | https://biyinzikabruce.github.io/shipkit-africa/ |

## Quick start

```bash
# 1. In a new or existing Next.js project
npx shipkit-africa init

# 2. Ask your agent (Claude Code, Cursor, …):
#    "Plan my app with shipkit/planning/plan-your-app.md"
#    → answer its questions → review project-description.md + project-phases.md

# 3. Then: "Build phase 1". It builds one phase at a time and stops for your review.
```

## Components

Install any component with shadcn:

```bash
npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/<name>.json
```

| Group | Components |
|---|---|
| Auth and tenancy | `require-role` · `role-gate` · `scoped-query` · `audit-log` · `rate-limit` |
| Money and payments | `money` · `momo` · `webhook-verify` · `use-payment-status` |
| Phones and SMS | `phone` · `sms` |
| Dashboard UI | `kpi-card` · `status-badge` · `data-table` · `empty-state` · `branch-switcher` · `offline-banner` |

Full list with descriptions: [`framework/components.md`](./framework/components.md).

## Supported agents

Claude Code (`CLAUDE.md`) · Codex and other `AGENTS.md` agents · Cursor (`.cursor/rules`) · Gemini CLI (`GEMINI.md`) · GitHub Copilot (`.github/copilot-instructions.md`) · Windsurf (`.windsurf/rules`)

## Contributing

Ideas and fixes are welcome: open an issue or PR. Please read [`CLAUDE.md`](./CLAUDE.md) first. It has the rules for working on this repo (and every component must pass `npm run typecheck` and `npm test` in `typecheck/`).

## License

MIT © 2026 Biyinzika Bruce
