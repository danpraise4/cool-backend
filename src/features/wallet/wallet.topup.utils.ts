export function buildWalletTopUpReference(userId: string): string {
  return `${userId}_${Date.now()}`;
}

export function parseUserIdFromTopUpReference(txRef: string): string | null {
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

export type FlutterwaveBankTransferAuthorization = {
  transfer_account?: string;
  transfer_bank?: string;
  transfer_amount?: number | string;
  account_expiration?: string | number;
  transfer_note?: string;
  transfer_reference?: string;
  account_name?: string;
  mode?: string;
};

export type FlutterwaveBankTransferData = {
  account_number?: string;
  account_name?: string;
  bank_name?: string;
  bank?: string;
  account_expiration?: string;
  expiry_date?: string;
  amount?: number | string;
  currency?: string;
  tx_ref?: string;
  transfer_note?: string;
  note?: string;
  meta?: {
    authorization?: FlutterwaveBankTransferAuthorization;
  };
};

export type FlutterwaveBankTransferResponse = {
  status?: string;
  message?: string;
  data?: FlutterwaveBankTransferData;
  meta?: {
    authorization?: FlutterwaveBankTransferAuthorization;
  };
};

export function extractFlutterwaveBankTransferDetails(
  providerResponse: FlutterwaveBankTransferResponse
): FlutterwaveBankTransferData {
  const authorization =
    providerResponse.meta?.authorization ??
    providerResponse.data?.meta?.authorization;

  const data = providerResponse.data ?? {};

  const accountExpiration =
    authorization?.account_expiration != null
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

export type NormalizedVirtualAccountTopUp = {
  reference: string;
  amount: number;
  currency: string;
  exactAmountRequired: true;
  instructions: string;
  accountNumber: string;
  bankName: string;
  accountName: string | null;
  expiresAt: string | null;
  virtualAccount: {
    accountNumber: string;
    bankName: string;
    accountName: string | null;
    expiresAt: string | null;
  };
  transferNote: string | null;
};

export function normalizeVirtualAccountTopUp(
  reference: string,
  amount: number,
  currency: string,
  providerData: FlutterwaveBankTransferData
): NormalizedVirtualAccountTopUp {
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

function pickHttpUrl(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  return trimmed.startsWith("http") ? trimmed : "";
}

export type FlutterwaveCardPaymentResponse = Record<string, unknown>;

export type NormalizedCardTopUpPayment = {
  paymentUrl: string;
  reference: string;
  amount: number;
  currency: string;
  link: string;
  checkoutUrl: string;
  redirectUrl: string;
};

export function extractFlutterwaveCardPaymentUrl(
  providerResponse: FlutterwaveCardPaymentResponse
): string {
  const data = providerResponse.data;
  const nestedData =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : undefined;
  const meta = providerResponse.meta;
  const authorization =
    meta && typeof meta === "object" && !Array.isArray(meta)
      ? (meta as Record<string, unknown>).authorization
      : nestedData?.meta &&
          typeof nestedData.meta === "object" &&
          !Array.isArray(nestedData.meta)
        ? (nestedData.meta as Record<string, unknown>).authorization
        : nestedData?.authorization;

  const auth =
    authorization && typeof authorization === "object" && !Array.isArray(authorization)
      ? (authorization as Record<string, unknown>)
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
      ? (nestedData.data as Record<string, unknown>).link
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

export function normalizeCardTopUpPayment(
  reference: string,
  amount: number,
  currency: string,
  providerResponse: FlutterwaveCardPaymentResponse
): NormalizedCardTopUpPayment {
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
