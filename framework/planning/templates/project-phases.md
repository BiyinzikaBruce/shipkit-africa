# Project Phases: <App name>

> The build plan. Work **one phase at a time**. At the end of each phase: run the checks in `shipkit/master_prompt.md` §10, summarise, and **wait for the user to confirm** before starting the next.

---

## Phase 1: Foundation
**Goal:** A user can log in and land on their role's home page.

- [ ] Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui set up with pnpm
- [ ] Prisma 7 + PostgreSQL connected (`lib/prisma.ts`, `prisma.config.ts`)
- [ ] Better Auth with roles (`input: false` on role, organisationId and branchId)
- [ ] Organisation, Branch and User models plus a seed with one user per role
- [ ] `proxy.ts` redirects plus server-side `requireRole` helpers
- [ ] App shell: sidebar or bottom nav per role, and a sign-out button

**ShipKit components:** `role-gate`, `require-role`, `scoped-query`, `money`
**Acceptance tests:**
1. Log in as each seeded role, and confirm you land on the right home page.
2. As CASHIER, open a MANAGER URL directly, and confirm you're redirected.
3. Call a manager-only API as CASHIER, and confirm you get 403.

---

## Phase 2: <Core feature>
**Goal:**

- [ ]

**Models / pages:**
**ShipKit components:**
**Acceptance tests:**
1.

---

## Phase N: Polish + pre-deploy review
**Goal:** Ready for real users.

- [ ] Empty, loading and error states on every list
- [ ] Works at 360px wide
- [ ] Run `shipkit/guides/pre-deploy-review.md` and fix every ❌
- [ ] Production env vars set, migrations applied, seed removed or limited
