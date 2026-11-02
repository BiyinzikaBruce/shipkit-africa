import { test } from "node:test";
import assert from "node:assert/strict";
import { formatMoney, formatMoneyShort, parseMoneyInput, currencyDecimals } from "../../registry/lib/shipkit/money.ts";

test("currency decimals follow ISO 4217", () => {
  assert.equal(currencyDecimals("UGX"), 0);
  assert.equal(currencyDecimals("RWF"), 0);
  assert.equal(currencyDecimals("KES"), 2);
  assert.equal(currencyDecimals("USD"), 2);
});

test("formatMoney", () => {
  assert.equal(formatMoney(1250000, "UGX"), "UGX 1,250,000");
  assert.equal(formatMoney("2499.5", "KES"), "KES 2,499.50");
  assert.equal(formatMoney(-5000, "UGX"), "-UGX 5,000");
  assert.equal(formatMoney(0, "UGX"), "UGX 0");
  assert.equal(formatMoney(1250000, "UGX", { showCode: false }), "1,250,000");
  assert.equal(formatMoney({ toString: () => "750.25" }, "USD"), "USD 750.25"); // Decimal-like
  assert.throws(() => formatMoney("abc", "UGX"));
});

test("formatMoneyShort", () => {
  assert.equal(formatMoneyShort(950, "UGX"), "UGX 950");
  assert.equal(formatMoneyShort(12500, "UGX"), "UGX 12.5K");
  assert.equal(formatMoneyShort(1250000, "UGX"), "UGX 1.3M");
  assert.equal(formatMoneyShort(2000000, "UGX"), "UGX 2M");
  assert.equal(formatMoneyShort(2.1e9, "UGX", { showCode: false }), "2.1B");
});

test("parseMoneyInput", () => {
  assert.equal(parseMoneyInput("1,250,000"), "1250000");
  assert.equal(parseMoneyInput("UGX 25,000"), "25000");
  assert.equal(parseMoneyInput("1 250 000"), "1250000");
  assert.equal(parseMoneyInput("2499.50"), "2499.50");
  assert.equal(parseMoneyInput("007"), "7");
  assert.equal(parseMoneyInput("-50"), null);
  assert.equal(parseMoneyInput("12.345"), null);
  assert.equal(parseMoneyInput("abc"), null);
  assert.equal(parseMoneyInput(""), null);
});
