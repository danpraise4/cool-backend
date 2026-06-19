# User rating display — marketplace API contract

Mobile reads seller/requester ratings from listing and order payloads. All endpoints below expose:

```json
{
  "rating": 4.7,
  "averageRating": 4.7,
  "reviewCount": 12,
  "createdBy": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Doe",
    "rating": 4.7,
    "reviewCount": 12
  }
}
```

`rating: 0` when the user has no reviews yet.

---

## Endpoints updated

| Endpoint | Rating fields |
|----------|----------------|
| `GET /user/get-home-top-deals` | `rating`, `createdBy.rating` per deal |
| `GET /user/get-home-charities` | same |
| `GET /market/products` (available) | same |
| `GET /market/products/:id` | `createdBy.rating`, top-level `rating` |
| `GET /market/carts` | `product.createdBy.rating` |
| `GET /market/orders` | `sellerId`, `rating`, `createdBy.rating`, `hasRated`, `userRating` |
| `GET /market/i/charity/requests` | `requests[].createdBy.rating` (requester) |
| `GET /market/i/charity/history` | `createdBy.rating` on history items |
| `GET /market/charity` (all users) | `createdBy.rating` |
| `GET /user` | `user.rating`, `user.reviewCount` |
| `GET /community` + `/community/bookmarks` | `user.rating` on post author |

---

## Orders — buyer rating state

```json
{
  "hasRated": false,
  "userRating": null,
  "rating": 4.5,
  "createdBy": { "rating": 4.5 }
}
```

After `POST /user/ratings` with `contextType: "order"`:

- `hasRated: true`
- `userRating: 5`
- Seller `rating` / `createdBy.rating` reflects new average

---

## Submit rating response

`POST /user/ratings` returns:

```json
{
  "data": {
    "rating": 5,
    "averageRating": 4.7,
    "reviewCount": 13
  }
}
```

---

## Implementation

Shared helpers in `src/features/user/rating.service.ts`:

- `formatUserRating`
- `enrichUserWithRating`
- `enrichProductListing`
- `createdByWithRatingSelect`

User averages are cached on `User.averageRating` / `User.ratingCount`, recomputed on each rating submit.
