# Environment and Deploy Guide

> Load this when adding a service or deploying. For where to get each key, step by step, see the **Environment Variables Cheatsheet**: https://biyinzikabruce.github.io/env-cheatsheet/

## 1. Files

| File | Committed? | Purpose |
|---|---|---|
| `.env.example` | ✅ yes | Every variable name with a placeholder. The checklist for new developers |
| `.env.local` | ❌ never | Your real development values |
| Vercel / host env settings | n/a | Production and preview values |

`.gitignore` must contain:
```
.env
.env.*
!.env.example
```

## 2. Validate env at startup: `lib/env.ts`

```ts
import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  RESEND_API_KEY: z.string().startsWith("re_").optional(),
  // add each service here
});

export const env = schema.parse(process.env);
```

The app fails fast with a clear message instead of crashing later on a missing key. Import `env` instead of reading `process.env` directly in server code.

## 3. Rules

- `NEXT_PUBLIC_*` variables are **visible to everyone**. Never put a secret there.
- **Different keys per environment** (dev / preview / production). Test-mode payment keys never go to production, and live keys never go to development.
- Generate secrets with `openssl rand -base64 32` (or the Secret Generator: https://biyinzikabruce.github.io/tools/secret-generator/).
- Rotate any key that was ever committed, pasted in chat or shown on screen.

## 4. Deploy to Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add every variable from `.env.example` for **Production** and **Preview**.
3. Build command: `prisma generate && next build` (or `postinstall: prisma generate`).
4. Run migrations against production: `pnpm prisma migrate deploy` (from CI or locally with the production `DATABASE_URL`).
5. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the real domain (no trailing slash).
6. Add the production URL to OAuth redirect URIs and payment webhook settings.
7. Run `shipkit/guides/pre-deploy-review.md` before announcing the launch.

## 5. Cron jobs

Use Vercel Cron for daily reports, SMS queues and expiring payments. Protect each cron route with a `CRON_SECRET` header check. Remember that cron schedules run in **UTC** (East Africa is UTC+3).
