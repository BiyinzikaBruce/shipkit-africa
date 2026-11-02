# Offline and SMS Guide: weak internet, basic phones

> Load this when users work where data is unreliable, or when some users only have basic phones. In much of Africa this is the normal case, not the edge case.

## 1. Decide what must work offline

Ask in planning: *"If the internet drops for an hour, what must still work?"* Usually:
- ✅ Recording sales, payments or attendance (writes)
- ✅ Viewing today's data already loaded (reads)
- ❌ Reports across branches, user management, settings (need the server)

Only make the must-haves offline. Offline-everything is expensive and error-prone.

## 2. Web apps: the outbox pattern

1. Every offline-capable write gets a **client-generated id** (`crypto.randomUUID()`), created on the device.
2. The write is saved to an **outbox** in IndexedDB first, then the UI updates immediately.
3. A sync loop sends outbox items to a server action when online (`navigator.onLine` + the `online` event), oldest first.
4. The server **upserts by the client id**, so sending the same item twice is harmless (idempotent).
5. On success, the item is removed from the outbox. On a validation error, it's marked failed and shown to the user to fix.
6. The UI shows an **offline banner** and a pending-sync count ("3 sales waiting to sync").

```prisma
model Sale {
  id       String @id            // client-generated UUID, not cuid() from the server
  clientCreatedAt DateTime       // when it happened on the device
  syncedAt DateTime @default(now())
  // …
}
```

Rules:
- **Money and stock are re-validated on the server** at sync time. The device can be wrong, or tampered with.
- Store the device's time *and* the server's time. Device clocks drift.
- Conflicts: for append-only records (sales, payments) there are none. For edits, **last write wins plus an audit log**, unless the project needs something smarter.

## 3. Mobile apps (Expo / React Native)

Same outbox pattern, with **SQLite** (`expo-sqlite`) as the local store. Sync on app start, on reconnect, and on pull-to-refresh.

## 4. SMS for basic phones (Africa's Talking)

Use SMS for **receipts, balance updates, reminders and alerts** to people without smartphones.

```ts
// lib/sms.ts  (confirm the current SDK usage in Africa's Talking docs)
import "server-only";
import AfricasTalking from "africastalking";

const at = AfricasTalking({ apiKey: process.env.AT_API_KEY!, username: process.env.AT_USERNAME! });

export async function sendSms(to: string[], message: string) {
  return at.SMS.send({ to, message, from: process.env.AT_SENDER_ID || undefined });
}
```

Docs: https://developers.africastalking.com/docs/sms/overview

Rules:
- Use `sandbox` as the username while developing. Switch to the live username and key in production.
- Numbers in international format with `+` (`+2567XXXXXXXX`). Use the `phone` component's `toE164()`.
- **Keep messages under 160 characters** (one SMS = one charge). No emoji, because emoji switch the encoding and cut the limit to 70 characters.
- **Send from a queue, not inside the request.** Write an `SmsMessage` row (`PENDING`), and let a background job or cron send it and record `SENT` / `FAILED`.
- Template example: `TPA Shop: Paid UGX 25,000 by MoMo. Ref 7F3K. Bal UGX 0. Thank you!`
- **Respect opt-outs** and only text people who agreed to receive messages.

## 5. Low data, slow phones

- Server Components and streaming: show the shell immediately.
- Keep client bundles small. Check with `pnpm next build` output.
- Images: `next/image` with `sizes`. Avoid large hero images in work apps.
- Cache GET data with TanStack Query (`staleTime` of at least 30s) so revisiting a screen is instant.
- Every button that hits the network can be pressed twice without causing harm. Disable it while pending, and use idempotent server actions.
