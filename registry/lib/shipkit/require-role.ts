/**
 * ShipKit · require-role
 * Server-side gate for pages, layouts, server actions and route handlers.
 * Pair with <RoleGate> in the UI: the gate hides, this blocks.
 *
 *   // layout or page: redirects when not allowed
 *   const session = await requireRole(["OWNER", "MANAGER"]);
 *
 *   // server action: throws (never redirects mid-action)
 *   const session = await requireRole(["OWNER"], { onDenied: "throw" });
 *
 * Requires `lib/auth.ts` exporting a Better Auth instance (`auth`) whose user has a `role` field.
 */
import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export class AuthError extends Error {
  status: 401 | 403;
  constructor(status: 401 | 403, message: string) {
    super(message);
    this.status = status;
    this.name = "AuthError";
  }
}

interface Options {
  /** "redirect" (pages/layouts, default) or "throw" (actions/route handlers). */
  onDenied?: "redirect" | "throw";
  loginPath?: string;
  /** Where to send a logged-in user without access. Default "/". */
  deniedPath?: string;
}

/** Returns the session or sends the user to login. */
export async function requireSession(opts: Options = {}): Promise<Session> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    if (opts.onDenied === "throw") throw new AuthError(401, "Not signed in");
    redirect(opts.loginPath ?? "/login");
  }
  return session;
}

/** Returns the session if the user's role is in `roles`; otherwise redirects or throws 403. */
export async function requireRole(roles: readonly string[], opts: Options = {}): Promise<Session> {
  const session = await requireSession(opts);
  const role = (session.user as { role?: string | null }).role;
  if (!role || !roles.includes(role)) {
    if (opts.onDenied === "throw") throw new AuthError(403, "Forbidden");
    redirect(opts.deniedPath ?? "/");
  }
  return session;
}

/** Turn an AuthError into an HTTP response in route handlers. */
export function authErrorResponse(error: unknown): Response | null {
  if (error instanceof AuthError) return Response.json({ error: error.message }, { status: error.status });
  return null;
}
