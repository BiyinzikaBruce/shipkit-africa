# Project Description: <App name>

> Written during planning (see `shipkit/planning/plan-your-app.md`). This is the source of truth for **what** we're building. Update it when decisions change.

## 1. Summary
<2–3 sentences: what the app does, for whom, and the main problem it solves.>

## 2. Users and roles

| Role | Who they are | Home page |
|---|---|---|
| OWNER | | `/dashboard` |
| MANAGER | | `/manager` |
| CASHIER | | `/cashier` |

### Permissions

| Action | OWNER | MANAGER | CASHIER |
|---|---|---|---|
| Example: create a sale | ✅ | ✅ | ✅ |
| Example: void a sale | ✅ | ✅ | ❌ |
| Example: change prices | ✅ | ❌ | ❌ |

## 3. Tenancy
- [ ] Single business  /  [ ] Many organisations (multi-tenant)
- [ ] Branches / locations: <yes/no, and how staff are assigned>

## 4. Money
- Currency: <UGX / KES / TZS / RWF / USD …>
- Payment methods: <cash, MTN MoMo, Airtel Money, card …>
- Reconciliation: <end of shift / end of day, by payment method>
- Never-wrong rules: <for example: stock can't go negative; a sale total equals the sum of its lines>

## 5. Data model

```prisma
// List every model with its key fields and relations.
// Money = Decimal @db.Decimal(14, 2). Business records have organisationId (and branchId where needed).
```

## 6. Pages

### OWNER
- `/dashboard`: <what's on it>

### MANAGER
- `/manager`: <…>

### CASHIER
- `/cashier`: <…>

## 7. Notifications
| Trigger | Channel (email / SMS) | To |
|---|---|---|

## 8. Integrations and environment variables
| Service | Why | Env vars |
|---|---|---|
| PostgreSQL (Neon) | Database | `DATABASE_URL` |
| Better Auth | Login | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` |

## 9. Out of scope (for v1)
- <…>
