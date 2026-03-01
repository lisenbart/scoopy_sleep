# Sleep MVP — Plan store (shared durable store)

## Summary

The plan store holds post-payment plan state so that:
- The Stripe webhook can write once (idempotent) and any instance can read.
- The user can load the plan via `?session_id=...` on `/sleep` or via magic link `/sleep/claim?token=...` for 30 days.

When **Upstash Redis** env vars are set, the store uses Redis. Otherwise it falls back to in-memory (single instance only; not suitable for Netlify production).

---

## Required env vars (for Netlify)

| Variable | Description |
|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL (e.g. `https://xxx.upstash.io`) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |

If either is missing, the store uses in-memory backend (no PII, no persistence across instances).

---

## Keys and capabilities

- **By session:** `sleep:sess:{sessionId}` → JSON of `StoredPlan` (sessionId, token, status, plan?, expiresAt). TTL 30 days.
- **By token:** `sleep:token:{token}` → `sessionId` (string). TTL 30 days. Used to resolve `getByToken(token)` to the same record.

**StoredPlan:**  
`{ sessionId, token, status, plan?, expiresAt }`  
**Status:** `processing` | `ready` | `failed` | `expired` (expired is implied when missing or TTL passed; not stored as value).

- **Map session_id → token:** The record at `sleep:sess:{sessionId}` contains `token`.
- **Store token → record:** Lookup is token → sessionId → record; the “record” is the same as by session.

---

## Idempotency

- **Webhook:** Before generating, the handler calls `getBySessionId(sessionId)`. If status is `processing` or `ready`, it returns 200 and does not call `setProcessing` or OpenAI. So duplicate webhook deliveries do not trigger a second plan generation.
- **Writes:** `setProcessing(sessionId)` creates the record and token; `setReady(sessionId, plan)` updates the same record; `setFailed(sessionId)` updates status to failed.

---

## Call sites

| Call site | Usage |
|-----------|--------|
| `POST /api/stripe/webhook` | `getBySessionId` (idempotency), `setProcessing`, `setReady`, `setFailed` |
| `GET /api/sleep/plan?session_id=...` or `?token=...` | `getBySessionId` or `getByToken` |
| `POST /api/sleep/fulfill` (read-only) | `getBySessionId` |
| `/sleep/claim` (page) | Polls `GET /api/sleep/plan?token=...` |

---

## Diagnostics (no PII)

- Webhook logs to console when it writes to the store:
  - `[sleep store] sessionId <last 12 chars> status processing`
  - `[sleep store] sessionId <last 12 chars> status ready`
  - `[sleep store] sessionId <last 12 chars> status failed`
- No email, no full session id, no plan content in logs.
- Missing or expired token: `GET /api/sleep/plan` returns `status: "expired"` (or 410) for token lookup; for session_id, missing returns `status: "processing"` so the client keeps polling.

---

## What we do not do

- Do not store PDF in Redis (PDF is generated for the email attachment only).
- Do not change page structure, copy, pricing, or Stripe checkout behavior; store is backend-only.

---

## Implementation

- **File:** `src/lib/plan-store.ts`
- **Backends:** Redis (when env set) vs in-memory (fallback). Same async API: `setProcessing`, `setReady`, `setFailed`, `getBySessionId`, `getByToken`.

See also: `Docs/IMPLEMENTATION_REPORT_SLEEP_MVP_REBUILD.md`, `Docs/DEPLOY_SCOOPY_LOG_ACTIONS.md`.
