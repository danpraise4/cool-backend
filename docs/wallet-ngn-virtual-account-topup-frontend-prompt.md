# Frontend AI prompt — NGN bank transfer wallet top-up

Copy everything below the line into your mobile/frontend AI assistant.

---

## Task

Update the NGN wallet **bank transfer top-up** flow so users always see the **exact amount** they must send and the **virtual account details** returned by the API.

## Context

- Endpoint: `POST /api/v1/wallet/topup-bank`
- Auth: `Authorization: Bearer <token>`
- Request body: `{ "amount": number | string }` — the amount the user chose to add.
- **Critical:** Flutterwave generates a **fixed-amount** virtual account. The user must transfer **exactly** `data.amount` in `data.currency` (NGN). Wrong amounts can fail or not credit the wallet.

## API response shape (use this contract)

```ts
type VirtualAccountTopUpResponse = {
  success: true;
  message: string;
  data: {
    reference: string;
    amount: number;
    currency: "NGN";
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
      expiresAt: string | null; // ISO datetime
    };
    transferNote: string | null;
  };
};
```

**Do not** parse raw Flutterwave payloads anymore. Use only `response.data` fields above.

## UI changes required

### 1. Amount confirmation screen (before API call)
- User enters top-up amount (e.g. ₦5,000).
- Validate: positive number, NGN wallet only.

### 2. After `POST /topup-bank` succeeds — Virtual account screen

Display prominently:
- **Amount to transfer:** format `data.amount` with NGN symbol (e.g. `₦5,000.00`).
- **Warning banner** using `data.instructions` or equivalent copy:
  - “Transfer exactly ₦X. Sending a different amount may fail.”
- **Bank name:** `data.bankName` (or `data.virtualAccount.bankName`)
- **Account number:** `data.accountNumber` with copy-to-clipboard
- **Account name:** `data.accountName` (if not null)
- **Expires:** countdown from `data.expiresAt`

Optional:
- Show `data.reference` as “Payment reference” for support.

### 3. Do NOT
- Let the user edit the transfer amount on the virtual account screen.
- Show only account number without the exact amount.
- Assume any amount sent will work.
- Call `POST /topup-bank` again while waiting unless user explicitly starts a new top-up.

### 4. After user taps “I’ve sent the money”
- Poll wallet balance or transaction list (existing wallet endpoints).
- Show loading / “Confirming payment…” state.
- On balance increase or completed TOPUP transaction → success screen.
- On long delay → “Still processing” with retry refresh; suggest checking amount was exact.

### 5. Error handling
- `400` with message — show toast/alert (e.g. non-NGN wallet, invalid amount).
- Missing `data.accountNumber` — show error and retry; don’t render empty account UI.

## Example flow

```
[Enter amount: 5000] → [Confirm] 
  → POST /topup-bank { amount: 5000 }
  → [Show: Transfer exactly ₦5,000 | Wema Bank | 1234567890 | Copy | Expires in 30:00]
  → [I've sent the money] → poll wallet → success
```

## Types / API client

Add or update API client method:

```ts
async function createBankTopUp(amount: number): Promise<VirtualAccountTopUpResponse["data"]> {
  const res = await api.post("/wallet/topup-bank", { amount });
  return res.data.data;
}
```

## Acceptance criteria

- [ ] Exact `amount` from API is visible on virtual account screen before user leaves the app to pay.
- [ ] Warning about exact amount is shown.
- [ ] Account number and bank name are copyable/displayed.
- [ ] Expiry shown when `expiresAt` is present.
- [ ] No dependency on raw Flutterwave response fields in the UI.
- [ ] Post-payment polling refreshes wallet balance.
