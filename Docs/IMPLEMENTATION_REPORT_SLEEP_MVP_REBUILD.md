# Sleep MVP Rebuild — Implementation Report

## What changed

### UX

- **Primary funnel:** `/sleep` is the single funnel page. Hero has one short promise line and a “Generate Preview” CTA that scrolls to the form.
- **Above-the-fold action:** Form is directly below a short hero and a mini trust line so the first meaningful action (select baby age + generate) is available quickly on mobile.
- **Reduced friction:** Only **Baby Age** is required to generate a preview. Wake-up time, number of naps, night wakings, and parent goal are optional. **Email** is collected only at the Unlock step (in the preview card), not in the main form.
- **Section order:** Hero → Mini trust line (“Secure payment. Informational only — not medical advice.”) → Form → Preview (with skeleton while generating) → “Unlock Full 7-Day Plan — $9” (email + CTA) → What you get (ValueBlock) → Social proof (placeholder parent quotes) → FAQ (disclaimer, how it works, refund/support, data use) → Footer (Privacy, Terms, Support).
- **Cancel handling:** If the user returns with `?canceled=1`, a calm banner is shown (“Checkout canceled. You can try again when you’re ready.”). Preview and form state are restored from `sessionStorage` so they can click Unlock again without re-generating the preview.
- **Loading:** Preview area shows a skeleton (placeholder blocks) and “Generating…” while the preview API is in progress; the button shows “Generating…” during submit.
- **Post-payment:** After payment, the user is redirected to `/sleep?session_id=...`. The client **polls** `GET /api/sleep/plan?session_id=...` until the plan is ready (or failed/expired). No client-side call to OpenAI for the full plan. If the user closes the tab after payment, they can use the “View your plan” magic link from the email to open `/sleep/claim?token=...`.

### Technical

- **Stripe webhook fulfillment:** On `checkout.session.completed` (payment mode, paid), the backend generates the full 7-day plan **once** (idempotent: duplicate webhook deliveries do not trigger a second OpenAI run). Plan JSON is stored in memory with a 30-day TTL. PDF is not stored permanently; it is generated for the email attachment only.
- **Plan store:** In-memory store (`src/lib/plan-store.ts`) keyed by Stripe `session_id` and by claim `token`. States: `processing`, `ready`, `failed`, `expired`. Entries are pruned on read when expired.
- **Magic link:** Email (when Resend is configured) includes a “View your plan online” link: `{baseUrl}/sleep/claim?token=...` (valid 30 days). `/sleep/claim` fetches the plan via `GET /api/sleep/plan?token=...` and shows a “Preparing your plan…” state with polling until ready.
- **Idempotency:** Webhook checks for an existing entry (by `session_id`) with status `processing` or `ready` and returns 200 without generating again.
- **Client no longer generates full plan:** The client never calls OpenAI for the full plan. `POST /api/sleep/fulfill` is **read-only**: it returns the plan from the store for the given `session_id` (for backward compatibility); the sleep page uses `GET /api/sleep/plan?session_id=...` and polling instead.
- **New API:** `GET /api/sleep/plan?session_id=...` or `?token=...` returns `{ status, plan?, claimToken? }` (status: `processing` | `ready` | `failed` | `expired`).

---

## File list

### New files

| File | Purpose |
|------|--------|
| `src/lib/plan-store.ts` | In-memory plan store with 30-day TTL; session_id and token lookup. |
| `src/lib/generate-full-plan.ts` | Shared full-plan generation (OpenAI); used only by the webhook. |
| `src/app/api/stripe/webhook/route.ts` | Stripe webhook: `checkout.session.completed` → generate plan, store, send email with PDF + magic link. |
| `src/app/api/sleep/plan/route.ts` | GET plan by `session_id` or `token`; returns status and plan. |
| `src/app/sleep/claim/page.tsx` | Magic-link page: view plan by token, with polling when processing. |
| `src/components/sleep/MiniTrustLine.tsx` | One-line trust: “Secure payment. Informational only — not medical advice.” |
| `src/components/sleep/PreviewSkeleton.tsx` | Skeleton UI in preview area while generating. |
| `src/components/sleep/FAQBlock.tsx` | FAQ: disclaimer, how it works, refund/support, data use. |
| `src/components/sleep/SocialProofBlock.tsx` | Placeholder parent quotes. |
| `src/components/sleep/SleepFooter.tsx` | Footer with Privacy, Terms, Support links. |
| `src/app/privacy/page.tsx` | Placeholder Privacy page. |
| `src/app/terms/page.tsx` | Placeholder Terms page. |
| `Docs/IMPLEMENTATION_REPORT_SLEEP_MVP_REBUILD.md` | This report. |

### Modified files

| File | Changes |
|------|--------|
| `src/app/sleep/page.tsx` | Funnel reorder; Hero → trust → Form → skeleton/preview → ValueBlock → Social proof → FAQ → SleepFooter. Cancel banner; restore preview/form from sessionStorage; poll GET `/api/sleep/plan?session_id=...` after payment; email only at Unlock. |
| `src/components/sleep/SleepHero.tsx` | One-sentence headline; single CTA “Generate Preview” (scroll to form). |
| `src/components/sleep/SleepForm.tsx` | Only baby age required; wake time, naps, night wakings, goal optional; email field removed (collected in PreviewBlock). |
| `src/components/sleep/PreviewBlock.tsx` | Email input at Unlock; disclaimer; “How we use your data” note; validate email before calling onUnlock. |
| `src/app/api/sleep/fulfill/route.ts` | Read-only: returns plan from store by `session_id`; no OpenAI call. |
| `src/lib/sleep-email.ts` | Optional `claimToken`; email body includes “View your plan online” link when token is provided. |
| `src/lib/plan-store.ts` | (N/A — new; one fix: use `Array.from(...).forEach` for iteration to satisfy TypeScript target.) |

### Unchanged (reference)

- `src/components/sleep/FullPlanBlock.tsx` — Already includes disclaimer; used on `/sleep` (after payment) and on `/sleep/claim`.
- `src/app/api/sleep/preview/route.ts` — Still only requires `babyAge`; optional fields accepted.
- `src/app/api/stripe/checkout/route.ts` — Unchanged; success_url `/sleep?session_id={CHECKOUT_SESSION_ID}`, cancel_url `/sleep?canceled=1`.

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|--------|
| `OPENAI_API_KEY` | Yes | Preview and full-plan generation. |
| `STRIPE_SECRET_KEY` | Yes | Checkout and webhook (Stripe API). |
| `STRIPE_WEBHOOK_SECRET` | Yes (for webhooks) | Verify Stripe webhook signature (`whsec_...`). |
| `NEXT_PUBLIC_APP_URL` | Recommended (production) | Base URL for Stripe redirects and magic link (e.g. `https://yoursite.netlify.app`). |
| `RESEND_API_KEY` | No | If set, send email with PDF and “View your plan” link after payment. If unset, webhook still stores the plan; user can only get it via return to `/sleep?session_id=...`. |
| `SLEEP_EMAIL_FROM` | No | From address for Resend (default: `Scoopy Log <onboarding@resend.dev>`). |

---

## Stripe webhook setup

1. **Endpoint URL (Netlify):**  
   `https://<your-site>.netlify.app/api/stripe/webhook`  
   (Use the same domain as `NEXT_PUBLIC_APP_URL`.)

2. **Event:**  
   `checkout.session.completed`

3. **Signing secret:**  
   In Stripe Dashboard → Developers → Webhooks → your endpoint → “Signing secret”. Copy as `STRIPE_WEBHOOK_SECRET` (starts with `whsec_...`).

4. **Local testing:**  
   Use Stripe CLI:  
   `stripe listen --forward-to localhost:3000/api/stripe/webhook`  
   and set `STRIPE_WEBHOOK_SECRET` to the secret the CLI prints.

5. **Request:**  
   POST, raw body; the route uses `request.text()` and `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`.

---

## Manual test checklist

- [ ] **Mobile:** Open `/sleep`; hero and form above the fold; only baby age required; generate preview; skeleton then preview; enter email at Unlock → checkout.
- [ ] **Desktop:** Same flow; layout and sections in order (Hero → trust → Form → Preview → What you get → Social proof → FAQ → Footer).
- [ ] **Cancel:** From checkout, click “Back” or cancel → land on `/sleep?canceled=1`; calm banner; preview still visible (or restored from sessionStorage); can Unlock again without re-generating.
- [ ] **Close tab after payment:** Pay in Stripe Checkout; when redirected to `/sleep?session_id=...`, close the tab. Open the “View your plan” link from the email (or, if no email, go to `/sleep?session_id=...` again). Plan loads (polling until ready) or claim page shows plan.
- [ ] **Refresh after payment:** Stay on `/sleep?session_id=...` and refresh; plan loads again from store (no second generation).
- [ ] **Magic link:** Open `/sleep/claim?token=...` from email. If still processing, “Generating your plan…” and polling; then full plan. If token expired or invalid, “This link has expired” / “Invalid or missing link” and link back to `/sleep`.
- [ ] **Expired token:** Use an old or invalid token on `/sleep/claim`; expect expired or error state.
- [ ] **Privacy / Terms / Support:** Footer links go to `/privacy`, `/terms`, and `mailto:support@scoopylog.com` (or update in `SleepFooter.tsx`).

---

## Known limitations

1. **Plan store:** When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set (e.g. on Netlify), the store uses Upstash Redis so plans are shared across serverless instances and persist for 30 days. If those env vars are not set, the store falls back to in-memory (single instance only). On Netlify (and other serverless platforms), different function instances do not share memory. A user might land on an instance that doesn’t have their plan yet (e.g. right after payment), or after a cold start the plan may be missing. For reliable 30-day access and cross-instance behavior, use a shared store (e.g. Redis, Netlify Blobs, or a database) and keep the same API shape (`getBySessionId`, `getByToken`, `setProcessing`, `setReady`, `setFailed`, TTL).

2. **PDF not stored:** PDF is generated only when sending the email. If Resend is not configured or the email fails, the user can still get the plan via the return URL (or magic link once the plan is ready) and use “Download Printable PDF” in the UI.

3. **Placeholder pages:** `/privacy` and `/terms` are placeholder content. Replace with your real policies.

4. **Support email:** Footer uses `mailto:support@scoopylog.com`; change in `SleepFooter.tsx` if needed.

5. **Full-plan API:** `POST /api/sleep/fulfill` remains for compatibility but is read-only (returns from store). The sleep page uses `GET /api/sleep/plan?session_id=...` and polling. The old `full-plan` route (if present) is unrelated to this flow; full plan generation is only in the webhook + `generate-full-plan.ts`.

---

Build: `npm run build` passes (Next.js 14). Netlify deployment uses this build.
