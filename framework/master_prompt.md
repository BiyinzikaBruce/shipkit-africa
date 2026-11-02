# ShipKit Master Prompt

> You are building a production Next.js app with **ShipKit**, a framework for shipping real business software for African markets: multi-branch shops, mobile money, staff roles, unreliable internet, and money that must add up.
>
> Read this whole file before writing code. Then read the companion files listed below. These rules override your defaults.

---

## 0. Companion files (read in this order)

1. `project-description.md`: what this app is, who uses it, the data model and pages. Every decision must fit this file. If it doesn't exist yet, stop and run the planning prompt in `shipkit/planning/plan-your-app.md` first.
2. `project-phases.md`: the build plan. Work **one phase at a time**, in order. Stop at the end of each phase and wait for the user to confirm.
3. `shipkit/components.md`: ready-made ShipKit components. **Check it before writing auth guards, money formatting, phone handling, audit logs, branch switching, payments or tables from scratch.**
4. Load these guides only when the project needs them:
   - `shipkit/guides/database.md`: Prisma 7 + PostgreSQL patterns (always, if there is a database)
   - `shipkit/guides/auth-and-roles.md`: Better Auth, roles, organisations and branches
   - `shipkit/guides/payments-africa.md`: mobile money, Flutterwave, Paystack, Stripe
   - `shipkit/guides/design.md`: the visual system for dashboards and POS screens
   - `shipkit/guides/offline-and-sms.md`: poor connectivity, SMS updates, basic phones
   - `shipkit/guides/env-and-deploy.md`: environment variables and deploying to Vercel
   - `shipkit/guides/pre-deploy-review.md`: run before every production deploy

---

## 1. How you work

- **Plan, then build.** Before each phase, list the files you will create or change and why, in a few lines. Then build.
- **One phase at a time.** Finish a phase completely (types pass, pages render, data saves) before starting the next. At the end of each phase, give the user a short summary: what was built, how to test it, and anything they must do (keys, migrations).
- **Never fake it.** No placeholder data in production paths, no `// TODO: implement` in shipped code, no buttons that do nothing. If something can't be finished in this phase, say so in the summary.
- **Don't invent requirements.** If the description doesn't cover a decision that matters (money, permissions, deleting data), ask. For small UI choices, pick a sensible default and mention it.
- **Small, readable files.** One component per file. Server logic in `lib/` or `server/`, not inside page components. Under about 250 lines per file. Split when it grows.
- **Read before you edit.** Open a file before changing it. Never rewrite a whole file to change a few lines.
- **Run the checks.** After each phase run `pnpm tsc --noEmit` and `pnpm lint`, and fix what they report. Don't silence errors with `any`, `@ts-ignore` or disabled lint rules.

---

## 2. Tech stack (don't swap without asking)

| Layer | Use | Notes |
|---|---|---|
| Framework | **Next.js 16** App Router, React 19, TypeScript strict | Server Components by default |
| Database | **PostgreSQL** (Neon in production, Docker locally) | |
| ORM | **Prisma 7** with `prisma.config.ts` + `@prisma/adapter-pg` | See `guides/database.md` |
| Auth | **Better Auth** (email + password, optional Google) | See `guides/auth-and-roles.md` |
| Validation | **Zod** on every input that crosses a boundary | |
| UI | **Tailwind CSS v4** (CSS-first `@theme`) + **shadcn/ui** + Lucide icons | No `tailwind.config.ts` |
| Forms | React Hook Form + `@hookform/resolvers/zod` | |
| Server state | TanStack Query (client) / Server Components (server) | |
| Tables | TanStack Table | |
| Email | Resend + React Email | |
| Cache / rate limit | Upstash Redis | Optional |
| SMS | Africa's Talking | When users need SMS |
| Package manager | **pnpm** | |

---

## 3. Next.js 16 rules

- **Request APIs are async.** Always `await cookies()`, `await headers()`, `await draftMode()`, and `await params` / `await searchParams` in pages, layouts and route handlers.
- **`proxy.ts`, not `middleware.ts`.** Next.js 16 renamed middleware to proxy. Use it only for **fast, optimistic redirects** (for example: no session cookie → `/login`). **Never rely on it for security.** Every route handler and server action checks auth itself.
- **Server Components by default.** Add `"use client"` only to components that need state, effects, browser APIs or event handlers. Never import server-only code (Prisma, secrets) into a client component. Put `import "server-only"` at the top of server modules.
- **Mutations go through Server Actions or route handlers**, never directly from client code to the database.
- **After a mutation**, call `revalidatePath()` / `revalidateTag()` so screens show fresh data.
- **Loading and errors:** every route group has `loading.tsx` and `error.tsx`. Use `notFound()` for missing records.
- Use `next/image` for images and `next/font` for fonts.

---

## 4. Security rules (non-negotiable)

- **Authenticate on the server, every time.** Each server action and route handler starts by loading the session. No session → 401. Don't trust anything the client says about who the user is.
- **Authorise every action.** After authentication, check the role (`requireRole`) **and** the scope: the record must belong to the user's organisation (and branch, where branches apply). Never return or change a record just because the ID was guessed.
- **Users never set their own role, organisation or branch.** In Better Auth, every privilege field (`role`, `organisationId`, `branchId`, `plan`) has `input: false`. Only admin-only server code changes them.
- **Validate all input with Zod** on the server, even if the form already validated it.
- **Fail closed.** If a permission check throws or is unsure, deny.
- **Secrets stay on the server.** Never put a secret in a `NEXT_PUBLIC_` variable. Never log tokens, passwords or full card or MoMo payloads.
- **Webhooks:** verify the provider's signature or secret, compare secrets with `crypto.timingSafeEqual`, and make processing **idempotent**. Store the provider's transaction ID with a unique constraint and ignore repeats.
- **Rate-limit** login, password reset, OTP and payment endpoints (Upstash Ratelimit).
- **Audit sensitive actions.** Use the `audit-log` component: who, what, which record, when, and before/after for edits to money, stock, roles and prices.

---

## 5. Money rules (this is where apps lose trust)

- **Never use JavaScript `number` math for money totals, and never store money as `Float`.** Store amounts in Prisma as `Decimal @db.Decimal(14, 2)` and calculate with `Prisma.Decimal` (or integers in the smallest unit). Convert to a display string only at the edge.
- **Currency is explicit.** Every money field has a currency, stored on the record or fixed for the organisation. Default **UGX**. Format with the `money` component (`formatMoney(amount, "UGX")`). UGX shows no decimals.
- **Totals are computed on the server** from line items, never trusted from the client.
- **Money changes are transactions.** Use `prisma.$transaction` when one action changes several records (a sale plus stock, a payment plus a balance).
- **Nothing is hard-deleted** in money or stock tables. Use `status` / `voidedAt` with a reason, plus an audit log entry.
- **Reconciliation is a feature.** Any app that handles cash or mobile money needs end-of-day or end-of-shift totals by payment method.

---

## 6. Multi-tenant and roles

Most ShipKit apps serve **organisations with branches and staff roles** (for example: Owner → Manager → Cashier). Follow `guides/auth-and-roles.md`:

- Every business record has `organisationId`. Branch-level records also have `branchId`.
- Every query is scoped: `where: { organisationId: session.user.organisationId, ... }`. Use the `scoped-query` helpers so you can't forget.
- Roles are a Prisma `enum`. Each role has a home route (`ROLE_HOME`) and allowed route prefixes.
- The UI hides what a role can't do (`<RoleGate>`), **and** the server refuses it (`requireRole`). Both, always.

---

## 7. Data and Prisma

Follow `guides/database.md`. In short:
- One Prisma client singleton in `lib/prisma.ts`, using `@prisma/adapter-pg`.
- `id String @id @default(cuid())`, plus `createdAt` and `updatedAt` on every model.
- Add `@@index` for every foreign key and for each common filter (`organisationId`, `branchId`, `createdAt`).
- Use migrations (`prisma migrate dev`) once the schema is real. `db push` is for early prototyping only.
- **Paginate every list.** Never `findMany()` without `take`.
- Keep a `prisma/seed.ts` that creates one organisation, one branch and one user per role, so anyone can log in and test.

---

## 8. UI and design

Follow `guides/design.md`:
- **Clean, dense, fast.** These are tools people use all day: a cashier at a till, a manager on a cheap Android phone. Clarity beats decoration.
- Mobile-first. Every screen works at 360px wide. Tap targets are at least 44px.
- Every list has **empty, loading and error states**.
- Every destructive action asks for confirmation and says exactly what will happen.
- Numbers use tabular figures, money is right-aligned, and dates use the user's locale.
- No stock-photo filler, no lorem ipsum, no fake testimonials, no gradient blobs for their own sake.

---

## 9. Performance on real networks

Users are often on 3G, with limited data bundles and low-end Android phones:
- Ship less JavaScript. Prefer Server Components and avoid heavy client libraries for small jobs.
- Show stale data quickly, then refresh in the background.
- Compress and size images (`next/image` with `sizes`).
- Long operations show progress and can be safely retried.
- See `guides/offline-and-sms.md` for offline queues and SMS fallbacks.

---

## 10. Definition of done (every phase)

- [ ] `pnpm tsc --noEmit` and `pnpm lint` pass with no new warnings
- [ ] Every new server action or route checks session, role and organisation scope
- [ ] Every new input is validated with Zod on the server
- [ ] Money uses Decimal, and totals are computed on the server
- [ ] New lists are paginated, with empty, loading and error states
- [ ] Sensitive actions write an audit log entry
- [ ] Works at 360px wide
- [ ] Seed data lets the user test the new feature for every role
- [ ] Phase summary given to the user, then **stop and wait**
