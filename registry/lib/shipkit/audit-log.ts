/**
 * ShipKit · audit-log
 * Record who did what to which record, and what changed. Use it for money,
 * stock, prices, roles and anything a business owner might ask about later.
 *
 * Add this model to prisma/schema.prisma:
 *
 *   model AuditLog {
 *     id             String   @id @default(cuid())
 *     organisationId String
 *     userId         String
 *     action         String          // "sale.void", "price.update", "user.role.change"
 *     entity         String          // "Sale"
 *     entityId       String
 *     before         Json?
 *     after          Json?
 *     reason         String?
 *     createdAt      DateTime @default(now())
 *     @@index([organisationId, createdAt])
 *     @@index([entity, entityId])
 *   }
 *
 * Usage (inside the same transaction as the change):
 *   await prisma.$transaction(async (tx) => {
 *     const after = await tx.sale.update({ ... });
 *     await writeAudit(tx, session, { action: "sale.void", entity: "Sale", entityId: after.id, before, after, reason });
 *   });
 */
import "server-only";

export interface AuditSession {
  user: { id: string; organisationId?: string | null };
}

export interface AuditEntry {
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
}

/** Minimal shape of a Prisma client or transaction with the AuditLog model. */
export interface AuditClient {
  auditLog: { create(args: { data: Record<string, unknown> }): Promise<unknown> };
}

const SECRET_KEYS = /password|secret|token|apikey|api_key|pin/i;

/** JSON-safe copy with secrets removed and Decimals/Dates turned into strings. */
export function sanitiseForAudit(value: unknown): unknown {
  if (value === null || value === undefined) return value ?? null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(sanitiseForAudit);
  if (typeof value === "object") {
    const maybeDecimal = value as { toFixed?: unknown; constructor?: { name?: string } };
    if (typeof maybeDecimal.toFixed === "function" && maybeDecimal.constructor?.name === "Decimal") return String(value);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SECRET_KEYS.test(k) ? "[redacted]" : sanitiseForAudit(v);
    }
    return out;
  }
  if (typeof value === "bigint") return value.toString();
  return value;
}

export async function writeAudit(db: AuditClient, session: AuditSession, entry: AuditEntry) {
  const organisationId = session.user.organisationId;
  if (!organisationId) throw new Error("Cannot audit without an organisation");
  return db.auditLog.create({
    data: {
      organisationId,
      userId: session.user.id,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      before: entry.before === undefined ? undefined : sanitiseForAudit(entry.before),
      after: entry.after === undefined ? undefined : sanitiseForAudit(entry.after),
      reason: entry.reason,
    },
  });
}
