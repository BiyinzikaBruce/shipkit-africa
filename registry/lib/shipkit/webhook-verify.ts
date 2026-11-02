/**
 * ShipKit · webhook-verify
 * Verify webhook signatures safely (constant-time) before trusting a payload.
 * Always pass the RAW request body (`await req.text()`), not re-serialised JSON.
 *
 *   // Paystack: HMAC SHA512 of the raw body in `x-paystack-signature` (hex)
 *   const ok = verifyHmac(raw, req.headers.get("x-paystack-signature"), env.PAYSTACK_SECRET_KEY, "sha512");
 *
 *   // Providers that send a shared secret header instead of a signature:
 *   const ok = safeEqual(req.headers.get("verif-hash"), env.FLW_WEBHOOK_HASH);
 *
 * Always confirm the provider's current signing method in its docs.
 */
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Constant-time string comparison. False if either value is missing. */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Compute an HMAC of the raw body. */
export function hmac(rawBody: string, secret: string, algorithm: "sha256" | "sha512" = "sha256", encoding: "hex" | "base64" = "hex"): string {
  return createHmac(algorithm, secret).update(rawBody, "utf8").digest(encoding);
}

/** True if `signature` equals the HMAC of `rawBody` with `secret`. Fails closed on missing input. */
export function verifyHmac(
  rawBody: string,
  signature: string | null | undefined,
  secret: string | undefined,
  algorithm: "sha256" | "sha512" = "sha256",
  encoding: "hex" | "base64" = "hex",
): boolean {
  if (!secret || !signature) return false;
  return safeEqual(signature, hmac(rawBody, secret, algorithm, encoding));
}
