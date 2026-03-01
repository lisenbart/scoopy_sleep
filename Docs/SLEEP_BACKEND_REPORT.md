# Sleep Plan Backend — Implementation Report

## Overview

Backend logic for the `/sleep` MVP:

- **OpenAI**: Preview generation (structured output) and full 7-day plan generation; API key kept on the server.
- **Stripe**: One-time $9 checkout (redirect to Stripe Checkout); on success, fulfill by generating the full plan and rendering it on the page.
- **Analytics**: Events `sleep_preview_generated`, `sleep_checkout_opened`, `sleep_purchase_success` emitted from the client (plug into your provider via `gtag` / `dataLayer`).

---

## Required Environment Variables

Set these in `.env.local` (or your deployment env). Do **not** commit `.env.local`.

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key. Used only in server routes (`/api/sleep/preview`, `/api/sleep/full-plan`, `/api/sleep/fulfill`). Never exposed to the client. |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (starts with `sk_`). Used in `/api/stripe/checkout` and `/api/sleep/fulfill`. |
| `NEXT_PUBLIC_APP_URL` | No | Base URL of the app (e.g. `https://yoursite.com`). Used for Stripe `success_url` and `cancel_url`. If unset, falls back to the request origin. |

Example `.env.local`:

```bash
OPENAI_API_KEY=sk-proj-...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Stripe Setup Instructions

### 1. Create a Stripe account and get keys

- Sign up at [stripe.com](https://stripe.com).
- In the [Dashboard](https://dashboard.stripe.com): **Developers → API keys**.
- Use **Test mode** for development:
  - **Publishable key**: `pk_test_...` (optional for this flow; we use server-only checkout redirect).
  - **Secret key**: `pk_test_...` → copy as `STRIPE_SECRET_KEY` (use the **Secret** key, e.g. `sk_test_...`).

### 2. One-time $9 product

This implementation does **not** use a pre-created Product/Price in the Dashboard. The checkout route creates a one-time payment with:

- **Amount**: $9.00 USD (`unit_amount: 900` cents).
- **Mode**: `payment` (one-time), not `subscription`.
- **Product name**: “Sleep Plan — Full 7-Day Plan”.

No need to create a product in Stripe; the route uses [Price data](https://docs.stripe.com/api/checkout/sessions/create#create_checkout_session-line_items-price_data) at session creation.

### 3. Checkout flow

- User clicks **“Unlock Full Plan — $9”** on `/sleep`.
- Client calls `POST /api/stripe/checkout` with `{ email, formData }`.
- Server creates a Stripe Checkout Session (mode `payment`, $9, metadata includes form fields for fulfillment).
- Server returns `{ url }`; client redirects to `url` (Stripe Hosted Checkout).
- After payment, Stripe redirects to `success_url`: `/sleep?session_id={CHECKOUT_SESSION_ID}`.
- Page loads with `session_id`; client calls `POST /api/sleep/fulfill` with `{ session_id }`.
- Server verifies the session is paid, reads form data from session metadata, calls OpenAI to generate the full plan, returns the plan; client displays it and emits `sleep_purchase_success`.

### 4. Webhooks (optional for MVP)

The current flow does **not** require a webhook for fulfillment: fulfillment is triggered when the user lands on `/sleep?session_id=...` and the client calls `/api/sleep/fulfill`. For production you may later add a `checkout.session.completed` webhook to fulfill even if the user closes the browser before the redirect, and to send email (e.g. PDF). To add a webhook:

- **Developers → Webhooks → Add endpoint**.
- URL: `https://your-domain.com/api/stripe/webhook` (you would implement this route).
- Event: `checkout.session.completed`.
- Use `STRIPE_WEBHOOK_SECRET` to verify signatures (not implemented in this MVP).

---

## OpenAI Model Used

- **Model**: `gpt-4o-mini`
- **Usage**:
  - **Preview** (`POST /api/sleep/preview`): Structured JSON only (wake window, recommended naps, suggested bedtime, sample day schedule). `response_format: { type: "json_object" }`, no medical claims, calm and practical tone.
  - **Full plan** (`POST /api/sleep/full-plan` and inside `POST /api/sleep/fulfill`): Same model; output is a 7-day plan (summary + array of days with wake time, naps, bedtime, optional notes).

All prompts instruct the model to avoid medical claims and to base suggestions on commonly referenced pediatric sleep ranges.

---

## API Routes Summary

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/sleep/preview` | POST | Body: `babyAge`, `wakeUpTime`, `numNaps`, `nightWakings`, `parentGoal`. Returns structured preview (wake window, recommended naps, suggested bedtime, sample day schedule). Uses `OPENAI_API_KEY`. |
| `/api/sleep/full-plan` | POST | Body: same form fields (+ optional `email`). Returns full 7-day plan (summary + days). Used if you want to generate a plan without payment (e.g. admin). |
| `/api/sleep/fulfill` | POST | Body: `session_id` (Stripe Checkout Session ID). Verifies payment, reads form data from session metadata, generates full plan via OpenAI, returns plan. Used after successful checkout. |
| `/api/stripe/checkout` | POST | Body: `email`, `formData` (object with form fields). Creates Stripe Checkout Session for one-time $9, returns `{ url }`. Client redirects to `url`. |

---

## Analytics Events

Emitted from the client (see `src/lib/analytics.ts`):

- **`sleep_preview_generated`**: After the preview API returns successfully and the preview is shown.
- **`sleep_checkout_opened`**: When the user clicks “Unlock Full Plan — $9” and the checkout request is sent.
- **`sleep_purchase_success`**: After the full plan is successfully loaded following payment (fulfill returns the plan and it is rendered).

The helper pushes to `window.gtag` (if present) and `window.dataLayer`. Wire these to your analytics provider (e.g. Google Analytics, Segment).

---

## Files Created or Updated

### New files

- `src/app/api/sleep/preview/route.ts` — OpenAI preview generation.
- `src/app/api/sleep/full-plan/route.ts` — OpenAI full plan generation (standalone).
- `src/app/api/sleep/fulfill/route.ts` — Stripe session verification + OpenAI full plan.
- `src/app/api/stripe/checkout/route.ts` — Stripe Checkout Session creation.
- `src/lib/analytics.ts` — Sleep analytics event helper.
- `src/types/sleep.ts` — Shared types (`SleepPreview`, `SleepFullPlan`, etc.).

### Updated files

- `src/app/sleep/page.tsx` — Calls preview API on form submit; checkout redirect on “Unlock”; reads `session_id`, calls fulfill, shows full plan; emits analytics.
- `src/components/sleep/PreviewBlock.tsx` — Accepts `SleepPreview` (with `sampleDaySchedule`), `onUnlock`, `isUnlockLoading`.
- `src/components/sleep/FullPlanBlock.tsx` — New component to render the 7-day plan.
- `package.json` — Added `openai`, `stripe`.

---

## Security Notes

- **OpenAI API key**: Used only in server-side route handlers; never sent to the client.
- **Stripe secret key**: Used only in server-side routes; never exposed.
- **Fulfillment**: Full plan is generated only after Stripe session is verified as `payment_status === "paid"`.
- **Metadata**: Form data is stored in Stripe session metadata (size limits apply); no PII beyond what’s needed for plan generation and email.

---

## How to Run Locally

1. Copy env and set keys (see `.env.example` for a template):

   ```bash
   cp .env.example .env.local
   # Edit .env.local: OPENAI_API_KEY, STRIPE_SECRET_KEY, NEXT_PUBLIC_APP_URL
   ```

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

3. Open `http://localhost:3000/sleep`, submit the form to get an OpenAI preview, then use “Unlock Full Plan — $9” to go through Stripe Checkout (use test card `4242 4242 4242 4242`). After payment, you are redirected to `/sleep?session_id=...` and the full plan is generated and displayed.
