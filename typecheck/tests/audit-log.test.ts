import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitiseForAudit, writeAudit } from "../../registry/lib/shipkit/audit-log.ts";

class Decimal { v: string; constructor(v: string) { this.v = v; } toFixed() { return this.v; } toString() { return this.v; } }

test("redacts secrets and serialises Decimal/Date", () => {
  const out = sanitiseForAudit({
    total: new Decimal("25000.00"),
    at: new Date("2026-11-01T10:00:00Z"),
    user: { password: "hunter2", apiKey: "k", name: "Jane" },
    items: [{ momoPin: "1234", qty: 2 }],
  });
  assert.deepEqual(out, {
    total: "25000.00",
    at: "2026-11-01T10:00:00.000Z",
    user: { password: "[redacted]", apiKey: "[redacted]", name: "Jane" },
    items: [{ momoPin: "[redacted]", qty: 2 }],
  });
});

test("writeAudit writes a scoped entry", async () => {
  let written: Record<string, unknown> | undefined;
  const db = { auditLog: { create: async (args: { data: Record<string, unknown> }) => { written = args.data; return args.data; } } };
  await writeAudit(db, { user: { id: "u1", organisationId: "org1" } }, { action: "sale.void", entity: "Sale", entityId: "s1", reason: "Wrong item" });
  assert.equal(written?.organisationId, "org1");
  assert.equal(written?.userId, "u1");
  assert.equal(written?.action, "sale.void");
  await assert.rejects(writeAudit(db, { user: { id: "u1" } }, { action: "x", entity: "Y", entityId: "1" }));
});
