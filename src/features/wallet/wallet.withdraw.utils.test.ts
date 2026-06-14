import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertWithdrawalAmountInRange,
  bankCodeExists,
  isValidNigerianAccountNumber,
  normalizeBankCode,
  normalizeBankList,
  NGN_WITHDRAWAL_MIN,
  parseWithdrawalAmount,
} from "./wallet.withdraw.utils";

describe("wallet.withdraw.utils", () => {
  it("normalizes bank codes to 3 digits", () => {
    assert.equal(normalizeBankCode("44"), "044");
    assert.equal(normalizeBankCode("044"), "044");
    assert.equal(normalizeBankCode(58), "058");
  });

  it("validates 10-digit account numbers", () => {
    assert.equal(isValidNigerianAccountNumber("0123456789"), true);
    assert.equal(isValidNigerianAccountNumber("123456789"), false);
    assert.equal(isValidNigerianAccountNumber("01234567890"), false);
  });

  it("parses withdrawal amounts from strings", () => {
    assert.equal(parseWithdrawalAmount("5000"), 5000);
    assert.equal(parseWithdrawalAmount(100.5), 100.5);
  });

  it("enforces min/max withdrawal limits", () => {
    assert.throws(() => assertWithdrawalAmountInRange(NGN_WITHDRAWAL_MIN - 1));
    assert.doesNotThrow(() => assertWithdrawalAmountInRange(NGN_WITHDRAWAL_MIN));
  });

  it("normalizes Flutterwave bank list", () => {
    const banks = normalizeBankList([
      { code: 44, name: "Access Bank" },
      { code: "058", name: "GTBank" },
    ]);
    assert.deepEqual(banks, [
      { code: "044", name: "Access Bank" },
      { code: "058", name: "GTBank" },
    ]);
  });

  it("checks bank code membership", () => {
    const banks = normalizeBankList([{ code: "044", name: "Access Bank" }]);
    assert.equal(bankCodeExists(banks, "44"), true);
    assert.equal(bankCodeExists(banks, "999"), false);
  });
});
