import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePhone, toE164, toMsisdn, formatLocal, isValidPhone, detectNetwork } from "../../registry/lib/shipkit/phone.ts";

test("normalises Ugandan formats", () => {
  for (const input of ["0772 123 456", "0772123456", "+256 772 123456", "256772123456", "00256772123456", "772123456", "(0772) 123-456"]) {
    assert.equal(toE164(input), "+256772123456", input);
  }
  assert.equal(toMsisdn("0772 123 456"), "256772123456");
  assert.equal(formatLocal("+256772123456"), "0772 123 456");
});

test("other countries by dial code or default", () => {
  assert.deepEqual(parsePhone("+254712345678"), { country: "KE", nsn: "712345678" });
  assert.equal(toE164("0712345678", "KE"), "+254712345678");
  assert.equal(toE164("+255712345678"), "+255712345678");
  assert.equal(toE164("0788123456", "RW"), "+250788123456");
});

test("rejects invalid numbers", () => {
  assert.equal(isValidPhone("12345"), false);
  assert.equal(isValidPhone("0772 123 45"), false);
  assert.equal(isValidPhone("07721234567"), false);
  assert.equal(isValidPhone("phone"), false);
  assert.throws(() => toE164("123"));
});

test("detectNetwork uses the caller's prefix map", () => {
  const map = { MTN: ["77", "78"], AIRTEL: ["70", "75"] };
  assert.equal(detectNetwork("0772123456", map), "MTN");
  assert.equal(detectNetwork("+256701234567", map), "AIRTEL");
  assert.equal(detectNetwork("0791234567", map), null);
  assert.equal(detectNetwork("bad", map), null);
});
