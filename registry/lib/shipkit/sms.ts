/**
 * ShipKit · sms
 * Send SMS through Africa's Talking's REST API without extra packages. Server-only.
 * Confirm the current API at https://developers.africastalking.com/docs/sms/overview
 *
 * Env vars:
 *   AT_USERNAME   "sandbox" while testing, your app username in production
 *   AT_API_KEY    API key for that username
 *   AT_SENDER_ID  optional approved sender id / short code
 *
 *   await sendSms(["0772123456"], "TPA Shop: Paid UGX 25,000 by MoMo. Ref 7F3K.");
 */
import "server-only";
import { toE164, type CountryCode } from "@/lib/shipkit/phone";

export interface SmsRecipientResult {
  number: string;
  status: string;
  statusCode?: number;
  messageId?: string;
  cost?: string;
}

/**
 * Approximate characters per single SMS: 160 for plain text, 70 if the message
 * contains emoji or other non-GSM characters (which switch to unicode encoding).
 * Plain ASCII is treated as GSM; a few ASCII symbols (e.g. [ ] { } ~) actually
 * count double, so keep a margin.
 */
export function smsSegmentLimit(message: string): number {
  return /^[\n\r\x20-\x7E]*$/.test(message) ? 160 : 70;
}

export async function sendSms(
  to: string[],
  message: string,
  opts: { country?: CountryCode; from?: string } = {},
): Promise<SmsRecipientResult[]> {
  const username = process.env.AT_USERNAME;
  const apiKey = process.env.AT_API_KEY;
  if (!username || !apiKey) throw new Error("Missing AT_USERNAME or AT_API_KEY");
  if (!message.trim()) throw new Error("Empty SMS message");

  const host = username === "sandbox" ? "https://api.sandbox.africastalking.com" : "https://api.africastalking.com";
  const body = new URLSearchParams({
    username,
    to: to.map((n) => toE164(n, opts.country)).join(","),
    message,
  });
  const from = opts.from ?? process.env.AT_SENDER_ID;
  if (from) body.set("from", from);

  const res = await fetch(`${host}/version1/messaging`, {
    method: "POST",
    headers: { apiKey, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Africa's Talking error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { SMSMessageData?: { Recipients?: SmsRecipientResult[] } };
  return data.SMSMessageData?.Recipients ?? [];
}
