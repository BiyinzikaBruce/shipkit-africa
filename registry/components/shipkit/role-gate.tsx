"use client";
/**
 * ShipKit · role-gate
 * Show children only to some roles. UI convenience ONLY: the server must
 * still check with `requireRole`.
 *
 *   <RoleGate allow={["OWNER", "MANAGER"]}>
 *     <Button variant="destructive">Void sale</Button>
 *   </RoleGate>
 */
import type { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

export function useRole(): { role: string | null; isPending: boolean } {
  const { data, isPending } = authClient.useSession();
  const role = (data?.user as { role?: string | null } | undefined)?.role ?? null;
  return { role, isPending };
}

export function RoleGate({
  allow,
  children,
  fallback = null,
}: {
  allow: readonly string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { role, isPending } = useRole();
  if (isPending) return null;
  return role && allow.includes(role) ? <>{children}</> : <>{fallback}</>;
}
