import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWalletTopUpReference,
  extractFlutterwaveBankTransferDetails,
  extractFlutterwaveCardPaymentUrl,
  normalizeCardTopUpPayment,
  normalizeVirtualAccountTopUp,
  parseUserIdFromTopUpReference,
} from "./wallet.topup.utils";

describe("wallet top-up reference", () => {
  it("builds and parses user id from tx reference", () => {
    const userId = "75662530-1652-4884-8b3f-fc859c15ad01";
    const reference = buildWalletTopUpReference(userId);

    assert.equal(parseUserIdFromTopUpReference(reference), userId);
  });

  it("returns null for invalid reference format", () => {
    assert.equal(parseUserIdFromTopUpReference("invalid-ref"), null);
  });
});

describe("virtual account top-up response", () => {
  it("includes exact amount and account details for mobile UI", () => {
    const payload = normalizeVirtualAccountTopUp(
      "75662530-1652-4884-8b3f-fc859c15ad01_1730000000000",
      5000,
      "NGN",
      {
        account_number: "1234567890",
        bank_name: "Wema Bank",
        account_name: "Recycool Collections",
        account_expiration: "2026-06-16T16:00:00.000Z",
      }
    );

    assert.equal(payload.amount, 5000);
    assert.equal(payload.exactAmountRequired, true);
    assert.equal(payload.accountNumber, "1234567890");
    assert.equal(payload.virtualAccount.accountNumber, "1234567890");
    assert.match(payload.instructions, /exactly/i);
    assert.match(payload.instructions, /5,000/);
  });

  it("extracts Flutterwave meta.authorization bank transfer details", () => {
    const details = extractFlutterwaveBankTransferDetails({
      status: "success",
      message: "Charge initiated",
      meta: {
        authorization: {
          transfer_account: "7825397990",
          transfer_bank: "WEMA BANK",
          transfer_amount: 1500,
          account_expiration: "2026-06-16T16:00:00.000Z",
          transfer_note: "Pay exactly 1500",
        },
      },
    });

    const payload = normalizeVirtualAccountTopUp("ref_123", 1500, "NGN", details);

    assert.equal(payload.accountNumber, "7825397990");
    assert.equal(payload.bankName, "WEMA BANK");
    assert.equal(payload.transferNote, "Pay exactly 1500");
  });
});

describe("card checkout top-up response", () => {
  it("extracts payment URL from Flutterwave data.link", () => {
    const url = extractFlutterwaveCardPaymentUrl({
      status: "success",
      data: {
        link: "https://checkout.flutterwave.com/v3/hosted/pay/flwlnk-test",
      },
    });

    assert.equal(url, "https://checkout.flutterwave.com/v3/hosted/pay/flwlnk-test");
  });

  it("extracts payment URL from nested data.data.link", () => {
    const url = extractFlutterwaveCardPaymentUrl({
      success: true,
      data: {
        data: {
          link: "https://checkout.flutterwave.com/v3/hosted/pay/nested",
        },
      },
    });

    assert.equal(url, "https://checkout.flutterwave.com/v3/hosted/pay/nested");
  });

  it("extracts payment URL from meta.authorization.redirect", () => {
    const url = extractFlutterwaveCardPaymentUrl({
      meta: {
        authorization: {
          redirect: "https://checkout.flutterwave.com/v3/hosted/pay/auth-redirect",
        },
      },
    });

    assert.equal(url, "https://checkout.flutterwave.com/v3/hosted/pay/auth-redirect");
  });

  it("returns normalized paymentUrl for mobile clients", () => {
    const payload = normalizeCardTopUpPayment(
      "wallet-topup-ref-123",
      5000,
      "NGN",
      {
        status: "success",
        data: {
          link: "https://checkout.flutterwave.com/v3/hosted/pay/flwlnk-test",
        },
      }
    );

    assert.equal(payload.reference, "wallet-topup-ref-123");
    assert.equal(payload.amount, 5000);
    assert.equal(payload.currency, "NGN");
    assert.equal(payload.paymentUrl, "https://checkout.flutterwave.com/v3/hosted/pay/flwlnk-test");
    assert.equal(payload.link, payload.paymentUrl);
    assert.equal(payload.checkoutUrl, payload.paymentUrl);
    assert.equal(payload.redirectUrl, payload.paymentUrl);
  });
});
