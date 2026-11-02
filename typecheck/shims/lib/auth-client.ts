// Shim of the app's Better Auth React client (lib/auth-client.ts).
type ClientSession = { user: { id: string; role?: string | null } } | null;
export const authClient = {
  useSession: (): { data: ClientSession; isPending: boolean } => ({ data: null, isPending: false }),
};
