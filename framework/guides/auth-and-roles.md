# Auth and Roles Guide: Better Auth, organisations, branches

> Load this for any app with logins. Most ShipKit apps have **organisations → branches → staff with roles**.

## 1. The model

```prisma
enum Role { OWNER MANAGER CASHIER }

model Organisation {
  id        String   @id @default(cuid())
  name      String
  currency  String   @default("UGX")
  branches  Branch[]
  users     User[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Branch {
  id             String       @id @default(cuid())
  organisationId String
  name           String
  organisation   Organisation @relation(fields: [organisationId], references: [id], onDelete: Cascade)
  users          User[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  @@index([organisationId])
}
```

The `User` model comes from Better Auth's schema. Add `role`, `organisationId` and `branchId` (nullable for owners who see all branches) as **additional fields**, as shown below.

## 2. Server config: `lib/auth.ts`

```ts
import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // Staff are created by admins → turn off public sign-up:
    // disableSignUp: true,
  },
  user: {
    additionalFields: {
      // input: false = users can NEVER set these themselves (sign-up or profile update).
      role:           { type: "string", defaultValue: "CASHIER", input: false },
      organisationId: { type: "string", required: false, input: false },
      branchId:       { type: "string", required: false, input: false },
    },
  },
  plugins: [nextCookies()], // keep last: lets server actions set auth cookies
});

export type Session = typeof auth.$Infer.Session;
```

> ⚠️ **`input: false` is mandatory on every privilege field.** Better Auth includes additional fields in user input by default, so without it anyone can sign up as `OWNER` or promote themselves through a profile update.

**Who creates staff?** If only admins add users, set `disableSignUp: true` and create accounts from an admin-only server action, using Better Auth's server API or admin plugin. Check the current Better Auth docs for the exact call. Then set `role`, `organisationId` and `branchId` with Prisma in the same action, after checking that the acting user is allowed to.

## 3. Route handler: `app/api/auth/[...all]/route.ts`

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
export const { GET, POST } = toNextJsHandler(auth);
```

## 4. Client: `lib/auth-client.ts`

```ts
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
```

## 5. Two layers of protection

| Layer | File | Job | Security? |
|---|---|---|---|
| Proxy | `proxy.ts` | Fast redirects: not logged in → `/login`, wrong role → role home | ❌ convenience only |
| Server | every action, route and page | `requireSession` → `requireRole` → scope by organisation and branch | ✅ the real gate |

### `proxy.ts` (Next.js 16)

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC = ["/", "/login", "/forgot-password", "/reset-password"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();
  if (!getSessionCookie(req)) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next(); // role checks happen on the server, in each layout/page/action
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"] };
```

The cookie check is **optimistic**: it only proves a cookie exists. The real checks are on the server.

### On the server: use the ShipKit components

```bash
npx shadcn@latest add https://biyinzikabruce.github.io/shipkit-africa/r/require-role.json
```

```ts
// app/manager/layout.tsx
import { requireRole } from "@/lib/shipkit/require-role";
export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["OWNER", "MANAGER"]); // redirects or throws if not allowed
  return <>{children}</>;
}
```

```ts
// in a server action
"use server";
import { requireRole } from "@/lib/shipkit/require-role";
import { scopeWhere } from "@/lib/shipkit/scoped-query";

export async function voidSale(saleId: string, reason: string) {
  const session = await requireRole(["OWNER", "MANAGER"]);
  const sale = await prisma.sale.findFirst({ where: scopeWhere(session, { id: saleId }) });
  if (!sale) throw new Error("Not found"); // also covers "belongs to another org"
  // … void it + audit log
}
```

## 6. In the UI

```tsx
<RoleGate allow={["OWNER", "MANAGER"]}>
  <Button variant="destructive">Void sale</Button>
</RoleGate>
```

`RoleGate` only **hides** things. The server action must still call `requireRole`.

## 7. Role homes

```ts
export const ROLE_HOME = { OWNER: "/dashboard", MANAGER: "/manager", CASHIER: "/cashier" } as const;
```

After login, redirect to `ROLE_HOME[session.user.role]`. Group routes by role (`app/(owner)/dashboard`, `app/manager`, `app/cashier`), each with a layout that calls `requireRole`.

## 8. Checklist

- [ ] `input: false` on `role`, `organisationId`, `branchId` (and `plan`, `credits`, or anything else that grants power)
- [ ] Public sign-up disabled, or it creates a **new organisation with the signer as OWNER** (never joins an existing one)
- [ ] Every role-group layout calls `requireRole`
- [ ] Every server action calls `requireRole` and scopes its queries
- [ ] Login and password reset are rate-limited
- [ ] Changing a user's role writes an audit log entry
