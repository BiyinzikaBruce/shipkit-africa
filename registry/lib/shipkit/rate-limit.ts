/**
 * ShipKit · rate-limit
 * Protect login, OTP, password reset and payment endpoints with Upstash Redis.
 *
 * Env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 *
 *   const { success } = await limit("login", ip);              // 5 per minute
 *   if (!success) return Response.json({ error: "Too many attempts" }, { status: 429 });
 */
import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

/** Presets. Tune per project. */
export const limiters = {
  login: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 m"), prefix: "rl:login" }),
  otp: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "5 m"), prefix: "rl:otp" }),
  passwordReset: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "15 m"), prefix: "rl:reset" }),
  payment: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 m"), prefix: "rl:pay" }),
  api: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "1 m"), prefix: "rl:api" }),
} as const;

export type LimiterName = keyof typeof limiters;

/** Rate-limit by a key (user id, phone, or IP). */
export async function limit(name: LimiterName, key: string) {
  return limiters[name].limit(key);
}

/** Best-effort client IP from proxy headers. */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
