# Platform updates API (contact, ratings, bookmarks, analytics, orders)

Base path: `/api/v1`  
Auth: Bearer token unless noted.

---

## 1. Support / contact

`POST /support/contact`

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "subject": "Contact request",
  "message": "I need help with...",
  "type": "contact",
  "context": "Optional report context"
}
```

- Sends email to `admin@recycool.app`
- Persists `SupportTicket` row for audit

---

## 2. User ratings

`POST /user/ratings`

```json
{
  "targetUserId": "uuid",
  "rating": 5,
  "review": "Great experience",
  "contextType": "order",
  "contextId": "uuid"
}
```

- `contextType`: `"order"` | `"charity"`
- One rating per `(reviewer, contextType, contextId)` — duplicate returns `409`
- Updates `User.averageRating` and `User.ratingCount`
- `GET /user` returns `user.rating` (alias of average)

---

## 3. Community bookmarks

`GET /community/bookmarks?page=1&pageSize=20`

Returns bookmarked posts with same shape as feed (`isBookmarked: true` on all rows).

Toggle: `POST /community/:postId/bookmark`

---

## 4. Recycle analytics year filter

`GET /recycle/analytics?userId={uuid}&year=2025`

| Param | Behavior |
|-------|----------|
| `year` omitted | All-time completed schedules |
| `year=2025` | Completed schedules with `updatedAt` in 2025 |
| `year=2026` | Completed schedules with `updatedAt` in 2026 |

Also supports legacy `start` / `end` ISO date params.

---

## 5. Market orders — seller for ratings

`GET /market/orders` includes per order:

- `sellerId`
- `soldBy`
- `createdBy.id`, `createdBy.rating`
- `product.userId`, `product.createdBy`

---

## 6. Charity listings

Charity product APIs include:

```json
"createdBy": {
  "id": "uuid",
  "firstName": "...",
  "lastName": "...",
  "image": "...",
  "rating": 4.5,
  "averageRating": 4.5,
  "ratingCount": 12
}
```

---

## Migration

```bash
npx prisma migrate deploy
```

Adds `UserRating`, `SupportTicket`, `User.averageRating`, `User.ratingCount`.
