# Pre-Deploy Review

> Run this before every production deploy. Ask your agent: *"Run shipkit/guides/pre-deploy-review.md against this codebase and report ✅ / ❌ for each item, with file paths for every ❌."* Fix every ❌ before shipping.

## 🔐 Auth and permissions
- [ ] Every server action and route handler loads the session and returns 401 without one
- [ ] Every privileged action calls `requireRole` with the right roles
- [ ] Every query on business data is scoped by `organisationId` (and `branchId` where relevant)
- [ ] `input: false` on every privilege field in Better Auth (`role`, `organisationId`, `branchId`, `plan`)
- [ ] Public sign-up is disabled, or it creates a new organisation (never joins an existing one)
- [ ] Login, password reset, OTP and payment endpoints are rate-limited
- [ ] No route relies on `proxy.ts` alone for protection

## 💰 Money and data integrity
- [ ] No money stored as `Float`. No money math with plain JS numbers
- [ ] Totals are recomputed on the server from line items
- [ ] Multi-record changes use `prisma.$transaction`
- [ ] Stock can't go negative under concurrent sales
- [ ] Money and stock records are voided, not deleted, and each void has a reason and an audit entry
- [ ] Payments are marked paid only after server-side verification with the provider
- [ ] Webhook signatures are verified (`timingSafeEqual`) and processing is idempotent (`@unique` provider ids)

## 🧾 Validation and errors
- [ ] Every server input is validated with Zod
- [ ] Errors shown to users are plain language, with no stack traces or SQL
- [ ] `error.tsx` and `not-found.tsx` exist for each route group

## 🔑 Secrets and config
- [ ] `.env*` ignored, `.env.example` complete and committed
- [ ] No secrets in `NEXT_PUBLIC_*`, client components or logs
- [ ] `lib/env.ts` validates required variables
- [ ] Production uses live keys, development uses test keys, and they're never mixed

## ⚡ Performance
- [ ] Every list is paginated (no unbounded `findMany`)
- [ ] Indexes exist for foreign keys and common filters
- [ ] No large client-only libraries for small jobs
- [ ] Images use `next/image` with `sizes`

## 📱 UX
- [ ] Every screen works at 360px wide
- [ ] Loading, empty and error states on every list
- [ ] Destructive actions confirm first
- [ ] Buttons are disabled while submitting (no double charges or double sales)

## 🚀 Release
- [ ] `pnpm tsc --noEmit`, `pnpm lint` and `pnpm build` pass
- [ ] `prisma migrate deploy` has run on production
- [ ] Seed or test users removed, or their passwords changed, in production
- [ ] Production URL added to OAuth redirects and payment webhooks
- [ ] Owner can log in, and each role reaches only its own pages
