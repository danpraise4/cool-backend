# NGN virtual account (bank transfer) top-up

Base path: `/api/v1/wallet`  
Requires `Authorization: Bearer <token>`.

## How it works

1. User enters the amount they want to add to their wallet.
2. App calls `POST /topup-bank` with that amount.
3. Backend creates a **Flutterwave bank transfer charge** with a **fixed amount** and returns a **one-time virtual account**.
4. User must transfer **exactly** that amount to the virtual account before it expires.
5. Flutterwave sends `charge.completed` to `POST /wallet/hook`; backend credits the wallet.

**Important:** This is not an open-ended virtual account. The charge is amount-locked. If the user sends ₦4,900 instead of ₦5,000, the transfer may fail or not credit the wallet.

---

## `POST /topup-bank`

**Body**
```json
{
  "amount": 5000
}
```

`amount` may be a number or numeric string (e.g. `"5000"` or `"5000.50"`).

**Requirements**
- User must have an **NGN** wallet.
- `amount` must be greater than 0.

**Response 200**
```json
{
  "success": true,
  "message": "Bank charge created successfully",
  "data": {
    "reference": "75662530-1652-4884-8b3f-fc859c15ad01_1730000000000",
    "amount": 5000,
    "currency": "NGN",
    "exactAmountRequired": true,
    "instructions": "Transfer exactly NGN 5,000 to the account below. A different amount may fail or delay crediting your wallet.",
    "accountNumber": "1234567890",
    "bankName": "Wema Bank",
    "accountName": "Recycool Collections",
    "expiresAt": "2026-06-16T16:00:00.000Z",
    "virtualAccount": {
      "accountNumber": "1234567890",
      "bankName": "Wema Bank",
      "accountName": "Recycool Collections",
      "expiresAt": "2026-06-16T16:00:00.000Z"
    },
    "transferNote": null
  }
}
```

### Field guide

| Field | Use in UI |
|-------|-----------|
| `amount` | **Show prominently** — this is the exact amount to transfer |
| `currency` | Always `NGN` for this flow |
| `exactAmountRequired` | Always `true` — show warning copy |
| `instructions` | Ready-made user-facing warning text |
| `accountNumber` | Copy button (same as `virtualAccount.accountNumber`) |
| `bankName` | Display bank name |
| `accountName` | Display account name if present |
| `expiresAt` | Countdown timer |
| `virtualAccount` | Nested object with the same account fields |
| `reference` | Internal reference; optional “Payment reference” in support screens |

**Errors 400** — `{ "success": false, "message": "..." }`  
Examples: non-NGN wallet, invalid amount.

---

## After the user pays

- Wallet credit is **asynchronous** (webhook-driven), usually within seconds.
- Refresh wallet balance / transactions after payment.
- User may receive push + email: “Wallet top-up successful”.
- Pending top-up is stored server-side until webhook completes.

---

## Mobile UX checklist

1. Amount input screen → user confirms amount.
2. Call `POST /topup-bank` with that amount.
3. Show **exact amount** in large type (e.g. `₦5,000.00`).
4. Show warning: “Transfer exactly this amount. Other amounts may fail.”
5. Show virtual account details with copy actions.
6. Show expiry countdown from `expiresAt`.
7. “I’ve sent the money” → poll wallet balance or transactions; do **not** call top-up again with a new amount unless starting over.
8. On success, navigate to wallet with updated balance.
