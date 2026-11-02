// Shim of the app's Better Auth instance (lib/auth.ts). Matches the shape ShipKit relies on.
type User = { id: string; email: string; name: string; role?: string | null; organisationId?: string | null; branchId?: string | null };
type SessionResult = { user: User; session: { id: string; expiresAt: Date } } | null;
export const auth = {
  api: {
    getSession: async (_opts: { headers: Headers }): Promise<SessionResult> => null,
  },
};
