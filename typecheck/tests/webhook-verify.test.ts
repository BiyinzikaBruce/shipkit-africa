import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyHmac, safeEqual, hmac } from "../../registry/lib/shipkit/webhook-verify.ts";

const body = '{"event":"charge.success","data":{"reference":"abc"}}';
const secret = "sk_test_123";

test("verifies a correct sha512 hex signature (Paystack style)", () => {
  const sig = createHmac("sha512", secret).update(body).digest("hex");
  assert.equal(verifyHmac(body, sig, secret, "sha512"), true);
});

test("rejects tampered body, wrong secret, or missing input", () => {
  const sig = hmac(body, secret, "sha512");
  assert.equal(verifyHmac(body + " ", sig, secret, "sha512"), false);
  assert.equal(verifyHmac(body, sig, "wrong", "sha512"), false);
  assert.equal(verifyHmac(body, null, secret, "sha512"), false);
  assert.equal(verifyHmac(body, sig, undefined, "sha512"), false);
  assert.equal(verifyHmac(body, sig.slice(0, -2), secret, "sha512"), false);
});

test("safeEqual", () => {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("abc", "abcd"), false);
  assert.equal(safeEqual(null, "abc"), false);
  assert.equal(safeEqual("", ""), false);
});
