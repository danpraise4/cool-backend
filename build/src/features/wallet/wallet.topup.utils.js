"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWalletTopUpReference = buildWalletTopUpReference;
exports.parseUserIdFromTopUpReference = parseUserIdFromTopUpReference;
exports.extractFlutterwaveBankTransferDetails = extractFlutterwaveBankTransferDetails;
exports.normalizeVirtualAccountTopUp = normalizeVirtualAccountTopUp;
exports.extractFlutterwaveCardPaymentUrl = extractFlutterwaveCardPaymentUrl;
exports.normalizeCardTopUpPayment = normalizeCardTopUpPayment;
function buildWalletTopUpReference(userId) {
    return `${userId}_${Date.now()}`;
}
function parseUserIdFromTopUpReference(txRef) {
    const separatorIndex = txRef.lastIndexOf("_");
    if (separatorIndex <= 0) {
        return null;
    }
    const userId = txRef.slice(0, separatorIndex);
    const timestamp = txRef.slice(separatorIndex + 1);
    if (!userId || !/^\d+$/.test(timestamp)) {
        return null;
    }
    return userId;
}
function extractFlutterwaveBankTransferDetails(providerResponse) {
    const authorization = providerResponse.meta?.authorization ??
        providerResponse.data?.meta?.authorization;
    const data = providerResponse.data ?? {};
    const accountExpiration = authorization?.account_expiration != null
        ? String(authorization.account_expiration)
        : data.account_expiration ?? data.expiry_date;
    return {
        account_number: authorization?.transfer_account ?? data.account_number,
        account_name: authorization?.account_name ?? data.account_name,
        bank_name: authorization?.transfer_bank ?? data.bank_name ?? data.bank,
        account_expiration: accountExpiration,
        transfer_note: authorization?.transfer_note ?? data.transfer_note ?? data.note,
        amount: authorization?.transfer_amount ?? data.amount,
        currency: data.currency,
        tx_ref: data.tx_ref,
    };
}
function normalizeVirtualAccountTopUp(reference, amount, currency, providerData) {
    const accountNumber = providerData.account_number ?? "";
    const bankName = providerData.bank_name ?? providerData.bank ?? "";
    const accountName = providerData.account_name ?? null;
    const expiresAt = providerData.account_expiration ?? providerData.expiry_date ?? null;
    const formattedAmount = `${currency} ${amount.toLocaleString("en-NG", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
    return {
        reference,
        amount,
        currency,
        exactAmountRequired: true,
        instructions: `Transfer exactly ${formattedAmount} to the account below. A different amount may fail or delay crediting your wallet.`,
        accountNumber,
        bankName,
        accountName,
        expiresAt,
        virtualAccount: {
            accountNumber,
            bankName,
            accountName,
            expiresAt,
        },
        transferNote: providerData.transfer_note ?? providerData.note ?? null,
    };
}
function pickHttpUrl(value) {
    if (typeof value !== "string") {
        return "";
    }
    const trimmed = value.trim();
    return trimmed.startsWith("http") ? trimmed : "";
}
function extractFlutterwaveCardPaymentUrl(providerResponse) {
    const data = providerResponse.data;
    const nestedData = data && typeof data === "object" && !Array.isArray(data)
        ? data
        : undefined;
    const meta = providerResponse.meta;
    const authorization = meta && typeof meta === "object" && !Array.isArray(meta)
        ? meta.authorization
        : nestedData?.meta &&
            typeof nestedData.meta === "object" &&
            !Array.isArray(nestedData.meta)
            ? nestedData.meta.authorization
            : nestedData?.authorization;
    const auth = authorization && typeof authorization === "object" && !Array.isArray(authorization)
        ? authorization
        : undefined;
    const candidates = [
        providerResponse.paymentUrl,
        providerResponse.link,
        providerResponse.checkoutUrl,
        providerResponse.redirectUrl,
        nestedData?.paymentUrl,
        nestedData?.payment_url,
        nestedData?.link,
        nestedData?.url,
        nestedData?.checkoutUrl,
        nestedData?.redirectUrl,
        nestedData?.data &&
            typeof nestedData.data === "object" &&
            !Array.isArray(nestedData.data)
            ? nestedData.data.link
            : undefined,
        auth?.redirect,
        auth?.link,
        pickHttpUrl(data),
    ];
    for (const candidate of candidates) {
        const url = pickHttpUrl(candidate);
        if (url) {
            return url;
        }
    }
    return "";
}
function normalizeCardTopUpPayment(reference, amount, currency, providerResponse) {
    const paymentUrl = extractFlutterwaveCardPaymentUrl(providerResponse);
    return {
        paymentUrl,
        reference,
        amount,
        currency,
        link: paymentUrl,
        checkoutUrl: paymentUrl,
        redirectUrl: paymentUrl,
    };
}
