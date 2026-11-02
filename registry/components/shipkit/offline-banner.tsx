"use client";
/**
 * ShipKit · offline-banner
 * Tell users when they're offline and how many changes are waiting to sync.
 *
 *   const online = useOnline();
 *   <OfflineBanner pending={outbox.length} />
 */
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/** True when the browser reports a network connection. Server render assumes online. */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}

export function OfflineBanner({ pending = 0 }: { pending?: number }) {
  const online = useOnline();
  if (online && pending === 0) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={
        online
          ? "bg-sky-50 px-4 py-2 text-center text-sm text-sky-800"
          : "bg-amber-50 px-4 py-2 text-center text-sm text-amber-900"
      }
    >
      {online
        ? `Syncing ${pending} change${pending === 1 ? "" : "s"}…`
        : `You're offline. ${pending > 0 ? `${pending} change${pending === 1 ? "" : "s"} will sync` : "Changes will sync"} when you reconnect.`}
    </div>
  );
}
