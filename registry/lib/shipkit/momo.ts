/**
 * ShipKit · momo
 * Minimal, dependency-free client for the MTN MoMo **Collections** API
 * ("request to pay"). Server-only. Confirm endpoints and environments for your
 * country at https://momodeveloper.mtn.com/ before going live.
 *
 * Env vars:
 *   MOMO_BASE_URL            e.g. https://sandbox.momodeveloper.mtn.com
 *   MOMO_TARGET_ENVIRONMENT  "sandbox" while testing; MTN tells you the live value
 *   MOMO_SUBSCRIPTION_KEY    Collections primary key (Ocp-Apim-Subscription-Key)
 *   MOMO_API_USER            API user (UUID)
 *   MOMO_API_KEY             API key for that user
 *   MOMO_CALLBACK_URL        optional, your callback route
 *
 * Flow:
 *   const ref = await requestToPay({ amount: "25000", currency: "UGX", phone: "0772123456", externalId: payment.id });
 *   // save ref on your Payment row, then poll:
 *   const s = await getRequestToPayStatus(ref);  // s.status: PENDING | SUCCESSFUL | FAILED
 */
import "server-only";
import { randomUUID } from "node:crypto";
import { toMsisdn, type CountryCode } from "@/lib/shipkit/phone";

export type MomoStatus = "PENDING" | "SUCCESSFUL" | "FAILED";

export interface MomoStatusResult {
  status: MomoStatus;
  amount?: string;
  currency?: string;
  financialTransactionId?: string;
  externalId?: string;
  reason?: unknown;
}

export class MomoError extends Error {
  status: number;
  body?: string;
  constructor(status: number, message: string, body?: string) {
    super(message);
    this.status = status;
    this.body = body;
    this.name = "MomoError";
  }
}

function config() {
  const env = process.env;
  const required = ["MOMO_BASE_URL", "MOMO_TARGET_ENVIRONMENT", "MOMO_SUBSCRIPTION_KEY", "MOMO_API_USER", "MOMO_API_KEY"] as const;
  for (const k of required) if (!env[k]) throw new Error(`Missing env var ${k}`);
  return {
    baseUrl: env.MOMO_BASE_URL!.replace(/\/$/, ""),
    targetEnv: env.MOMO_TARGET_ENVIRONMENT!,
    subscriptionKey: env.MOMO_SUBSCRIPTION_KEY!,
    apiUser: env.MOMO_API_USER!,
    apiKey: env.MOMO_API_KEY!,
    callbackUrl: env.MOMO_CALLBACK_URL,
  };
}

let cachedToken: { value: string; expiresAt: number } | null = null;

/** Get (and cache) a Collections access token. */
export async function getMomoToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;
  const c = config();
  const res = await fetch(`${c.baseUrl}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${c.apiUser}:${c.apiKey}`).toString("base64")}`,
      "Ocp-Apim-Subscription-Key": c.subscriptionKey,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new MomoError(res.status, "MoMo token request failed", await res.text());
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export interface RequestToPayInput {
  /** Decimal string, e.g. "25000". Never a float. */
  amount: string;
  currency: string;
  /** Any local or international format; converted to MSISDN. */
  phone: string;
  /** Your own id (e.g. Payment.id), echoed back by MTN. */
  externalId: string;
  payerMessage?: string;
  payeeNote?: string;
  country?: CountryCode;
}

/** Send a payment prompt to the customer's phone. Returns the reference id (store it). */
export async function requestToPay(input: RequestToPayInput): Promise<string> {
  if (!/^\d+(\.\d{1,2})?$/.test(input.amount)) throw new Error(`Invalid amount "${input.amount}"`);
  const c = config();
  const referenceId = randomUUID();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${await getMomoToken()}`,
    "X-Reference-Id": referenceId,
    "X-Target-Environment": c.targetEnv,
    "Ocp-Apim-Subscription-Key": c.subscriptionKey,
    "Content-Type": "application/json",
  };
  if (c.callbackUrl) headers["X-Callback-Url"] = c.callbackUrl;
  const res = await fetch(`${c.baseUrl}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      externalId: input.externalId,
      payer: { partyIdType: "MSISDN", partyId: toMsisdn(input.phone, input.country) },
      payerMessage: (input.payerMessage ?? "Payment").slice(0, 160),
      payeeNote: (input.payeeNote ?? "").slice(0, 160),
    }),
    cache: "no-store",
  });
  if (res.status !== 202) throw new MomoError(res.status, "MoMo request-to-pay was not accepted", await res.text());
  return referenceId;
}

/** Look up a request-to-pay by its reference id. This is your source of truth. */
export async function getRequestToPayStatus(referenceId: string): Promise<MomoStatusResult> {
  const c = config();
  const res = await fetch(`${c.baseUrl}/collection/v1_0/requesttopay/${encodeURIComponent(referenceId)}`, {
    headers: {
      Authorization: `Bearer ${await getMomoToken()}`,
      "X-Target-Environment": c.targetEnv,
      "Ocp-Apim-Subscription-Key": c.subscriptionKey,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new MomoError(res.status, "MoMo status request failed", await res.text());
  return (await res.json()) as MomoStatusResult;
}
