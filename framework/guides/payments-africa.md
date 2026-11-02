# Payments Guide: mobile money, Flutterwave, Paystack, Stripe

> Load this when the app takes or sends money online. Payment APIs change, so **always confirm endpoints, headers and webhook signatures against the provider's current official docs** (links below) before coding. This guide gives the patterns that don't change.

## 1. Pick the right rail

| Need | Use | Docs |
|---|---|---|
| MTN Mobile Money directly (collections, payouts) | **MTN MoMo API** | https://momodeveloper.mtn.com/ |
| Mobile money + cards + bank in many African countries, one integration | **Flutterwave** | https://developer.flutterwave.com/docs/introduction |
| Cards, bank and mobile money (strong in Nigeria, Ghana, Kenya, South Africa) | **Paystack** | https://paystack.com/docs |
| International cards, subscriptions | **Stripe** | https://docs.stripe.com/ |
| SMS receipts and alerts | **Africa's Talking** | https://developers.africastalking.com/docs/sms/overview |

Not sure? An aggregator (Flutterwave or Paystack) covers more methods with one integration. Go direct to MTN MoMo when you need the lowest fees or MTN-specific flows.

## 2. The pattern that never changes

```
1. Server creates a Payment row        status=PENDING, amount, currency, reference (unique)
2. Server asks the provider to charge   (request-to-pay / checkout link)
3. Customer approves                    (MoMo PIN prompt on their phone / card page)
4. Provider tells you                   webhook/callback  — or you poll the status
5. Server VERIFIES with the provider    fetch the transaction by id from the provider's API
6. Server marks paid, idempotently      only if amount + currency + reference match
```

**Never mark something paid because the browser said so.** A redirect to `/success?status=paid` proves nothing. Only step 5 counts.

## 3. Payment model

```prisma
enum PaymentStatus { PENDING SUCCESSFUL FAILED CANCELLED }
enum PaymentProvider { MTN_MOMO FLUTTERWAVE PAYSTACK STRIPE CASH }

model Payment {
  id                String          @id @default(cuid())
  organisationId    String
  provider          PaymentProvider
  status            PaymentStatus   @default(PENDING)
  amount            Decimal         @db.Decimal(14, 2)
  currency          String
  reference         String          @unique   // YOUR id, sent to the provider
  providerTxId      String?         @unique   // THEIR id. Unique = idempotent webhooks
  payerPhone        String?
  failureReason     String?
  rawStatus         String?                   // provider's status text, for support
  paidAt            DateTime?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  @@index([organisationId, createdAt])
}
```

## 4. MTN MoMo API: collections ("request to pay")

How the flow works (confirm details at https://momodeveloper.mtn.com/):

1. **Sign up** on the developer portal and **subscribe** to the *Collections* product. You get a **subscription key** (`Ocp-Apim-Subscription-Key`).
2. **Sandbox:** create an **API user** and **API key** with the sandbox provisioning endpoints. In production, MTN issues these when you go live.
3. **Get an access token:** call the collection token endpoint with Basic auth (API user : API key), plus the subscription key header. Cache it until it expires.
4. **Request to pay:** `POST` request-to-pay with:
   - a new **UUID v4** in `X-Reference-Id`. This is the payment's reference, so store it.
   - `X-Target-Environment` (`sandbox` while testing)
   - body: amount, currency, your `externalId`, payer `{ partyIdType: "MSISDN", partyId: "2567XXXXXXXX" }`, payer message and payee note
   - The API answers **202 Accepted**. The customer now gets a PIN prompt.
5. **Get the result:** poll the request-to-pay **status** endpoint with that reference until it's no longer `PENDING`, and/or receive the callback. Then **verify** (step 5 above) and update your `Payment`.

Practical rules:
- Phone numbers go in **international format without `+`** (`2567XXXXXXXX`). Use the `phone` component's `toMsisdn()`.
- The **sandbox uses test currency and test numbers**, not real money. Read the sandbox notes on the portal.
- **Poll with backoff** (for example every 5s for 2 minutes), then mark `FAILED`/expired and let the cashier retry. Customers often miss the first prompt.
- Show the cashier a clear **waiting** state: "Prompt sent to 0772 123 456. Ask the customer to enter their PIN."
- Keep MoMo keys **server-only**. Use separate keys per environment.

## 5. Flutterwave / Paystack (hosted checkout)

1. Server creates `Payment` (PENDING) with your unique `reference`.
2. Server calls the provider's **initialize / payment-link** endpoint and gets a checkout URL. Redirect the customer there, or open the provider's inline checkout.
3. Customer pays by card, mobile money or bank.
4. Provider sends a **webhook** to your route handler.
5. **Verify the webhook signature** using the provider's documented method. For example, Paystack signs the raw body with HMAC SHA512 in `x-paystack-signature`. Compare with `crypto.timingSafeEqual`, and reject on mismatch.
6. **Re-fetch the transaction** from the provider's verify endpoint by its id or reference. Confirm `status`, `amount` and `currency` match your `Payment`.
7. Update inside a transaction. Thanks to `providerTxId @unique`, a duplicate webhook can't double-credit.

```ts
// app/api/webhooks/paystack/route.ts  (shape only, confirm details in Paystack docs)
import crypto from "node:crypto";
export async function POST(req: Request) {
  const raw = await req.text(); // RAW body: needed for the signature
  const sig = req.headers.get("x-paystack-signature") ?? "";
  const expected = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!).update(raw).digest("hex");
  const ok = sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!ok) return new Response("Invalid signature", { status: 401 });
  const event = JSON.parse(raw);
  // → verify with Paystack's API by reference, then idempotent update
  return new Response("ok");
}
```

Always answer webhooks quickly with `200`. Do slow work after verifying, and make retries harmless.

## 6. Stripe

Use **Checkout Sessions** for one-off payments and **Billing** for subscriptions. Verify webhooks with `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)`. For local testing, run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

## 7. Cash is a payment method too

Record cash with `provider: CASH` and `status: SUCCESSFUL` immediately. The **end-of-shift report** compares expected cash (sum of cash payments) with counted cash, and records the difference with a reason.

## 8. Checklist

- [ ] `Payment.reference` and `providerTxId` are `@unique`
- [ ] Nothing is marked paid without server-side verification against the provider
- [ ] Webhook signatures are verified with `timingSafeEqual` on the **raw** body
- [ ] Amount and currency are compared before marking paid
- [ ] Payment endpoints are rate-limited
- [ ] Test keys in development, live keys only in production env vars
- [ ] Every status change writes an audit log entry
- [ ] Cashier UI handles pending, failed and retry clearly
