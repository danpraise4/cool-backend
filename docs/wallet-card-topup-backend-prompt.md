# Backend AI Prompt — Wallet Card Top-up (Payment URL)

Copy this prompt into your backend AI session.

---

## Task

Fix **`POST /api/v1/wallet/create-card-charge-url`** so the mobile app receives a **checkout/payment URL** and can open it in a WebView for card wallet top-up.

Mobile currently shows **"No payment URL"** when the response does not include a usable HTTPS link.

## Endpoint

`POST /api/v1/wallet/create-card-charge-url`

- Auth: `Authorization: Bearer <token>`
- Body: `{ "amount": number | string }` — amount user chose on the previous screen

## Required response contract (use this shape)

```json
{
  "success": true,
  "message": "Payment link created",
  "data": {
    "paymentUrl": "https://checkout.flutterwave.com/v3/hosted/pay/xxxxxxxx",
    "reference": "wallet-topup-ref-123",
    "amount": 5000,
    "currency": "NGN"
  }
}
```

### Field rules

| Field | Required | Notes |
|-------|----------|-------|
| `data.paymentUrl` | **Yes** | Full HTTPS URL for hosted checkout / 3DS page. Mobile opens this in WebView. |
| `data.reference` | Preferred | Stored for reconciliation / support |
| `data.amount` | Preferred | Echo requested amount |
| `data.currency` | Preferred | `NGN` or `GBP` based on wallet |

### Backward-compatible aliases (optional)

Mobile also accepts **one** of these inside `data` if `paymentUrl` is not set:

- `link`
- `checkoutUrl`
- `redirectUrl`

**Do not** return only raw Flutterwave payloads. Normalize to `data.paymentUrl` before responding.

## Example bad responses (cause mobile error)

```json
{ "success": true, "data": { "meta": { "authorization": { "redirect": "https://..." } } } }
```

```json
{ "success": true, "data": { "data": { "link": "https://..." } } }
```

```json
{ "success": true, "message": "OK" }
```

Mobile should not need triple-nested `data.data.data.link`. Flatten to `data.paymentUrl`.

## Payment flow

1. User enters amount on mobile → confirms on card top-up screen
2. Mobile calls `POST /create-card-charge-url` with `{ amount }`
3. Backend creates Flutterwave (or provider) charge / payment link for wallet top-up
4. Backend returns `data.paymentUrl`
5. Mobile opens URL in WebView
6. User completes card payment on provider page
7. Provider redirects to your **callback/success URL** containing success indicator, e.g.:
   - `.../payment/successful`
   - `...?status=success`
   - `...?status=completed`
8. Backend webhook credits wallet; mobile shows success when redirect URL matches success pattern

## Callback / redirect URL

Configure Flutterwave (or provider) redirect to a URL mobile can detect, e.g.:

`https://yourapp.com/wallet/payment/successful?reference={reference}`

Or your existing deep link / web callback that includes `successful` or `status=success` in the URL.

## Error handling

| Case | HTTP | Body |
|------|------|------|
| Invalid amount | `400` | `{ "message": "Invalid amount" }` |
| Non-positive amount | `400` | `{ "message": "Amount must be greater than zero" }` |
| Provider failure | `502` or `400` | `{ "message": "Could not create payment link" }` |
| Missing payment URL after provider call | `500` | Do not return `200` without `paymentUrl` |
| Unauthenticated | `401` | Standard auth error |

## Implementation reference (this repo)

| File | Role |
|------|------|
| `src/features/wallet/wallet.services.ts` | `createCardChargeURL` |
| `src/features/wallet/wallet.topup.utils.ts` | `extractFlutterwaveCardPaymentUrl`, `normalizeCardTopUpPayment` |
| `src/shared/services/flutterwave/flutterwave.ts` | `createCardCharge` → `POST /v3/payments` |

## Tests to add

1. Authenticated user + valid amount → `200` with `data.paymentUrl` starting with `https://`
2. Missing `amount` → `400`
3. Provider returns link in nested field → API still exposes flat `data.paymentUrl`
4. Provider error → non-200 with message, no empty success body
5. After successful webhook, wallet balance increases and transaction type is `TOPUP`

Run: `npm run test:wallet`

## Done criteria

- [ ] Mobile **Continue** on card top-up opens WebView with checkout URL (no "No payment URL")
- [ ] Response uses `data.paymentUrl` (or documented alias mapped server-side)
- [ ] No dependency on `data.data.data.link` nesting
- [ ] Success redirect URL works with mobile WebView detection
- [ ] Wallet credited after successful payment
