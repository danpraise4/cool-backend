# Backend AI Prompt — Platform Updates (Contact, Ratings, Bookmarks, Analytics Years, Orders)

Copy this prompt into your backend AI session.

---

The mobile app has shipped frontend changes that depend on the APIs below. Implement or update these endpoints so production matches the app behavior.

## Summary of mobile features waiting on backend

| Feature | Mobile entry | Backend dependency |
|--------|--------------|-------------------|
| Contact Us / Feedback / Report | `POST /support/contact` | Email to `admin@recycool.app` |
| Rate seller after order | `POST /user/ratings` (`contextType: "order"`) | Persist rating + update user average |
| Rate charity owner after request | `POST /user/ratings` (`contextType: "charity"`) | Same |
| Bookmarked community posts | `GET /community/bookmarks` | Paginated bookmark list |
| Insights year filter | `GET /recycle/analytics?year=2025\|2026` | Filter analytics by calendar year |
| Order rating target | `GET /market/orders` | Include seller user id on each order |

See **`docs/platform-updates-api.md`** for the implemented API reference in this repo.

---

## 1) Support / contact form

`POST /api/v1/support/contact` — auth required.

Request: `{ name, email, subject, message, type: "contact"|"feedback"|"report", context? }`

- Email to `admin@recycool.app`
- Subject: `[Recycool {type}] {subject}`
- Persist `SupportTicket` for audit

---

## 2) User ratings

`POST /api/v1/user/ratings` — auth required.

Request: `{ targetUserId, rating: 1-5, review?, contextType: "order"|"charity", contextId }`

Rules:
- One rating per `(reviewerId, contextType, contextId)` → `409` on duplicate
- Cannot rate self
- Order: buyer + order `COMPLETED`
- Charity: requester has `PENDING` or `APPROVED` request for product
- Recompute `User.averageRating` + expose as `user.rating` on profile

---

## 3) Community bookmarks

`GET /api/v1/community/bookmarks?page=1&pageSize=20`

- Same post shape as feed
- `isBookmarked: true` on every row
- Route must be registered **before** `/:id` routes

---

## 4) Recycle analytics year filter

`GET /api/v1/recycle/analytics?userId={uuid}&year=2025|2026`

- No year → all-time **COMPLETED** schedules
- With year → filter `updatedAt` within calendar year
- Response shape unchanged (material rows with `recycleCount`)

---

## 5) Market orders seller id

`GET /api/v1/market/orders` must include:

- `sellerId`, `soldBy`
- `createdBy.id`, `createdBy.rating`
- `product.userId`, `product.createdBy`

---

## 6) Charity owner rating fields

Charity listings include `createdBy.rating` / `createdBy.averageRating`.

---

## Done criteria

- [ ] Contact email delivers to admin@recycool.app
- [ ] Ratings persist with duplicate protection + average update
- [ ] Bookmarks list returns feed-compatible posts
- [ ] Analytics year filter works for 2025/2026
- [ ] Orders include seller id for rating sheet
- [ ] Profile shows updated rating after submit

---

## Mobile files reference

| Area | Path |
|------|------|
| Contact form | `app/(global)/contactForm.tsx` |
| Ratings | `components/ui/RateUserSheet.tsx` |
| Orders rating | `app/(orders)/index.tsx` |
| Charity rating | `app/(charity)/confirmItemDetails.tsx` |
| Bookmarks | `app/(global)/bookmarked.tsx` |
| Insights year | `utils/insightsPeriod.ts` |
