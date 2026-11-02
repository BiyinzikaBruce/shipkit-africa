"use client";
/**
 * ShipKit · use-payment-status
 * Poll your own status endpoint while a mobile-money prompt is pending.
 * Stops on a final status, on timeout, and pauses while the tab is hidden.
 *
 *   const { status, timedOut } = usePaymentStatus(`/api/payments/${id}/status`, { enabled: !!id });
 *
 * Your endpoint returns { status: "PENDING" | "SUCCESSFUL" | "FAILED" | … } after
 * checking the provider SERVER-side (e.g. ShipKit `getRequestToPayStatus`).
 */
import { useEffect, useRef, useState } from "react";

const FINAL = new Set(["SUCCESSFUL", "FAILED", "CANCELLED", "EXPIRED"]);

export function usePaymentStatus(
  url: string,
  { enabled = true, intervalMs = 5000, timeoutMs = 120_000 }: { enabled?: boolean; intervalMs?: number; timeoutMs?: number } = {},
) {
  const [status, setStatus] = useState<string>("PENDING");
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const startedAt = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    startedAt.current = Date.now();
    setStatus("PENDING");
    setError(null);
    setTimedOut(false);

    async function tick() {
      if (cancelled) return;
      if (Date.now() - startedAt.current > timeoutMs) {
        setTimedOut(true);
        return;
      }
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch(url, { cache: "no-store", signal: controller.signal });
          if (!res.ok) throw new Error(`Status check failed (${res.status})`);
          const data = (await res.json()) as { status?: string };
          if (cancelled) return;
          const s = (data.status ?? "PENDING").toUpperCase();
          setStatus(s);
          setError(null);
          if (FINAL.has(s)) return;
        } catch (e) {
          if (cancelled || (e instanceof DOMException && e.name === "AbortError")) return;
          setError(e instanceof Error ? e.message : "Status check failed");
        }
      }
      timer = setTimeout(tick, intervalMs);
    }

    tick();
    return () => {
      cancelled = true;
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [url, enabled, intervalMs, timeoutMs]);

  return { status, error, timedOut, isFinal: FINAL.has(status) };
}
