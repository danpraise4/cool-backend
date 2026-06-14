# NGN wallet withdrawal API (Flutterwave)

Base path: `/api/v1/wallet`  
All endpoints require `Authorization: Bearer <token>` unless noted.

## `GET /banks`

Returns Nigerian banks for **NGN wallets** (Flutterwave `NG` list).

**Response 200**
```json
{
  "success": true,
  "status": "success",
  "message": "Banks fetched successfully",
  "data": [
    { "code": "044", "name": "Access Bank" },
    { "code": "058", "name": "Guaranty Trust Bank" }
  ]
}
```

- `code` — Flutterwave bank code, always a **3-digit numeric string** (e.g. `"044"`).
- `name` — Display name for the mobile bank picker.

---

## `POST /bank-account`

Resolves account holder name via Flutterwave **Resolve Account**.

**Body**
```json
{
  "account_number": "0123456789",
  "account_bank": "044"
}
```

**Validation**
- `account_number` — exactly 10 digits
- `account_bank` — numeric Flutterwave bank code (must exist in `/banks` list)
- NGN wallet only
- Rate limited: 20 requests / 15 min per user

**Response 200**
```json
{
  "success": true,
  "status": "success",
  "message": "Account resolved",
  "data": {
    "account_number": "0123456789",
    "account_name": "JOHN DOE",
    "account_bank": "044"
  }
}
```

**Errors 400** — `{ "success": false, "message": "..." }`  
Examples: invalid bank code, account could not be resolved, non-NGN wallet.

---

## `POST /transfer-to-bank`

Initiates Flutterwave transfer and debits wallet after provider accepts the request.

**Headers (optional)**
- `x-idempotency-key` — client-generated unique key; retries with the same key return the original transaction without double debit.

**Body**
```json
{
  "account_number": "0123456789",
  "account_bank": "044",
  "amount": "5000"
}
```

**Validation**
- NGN wallet only
- Amount: positive number or numeric string
- Min: ₦100, max: ₦5,000,000 per transfer
- Sufficient wallet balance
- Account re-resolved server-side before transfer (same bank code as verify step)

**Response 200**
```json
{
  "success": true,
  "status": "success",
  "message": "Transfer initiated",
  "data": {
    "reference": "ng-withdraw-<userId>-<timestamp>",
    "transaction": { "...": "..." }
  }
}
```

**Errors 400** — insufficient funds, invalid amount, resolve/transfer failure  
**Errors 409** — idempotent replay (same reference already exists)

---

## Webhooks (`POST /wallet/hook`)

Configure Flutterwave secret hash as `FLW_WEBHOOK_HASH`. Send header `verif-hash`.

Handled events:
- `charge.completed` — wallet top-up credit
- `transfer.completed` — marks withdrawal transaction completed
- `transfer.failed` — marks withdrawal failed and **refunds** wallet balance

---

## Staging test checklist

1. `GET /wallet/banks` → pick a bank code (e.g. `044`).
2. `POST /wallet/bank-account` with valid sandbox account → receive `account_name`.
3. `POST /wallet/transfer-to-bank` with amount `100` and sufficient balance → 200 + reference.
4. `GET /wallet/transactions` → withdrawal appears with `type: WITHDRAWAL`.
5. Invalid account → 400 with `message` for mobile toast.
6. Insufficient balance → 400 `"Insufficient funds"`.

Run unit tests:
```bash
npm run test:wallet
```
