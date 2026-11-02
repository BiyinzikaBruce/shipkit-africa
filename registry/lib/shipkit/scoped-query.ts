/**
 * ShipKit · scoped-query
 * Never forget the tenant filter. Merge organisation (and branch) scope into
 * every Prisma `where`, taken from the server-verified session.
 *
 *   prisma.sale.findMany({ where: scopeWhere(session, { status: "COMPLETED" }) })
 *   prisma.sale.findFirst({ where: scopeWhere(session, { id }, { branch: true }) })
 *   prisma.sale.create({ data: scopeData(session, { total, ... }) })
 */

export interface ScopedSession {
  user: { role?: string | null; organisationId?: string | null; branchId?: string | null };
}

export interface ScopeOptions {
  /** Also filter by the user's branch. Default false. */
  branch?: boolean;
  /** Roles that see every branch even when `branch: true`. Default ["OWNER"]. */
  allBranchRoles?: string[];
}

function organisationOf(session: ScopedSession): string {
  const id = session.user.organisationId;
  if (!id) throw new Error("Session has no organisation: refusing an unscoped query");
  return id;
}

function branchFilter(session: ScopedSession, opts: ScopeOptions): { branchId?: string } {
  if (!opts.branch) return {};
  const allBranchRoles = opts.allBranchRoles ?? ["OWNER"];
  if (session.user.role && allBranchRoles.includes(session.user.role)) return {};
  const branchId = session.user.branchId;
  if (!branchId) throw new Error("Session has no branch: refusing a branch-scoped query");
  return { branchId };
}

/** Add organisation (and optional branch) scope to a `where`. Scope wins over caller values. */
export function scopeWhere<W extends object>(session: ScopedSession, where: W = {} as W, opts: ScopeOptions = {}) {
  return { ...where, organisationId: organisationOf(session), ...branchFilter(session, opts) };
}

/** Add organisation (and optional branch) to `data` on create. Scope wins over caller values. */
export function scopeData<D extends object>(session: ScopedSession, data: D, opts: ScopeOptions = {}) {
  return { ...data, organisationId: organisationOf(session), ...branchFilter(session, opts) };
}
