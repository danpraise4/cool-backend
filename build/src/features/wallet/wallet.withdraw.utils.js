"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NGN_WITHDRAWAL_MAX = exports.NGN_WITHDRAWAL_MIN = void 0;
exports.normalizeBankCode = normalizeBankCode;
exports.isValidNigerianAccountNumber = isValidNigerianAccountNumber;
exports.parseWithdrawalAmount = parseWithdrawalAmount;
exports.assertWithdrawalAmountInRange = assertWithdrawalAmountInRange;
exports.normalizeBankList = normalizeBankList;
exports.bankCodeExists = bankCodeExists;
/** Minimum NGN withdrawal amount (kobo-style whole naira). */
exports.NGN_WITHDRAWAL_MIN = 100;
/** Maximum single NGN withdrawal (product limit). */
exports.NGN_WITHDRAWAL_MAX = 5_000_000;
const NIGERIAN_ACCOUNT_REGEX = /^\d{10}$/;
/** Normalize Flutterwave bank code to a 3-digit numeric string (e.g. "44" → "044"). */
function normalizeBankCode(code) {
    const digits = String(code).replace(/\D/g, "");
    if (!digits) {
        throw new Error("Invalid bank code");
    }
    return digits.padStart(3, "0");
}
function isValidNigerianAccountNumber(accountNumber) {
    return NIGERIAN_ACCOUNT_REGEX.test(String(accountNumber).trim());
}
function parseWithdrawalAmount(amount) {
    const numeric = typeof amount === "string" ? parseFloat(amount.trim()) : amount;
    if (!Number.isFinite(numeric) || numeric <= 0) {
        throw new Error("Invalid withdrawal amount");
    }
    return Math.round(numeric * 100) / 100;
}
function assertWithdrawalAmountInRange(amount) {
    if (amount < exports.NGN_WITHDRAWAL_MIN) {
        throw new Error(`Minimum withdrawal is ₦${exports.NGN_WITHDRAWAL_MIN}`);
    }
    if (amount > exports.NGN_WITHDRAWAL_MAX) {
        throw new Error(`Maximum withdrawal is ₦${exports.NGN_WITHDRAWAL_MAX.toLocaleString()}`);
    }
}
/** Map Flutterwave bank list to stable { code, name } for mobile. */
function normalizeBankList(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw
        .map((item) => {
        const bank = item;
        if (bank.code == null || !bank.name)
            return null;
        try {
            return {
                code: normalizeBankCode(bank.code),
                name: String(bank.name).trim(),
            };
        }
        catch {
            return null;
        }
    })
        .filter((b) => b !== null)
        .sort((a, b) => a.name.localeCompare(b.name));
}
function bankCodeExists(banks, accountBank) {
    const normalized = normalizeBankCode(accountBank);
    return banks.some((b) => b.code === normalized);
}
