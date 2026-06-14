/** Minimum NGN withdrawal amount (kobo-style whole naira). */
export const NGN_WITHDRAWAL_MIN = 100;

/** Maximum single NGN withdrawal (product limit). */
export const NGN_WITHDRAWAL_MAX = 5_000_000;

const NIGERIAN_ACCOUNT_REGEX = /^\d{10}$/;

/** Normalize Flutterwave bank code to a 3-digit numeric string (e.g. "44" → "044"). */
export function normalizeBankCode(code: string | number): string {
  const digits = String(code).replace(/\D/g, "");
  if (!digits) {
    throw new Error("Invalid bank code");
  }
  return digits.padStart(3, "0");
}

export function isValidNigerianAccountNumber(accountNumber: string): boolean {
  return NIGERIAN_ACCOUNT_REGEX.test(String(accountNumber).trim());
}

export function parseWithdrawalAmount(amount: string | number): number {
  const numeric = typeof amount === "string" ? parseFloat(amount.trim()) : amount;
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error("Invalid withdrawal amount");
  }
  return Math.round(numeric * 100) / 100;
}

export function assertWithdrawalAmountInRange(amount: number): void {
  if (amount < NGN_WITHDRAWAL_MIN) {
    throw new Error(`Minimum withdrawal is ₦${NGN_WITHDRAWAL_MIN}`);
  }
  if (amount > NGN_WITHDRAWAL_MAX) {
    throw new Error(`Maximum withdrawal is ₦${NGN_WITHDRAWAL_MAX.toLocaleString()}`);
  }
}

export type NormalizedBank = { code: string; name: string };

/** Map Flutterwave bank list to stable { code, name } for mobile. */
export function normalizeBankList(raw: unknown): NormalizedBank[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const bank = item as { code?: string | number; name?: string };
      if (bank.code == null || !bank.name) return null;
      try {
        return {
          code: normalizeBankCode(bank.code),
          name: String(bank.name).trim(),
        };
      } catch {
        return null;
      }
    })
    .filter((b): b is NormalizedBank => b !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function bankCodeExists(banks: NormalizedBank[], accountBank: string): boolean {
  const normalized = normalizeBankCode(accountBank);
  return banks.some((b) => b.code === normalized);
}
