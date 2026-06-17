# In-app notifications API

Base path: `/api/v1/user`  
All endpoints require `Authorization: Bearer <token>`.

## Overview

Notifications are stored in the database and optionally sent as Expo push notifications when `isPushNotificationsEnabled` is true.

Each notification includes:
- `id`, `title`, `body`, `image`, `link`
- `type` — event category (e.g. `ORDER_PLACED`, `WALLET_TOPUP`)
- `metadata` — JSON payload for deep links / UI
- `isRead`, `createdAt`

---

## `GET /get-notifications`

List in-app notifications (excludes soft-deleted).

**Query params (optional)**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Page size (max 50) |
| `unreadOnly` | `"true"` \| `"false"` | — | Only unread when `true` |

**Response 200**
```json
{
  "success": true,
  "message": "Notifications fetched successfully",
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "title": "Order placed",
      "body": "Your order for Plastic Bottles was placed successfully.",
      "image": null,
      "link": "/orders",
      "type": "ORDER_PLACED",
      "metadata": { "type": "ORDER_PLACED", "orderId": "...", "reference": "..." },
      "isRead": false,
      "isDeleted": false,
      "createdAt": "2026-06-16T12:00:00.000Z",
      "updatedAt": "2026-06-16T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3,
    "unreadCount": 5
  }
}
```

---

## `GET /notifications/unread-count`

**Response 200**
```json
{
  "success": true,
  "message": "Unread notification count fetched successfully",
  "data": { "unreadCount": 5 }
}
```

---

## `PATCH /mark-notification-as-read/:id`

Mark a single notification as read.

---

## `PATCH /mark-notification-as-unread/:id`

Mark a single notification as unread.

---

## `PATCH /mark-all-notifications-as-read`

Mark all non-deleted notifications as read.

**Response 200**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": { "updatedCount": 5 }
}
```

---

## `DELETE /delete-notification/:id`

Soft-delete a notification (hidden from list, marked read).

---

## Notification types emitted

| Type | Trigger |
|------|---------|
| `REGISTRATION` | Sign up (email or Google) |
| `LOGIN` | Sign in |
| `PASSWORD_CHANGED` | Password update |
| `ACCOUNT_DELETED` | Account deletion |
| `ORDER_PLACED` | Buyer places order |
| `ORDER_RECEIVED` | Seller receives order |
| `ORDER_CONFIRMED` | Seller confirms order |
| `PRODUCT_UPLOADED` | Product listed |
| `CHARITY_REQUEST_RECEIVED` | Charity item requested |
| `CHARITY_REQUEST_ACCEPTED` | Charity request approved |
| `CHARITY_REQUEST_REJECTED` | Charity request declined |
| `WALLET_TOPUP` | Wallet credited |
| `WALLET_WITHDRAWAL` | Withdrawal initiated |
| `RECYCLE_REQUEST_SUBMITTED` | Recycle schedule created |
| `RECYCLE_COMPLETED` | Schedule completed |
| `RECYCLE_CANCELLED` | Schedule cancelled |
| `RECYCLE_REMINDER` | Reminder cron |

---

## Push setup

1. `PATCH /api/v1/user/update-device` with Expo `deviceToken`
2. `PATCH /api/v1/user/update-settings` — toggle `isPushNotificationsEnabled`

In-app rows are **always** created regardless of push settings.

---

## Database migration

Run after deploy:
```bash
npx prisma migrate deploy
```

Adds `type`, `metadata` columns and indexes on `Notification`.
