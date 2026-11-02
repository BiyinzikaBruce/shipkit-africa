# Database Guide: Prisma 7 + PostgreSQL

> Load this whenever the project has a database. Prisma 7 changed how configuration works, so follow these patterns rather than older Prisma tutorials.

## 1. Packages

```bash
pnpm add @prisma/client @prisma/adapter-pg pg dotenv
pnpm add -D prisma @types/pg tsx
```

## 2. `prisma.config.ts` (project root)

Prisma 7 reads its configuration here, and **doesn't load `.env` files automatically**, so load them yourself:

```ts
import { config } from "dotenv";
config({ path: ".env.local" });
config(); // falls back to .env
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: env("DATABASE_URL") },
});
```

## 3. `prisma/schema.prisma` header

```prisma
generator client {
  provider = "prisma-client"
  output   = "../lib/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

Add `lib/generated/` to `.gitignore`. Run `pnpm prisma generate` after every schema change (put it in `postinstall` too).

## 4. One client: `lib/prisma.ts`

```ts
import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

Never create `new PrismaClient()` anywhere else.

## 5. Model conventions

```prisma
model Sale {
  id             String     @id @default(cuid())
  organisationId String
  branchId       String
  cashierId      String
  status         SaleStatus @default(COMPLETED)
  currency       String     @default("UGX")
  subtotal       Decimal    @db.Decimal(14, 2)
  discount       Decimal    @default(0) @db.Decimal(14, 2)
  total          Decimal    @db.Decimal(14, 2)
  voidedAt       DateTime?
  voidReason     String?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  organisation Organisation @relation(fields: [organisationId], references: [id], onDelete: Cascade)
  branch       Branch       @relation(fields: [branchId], references: [id])
  cashier      User         @relation(fields: [cashierId], references: [id])
  items        SaleItem[]

  @@index([organisationId, createdAt])
  @@index([branchId, createdAt])
  @@map("sales")
}
```

- `cuid()` ids, `createdAt` and `updatedAt` on everything.
- **Money = `Decimal @db.Decimal(14, 2)`**, never `Float`.
- **Enums** for roles and statuses (`enum Role { OWNER MANAGER CASHIER }`).
- **`@@index`** on foreign keys and common filters. Composite `(organisationId, createdAt)` indexes make "this org's latest records" fast.
- **Soft-delete** money and stock records (`status` / `voidedAt`). Hard-delete only throwaway data.
- `@@map("snake_case")` table names keep raw SQL readable.
- **External IDs** (MoMo reference, Flutterwave tx id) get `@unique`. That's what makes webhooks idempotent.

## 6. Working with Decimal

```ts
import { Prisma } from "@/lib/generated/prisma/client";

const subtotal = items.reduce(
  (sum, i) => sum.plus(new Prisma.Decimal(i.unitPrice).times(i.quantity)),
  new Prisma.Decimal(0),
);
const total = subtotal.minus(discount);
if (total.isNegative()) throw new Error("Total cannot be negative");
```

Convert to `number` **only for display** (`total.toNumber()`), then format with the `money` component. Before passing a Decimal to a Client Component, serialise it (`total.toString()`), because Decimals aren't plain objects.

## 7. Queries

- **Always scope by organisation** (and branch). Use the `scoped-query` component: `const where = scopeWhere(session, { status: "COMPLETED" })`.
- **Always paginate:** `take` + `skip` (or cursor). Default page size 25, max 100.
- **Select only what you need** (`select: { id: true, total: true }`) on lists.
- **Transactions** for multi-record changes:

```ts
await prisma.$transaction(async (tx) => {
  const sale = await tx.sale.create({ data: { /* … */ } });
  for (const item of items) {
    const updated = await tx.productStock.updateMany({
      where: { productId: item.productId, branchId, quantity: { gte: item.quantity } },
      data: { quantity: { decrement: item.quantity } },
    });
    if (updated.count === 0) throw new Error(`Not enough stock for ${item.productId}`);
  }
  return sale;
});
```

The conditional `updateMany` (`quantity: { gte }`) stops stock going negative even when two cashiers sell the last item at the same moment.

## 8. Migrations and seed

| Stage | Command |
|---|---|
| Early prototyping | `pnpm prisma db push` |
| Real schema (from Phase 2 on) | `pnpm prisma migrate dev --name <change>` |
| Production deploy | `pnpm prisma migrate deploy` |
| Seed | `pnpm prisma db seed` |
| Browse data | `pnpm prisma studio` |

`prisma/seed.ts` creates one organisation, one branch, and one user per role with known test passwords. Never run it against production with real data.

## 9. Local Postgres

```bash
docker run -d --name pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app -p 5432:5432 postgres:16-alpine
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app"
```

## 10. Neon in production

Use Neon's **pooled** connection string for the app (serverless functions open many connections). If `migrate deploy` has trouble through the pooler, run migrations with Neon's **direct** (non-pooled) connection string instead.
