# Recycle Analytics Access Control

## Scope

This document defines privacy rules for recycle analytics/history endpoints.

## Private Endpoints (JWT required)

- `GET /api/v1/recycle/analytics`
  - Always scoped to authenticated `req.user.id`
  - Cross-user query attempts (e.g. `?userId=other`) are rejected with `403`
- `GET /api/v1/recycle/completed`
- `GET /api/v1/recycle/completed-schedules`
  - Always scoped to authenticated `req.user.id`
  - Returns only schedules with `status = COMPLETED`

## Public/Aggregated Endpoint

- `GET /api/v1/recycle/top-recyclers`
  - Aggregated leaderboard (cross-user by design)
  - Contains summary stats only

## Security Behavior

- Auth middleware required on private analytics routes
- Server never trusts client-provided user identifiers for private analytics
- Denied cross-user attempts are audit-logged with safe metadata
- Error message is generic and does not reveal target-user existence

## Changelog Note

Hardened analytics access control to authenticated user scope.
