import { test } from "node:test";
import assert from "node:assert/strict";
import { scopeWhere, scopeData } from "../../registry/lib/shipkit/scoped-query.ts";

const cashier = { user: { role: "CASHIER", organisationId: "org1", branchId: "b1" } };
const owner = { user: { role: "OWNER", organisationId: "org1", branchId: null } };

test("adds organisation scope", () => {
  assert.deepEqual(scopeWhere(cashier, { status: "COMPLETED" }), { status: "COMPLETED", organisationId: "org1" });
});

test("scope overrides a malicious caller value", () => {
  assert.deepEqual(scopeWhere(cashier, { organisationId: "org2", id: "x" }), { organisationId: "org1", id: "x" });
  assert.deepEqual(scopeData(cashier, { organisationId: "org2", total: 5 }), { organisationId: "org1", total: 5 });
});

test("branch scope, with owners seeing all branches", () => {
  assert.deepEqual(scopeWhere(cashier, { id: "s1" }, { branch: true }), { id: "s1", organisationId: "org1", branchId: "b1" });
  assert.deepEqual(scopeWhere(owner, { id: "s1" }, { branch: true }), { id: "s1", organisationId: "org1" });
  assert.deepEqual(scopeWhere(cashier, { branchId: "b9" }, { branch: true }), { branchId: "b1", organisationId: "org1" });
});

test("fails closed without organisation or branch", () => {
  assert.throws(() => scopeWhere({ user: { role: "CASHIER" } }, {}));
  assert.throws(() => scopeWhere({ user: { role: "CASHIER", organisationId: "org1" } }, {}, { branch: true }));
});
