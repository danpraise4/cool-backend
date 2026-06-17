# Card checkout wallet top-up

Base path: `/api/v1/wallet`  
Requires `Authorization: Bearer <token>`.

## `POST /create-card-charge-url`

Creates a Flutterwave Standard Checkout link for wallet top-up.

**Body**
```json
{
  "amount": 5000
}
```

**Response 200**
```json
{
  "success": true,
  "message": "Payment link created",
  "data": {
    "paymentUrl": "https://checkout.flutterwave.com/v3/hosted/pay/flwlnk-...",
    "reference": "75662530-1652-4884-8b3f-fc859c15ad01_1730000000000",
    "amount": 5000,
    "currency": "NGN",
    "link": "https://checkout.flutterwave.com/v3/hosted/pay/flwlnk-...",
    "checkoutUrl": "https://checkout.flutterwave.com/v3/hosted/pay/flwlnk-...",
    "redirectUrl": "https://checkout.flutterwave.com/v3/hosted/pay/flwlnk-..."
  }
}
```

Mobile should open **`data.paymentUrl`** in a WebView.

After payment, Flutterwave redirects to:

`https://recycool.com/wallet/payment/successful?reference={reference}`

Wallet credit is applied via `POST /wallet/hook` on `charge.completed`.

**Errors**
- `400` — invalid/missing amount
- `502` — Flutterwave did not return a payment URL
