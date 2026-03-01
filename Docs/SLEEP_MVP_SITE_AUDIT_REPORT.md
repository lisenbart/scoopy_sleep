# Sleep MVP Website — Full Technical + UX/Conversion Audit Report

**Project:** Scoopy Log Sleep MVP (web)  
**Goal:** Maximize conversion to paid (Stripe one-time), minimize friction/time-to-result, keep “calm” tone, be App Review safe (no medical claims).  
**Scope:** Web app codebase only. Factual, code-grounded. No implementation in this document.

---

## 1) Snapshot

### 1.1 Current page map / routes

| Route | Type | File | Purpose |
|-------|------|------|---------|
| `/` | Static | `src/app/page.tsx` | Home: hero + CTA “Build Sleep Plan” → links to `/sleep` |
| `/sleep` | Client (Suspense) | `src/app/sleep/page.tsx` | Full funnel: hero, problem, solution, value, form, conditional preview, conditional full plan |

**API routes (all POST):**

| Endpoint | File | Purpose |
|----------|------|---------|
| `/api/sleep/preview` | `src/app/api/sleep/preview/route.ts` | OpenAI call; returns `SleepPreview` (wake window, naps, bedtime, sample day). Requires `babyAge`; optional wakeUpTime, numNaps, parentGoal. |
| `/api/stripe/checkout` | `src/app/api/stripe/checkout/route.ts` | Creates Stripe Checkout Session; returns `{ url }`. Requires `email`; accepts `formData` (stored in session metadata). |
| `/api/sleep/fulfill` | `src/app/api/sleep/fulfill/route.ts` | Retrieves Stripe session by `session_id`, verifies paid; calls OpenAI for full plan; sends email (Resend) if configured; returns `SleepFullPlan` JSON. |
| `/api/sleep/full-plan` | `src/app/api/sleep/full-plan/route.ts` | **Not used by the app.** Same OpenAI full-plan generation as fulfill, but no Stripe; accepts form fields in body. Dead code for current flow. |

### 1.2 Current user flow (step-by-step)

1. **Landing:** User visits `/` (home). Sees hero + “Build Sleep Plan” CTA.
2. **Navigate:** User clicks CTA → full page navigation to `/sleep`.
3. **Scroll/read:** On `/sleep`, user sees hero → divider → ProblemBlock → SolutionBlock → ValueBlock → divider → form (“Build Your Plan”).
4. **Form:** User fills SleepForm (baby age required; wake-up time, naps, night wakings, parent goal, email all required in HTML). CTA: “Generate My Preview”.
5. **Preview request:** On submit, `handleSubmit` in `src/app/sleep/page.tsx` POSTs to `/api/sleep/preview` with form data (no email). No loading skeleton; button shows “Generating…”.
6. **Preview shown:** On success, `setPreview(data)`, `setShowPreview(true)`, scroll to `#preview`. PreviewBlock shows wake window, recommended naps, bedtime, sample day + “Unlock Full Plan — $9”.
7. **Checkout:** User clicks “Unlock Full Plan — $9” → `handleUnlock` POSTs to `/api/stripe/checkout` with `email` + `formData` → redirect to Stripe Checkout (`window.location.href = data.url`).
8. **Payment:** User pays on Stripe; redirect to `success_url`: `/sleep?session_id={CHECKOUT_SESSION_ID}`. If user cancels: `cancel_url`: `/sleep?canceled=1`.
9. **Return to /sleep:** Page loads with `session_id` in URL. `useEffect` in `SleepPageContent` runs: POSTs to `/api/sleep/fulfill` with `session_id`. On success: `setFullPlan(data)`, `emitSleepEvent("sleep_purchase_success")`, `history.replaceState` to remove `session_id`, scroll to `#full-plan`.
10. **Post-purchase:** FullPlanBlock shows full plan, disclaimer, “Download Printable PDF” (client-side jsPDF save), “Want to track…” CTA to app. Email with PDF attachment is sent in background by fulfill route (if Resend configured).

### 1.3 Where state lives

- **URL:** `session_id` (return from Stripe); `canceled=1` (not read or displayed anywhere in the app).
- **React state (in-memory, `/sleep` only):** `formData`, `preview`, `showPreview`, `isSubmitting`, `isUnlockLoading`, `fullPlan`, `fulfillError`. All live in `SleepPageContent` in `src/app/sleep/page.tsx`. No persistence: refresh loses form and preview; after payment, plan is re-fetched via `session_id` (fulfill called again if user refreshes before replaceState).
- **Server sessions:** None. No session store or cookies for the funnel.
- **Stripe:** Checkout Session stores form inputs in `metadata` (product, babyAge, wakeUpTime, numNaps, nightWakings, parentGoal; values truncated to 200 chars per key). Used by fulfill to build the OpenAI prompt.

### 1.4 Dependencies summary

| Dependency | Purpose | Env / config |
|------------|---------|--------------|
| **Stripe** | One-time payment ($9), Checkout Session; no webhooks. | `STRIPE_SECRET_KEY`; `NEXT_PUBLIC_APP_URL` (or request origin) for success/cancel URLs. |
| **OpenAI** | Preview (gpt-4o-mini, json_object, max 500 tokens); full plan in fulfill (gpt-4o-mini, json_object, max 3000 tokens). | `OPENAI_API_KEY` |
| **PDF** | jsPDF in `src/lib/sleep-pdf.ts`: client `generateSleepPlanPdf(plan)` for download; server `generateSleepPlanPdfBuffer(plan)` for email attachment. | None |
| **Resend** | Optional. Fulfill calls `sendSleepPlanEmail(to, plan)` after generating plan; no-op if `RESEND_API_KEY` not set. | `RESEND_API_KEY`, optional `SLEEP_EMAIL_FROM` |
| **Analytics** | `src/lib/analytics.ts`: `emitSleepEvent(event, payload?)` → `gtag` and `dataLayer.push`. Events: sleep_form_started, sleep_preview_generated, sleep_checkout_opened, sleep_purchase_success, sleep_pdf_downloaded, sleep_scoopy_click. | Consumer must provide gtag / GTM. |

---

## 2) UX & Conversion Funnel Audit

### 2.1 Friction points

- **Extra step / page transition:** Home has a single CTA that goes to `/sleep`. One full navigation and full page load before the user can start the form. No “instant” path from landing to form.
- **Form before value:** User must complete 6 fields (age, wake-up time, naps, night wakings, goal, email) before seeing any personalized output. Email is required even to get the free preview, although the preview API does not use email.
- **Two-step payoff:** Preview is free but “locked”; full plan requires payment. Clear, but the preview does not show a teaser of the 7-day structure (only wake window, naps count, bedtime, sample day text).
- **No loading skeleton:** While “Generating…” is shown on the submit button, the preview area does not show a skeleton or inline loader; scroll happens after response. If OpenAI is slow, user waits with no structural feedback.
- **Checkout leaves site:** Redirect to Stripe Hosted Checkout. Return depends on user not closing the tab; success_url brings them back to `/sleep?session_id=...`. If they close before returning, they still get email (if Resend is on) but may not see the on-page plan unless they revisit with the same session_id (which they would have to remember or re-open from email link if you added one).
- **Cancel flow unhandled:** `cancel_url` is `/sleep?canceled=1`. The app never reads `canceled`; no “You canceled checkout” or “Try again” message.
- **Error UX:** On preview/checkout/fulfill failure, a single error line is shown (`fulfillError`) in red above the preview block (`src/app/sleep/page.tsx` lines 137–142). No retry button, no distinction between network vs server vs validation errors.
- **Mobile:** Form is a single column; tap targets use `--tap-min: 44px`. Hero stacks (text then image). No explicit viewport or font-size clamp for very small screens beyond existing CSS.

### 2.2 Time-to-value estimate

- **Landing → preview:** ~1 navigation + form fill + 1 API call (preview). Form fill ~1–2 min; preview API typically 2–5 s. So ~2–3 min to first value (preview).
- **Preview → payment:** One click to checkout; Stripe load + payment ~1–2 min.
- **Payment → PDF/plan:** Redirect back + 1 fulfill call (OpenAI full plan + optional email). Fulfill often 5–15 s. So ~30 s–1 min to see full plan on page; email (if configured) shortly after. PDF download is immediate from the page.

### 2.3 Form design audit

- **Required fields:** All six are required (HTML `required` on selects/inputs). Baby age is the only one validated by the preview API; others are optional for the prompt but required in the UI.
- **Defaults:** `wakeUpTime: "07:00"`, rest empty (`DEFAULT_FORM` in `src/app/sleep/page.tsx`).
- **Validation:** No client-side validation beyond required; server returns 400 for missing `babyAge` (preview) or missing `email` (checkout). Error message is generic (“Something went wrong” or “Checkout failed”).
- **Error UX:** Errors set in state and rendered in one place; no field-level errors or inline server messages next to inputs.

### 2.4 Copy audit

- **Clarity:** Headlines and CTAs are clear (“Build Your Plan”, “Generate My Preview”, “Unlock Full Plan — $9”). “What You’ll Get” (ValueBlock) and “Your Full Plan Includes” (PreviewBlock) spell out benefits.
- **Trust:** Disclaimer exists in FullPlanBlock and in PDF. No testimonials or trust badges. No explicit “secure payment” or “money-back” copy.
- **Calm tone:** ProblemBlock and SolutionBlock use short, empathetic copy; no medical claims. OpenAI system prompts instruct “calm, practical tone” and “Do not make medical claims”.
- **Specificity:** Preview shows concrete outputs (wake window, nap count, bedtime, sample day). Full plan lists days with wake, naps, bedtime, notes. Good “what you get” specificity.

### 2.5 Mobile UX audit

- **Layout:** Single column; sections stack. Hero uses `hero-scoopy-inner` with column on small screens. Form is full-width within container.
- **Touch:** Buttons and inputs use min-height 44px via `--tap-min`. Radio groups are large clickable labels.
- **Viewport:** No explicit viewport meta in layout; Next.js default includes viewport. No dedicated mobile meta or theme-color in this codebase.
- **Above-the-fold (mobile):** Hero + CTA (“Build My Plan”) and start of problem block. User may need to scroll to see “Build Your Plan” form heading. First conversion step (form) is not guaranteed above the fold on small screens.
- **Performance:** No route-level code-splitting beyond Next automatic; sleep page pulls in all blocks. Images (e.g. ScoopyCap) use Next Image with priority on hero.

---

## 3) One-page vs Two-page Structure Analysis

### 3.1 Why the current split exists (code reasons)

- **Home (`/`):** Minimal landing: one hero, one CTA, one short “More tools coming soon” section. No form, no state. Exists to separate “marketing” from “product” and to keep `/sleep` focused on the funnel.
- **Sleep (`/sleep`):** Holds the entire funnel (hero → problem → solution → value → form → preview → full plan). State is local to this page; no shared store or URL encoding of form/preview.

So the split is by **purpose**: home = entry; sleep = full flow. There is no technical requirement (e.g. route-based API or auth) forcing two pages.

### 3.2 What is duplicated across pages

- **Hero:** Both pages have a hero with mascot (ScoopyCap) and CTA. Home: “Build Sleep Plan” (link to `/sleep`). Sleep: “Build My Plan” (scroll to form). Messaging is different; layout and visual treatment are the same.
- **Header/footer:** Shared layout (`src/app/layout.tsx`): same nav (Home, Sleep Plan) and footer on both.
- **Design system:** Shared `globals.css`, Tailwind, fonts. No duplication of CSS.

### 3.3 Risks of collapsing to one page

- **State:** All state is in `SleepPageContent`. Moving the home hero + section into `/sleep` (or into a single “guided funnel” page) would not increase state complexity; it could reduce it (one route, one tree). Risk: if the single page is long, scroll position and “where am I” may need careful treatment (e.g. scroll-to-form, anchor for return from Stripe).
- **SEO:** Currently two URLs: `/` and `/sleep`. One-page would leave one primary URL for the funnel. If you want a distinct landing URL for ads, keeping `/` as a light landing is useful. No schema or rich meta today.
- **Complexity/bugs:** One page with conditional sections (preview, full plan) already exists on `/sleep`. Adding the current home content above it would be additive; main risk is longer page and ensuring CTA “Build Sleep Plan” scrolls to form instead of navigating.
- **Analytics:** Events are tied to actions, not routes. Funnel would still be measurable; you might add a “page_view” or “section_view” if you go to a single long page with sections.

### 3.4 Recommended structure

- **Option A — Single-page “guided funnel”:** One route (e.g. `/sleep` or `/`) containing: hero → problem → solution → value → form → preview → full plan. Home CTA becomes “Build Sleep Plan” that scrolls to the form (same as current in-page CTA on `/sleep`). **Pros:** One less navigation, faster path to form, single place for state. **Cons:** Longer page; if you want a separate marketing landing for ads, you lose a dedicated `/` unless you keep a minimal `/` that redirects or duplicates hero + scroll link.
- **Option B — Two-step funnel (current):** Keep `/` and `/sleep`. **Pros:** Clear separation; `/` can be tailored for campaigns or future content. **Cons:** Extra click and load before starting the form.

**Recommendation: Option A (single-page guided funnel)** for conversion: minimize steps to first value (preview) and to payment. Implement by: (1) Moving the current home hero + “More tools coming soon” block into `/sleep` at the top (or making `/` a redirect to `/sleep` with a hash/anchor to form if desired). (2) Making the root `/` CTA a link to `/sleep#sleep-form` so one click lands at the form. (3) Keeping all state and flow on `/sleep` as today. This preserves current behavior while removing one full navigation for users who land on home and click “Build Sleep Plan”.

---

## 4) Technical Audit

### 4.1 Performance

- **Bundle:** Next 14; no dynamic imports in the sleep flow. Sleep page includes SleepHero, ProblemBlock, SolutionBlock, ValueBlock, SleepForm, PreviewBlock, FullPlanBlock and their deps (jsPDF, analytics). Build output: sleep page ~217 kB First Load JS (from provided build log).
- **Route-level loading:** Only `Suspense` is around `SleepPageContent` with fallback “Loading…” (no skeleton). No route-level loading.tsx in app directory.
- **Blocking calls:** Preview and fulfill are blocking from the user’s perspective (button disabled until response). No streaming or background prefetch.
- **Spinners/skeletons:** Submit shows “Generating…”; unlock shows “Opening checkout…”. No skeleton for preview area or full-plan area.

### 4.2 Reliability

- **OpenAI (preview):** On failure, 502 with `{ error: "Failed to generate preview", detail? }`. Front-end catches and sets `fulfillError`; user sees generic message. No retry.
- **OpenAI (fulfill):** On parse/API failure, 502 “Fulfillment failed”. Client shows “Could not load your plan”. No retry; user would need to refresh (session_id still in URL until replaceState) or contact support.
- **Stripe checkout:** 503 if Stripe not configured; 502 on session create failure. Client shows “Checkout failed”. No retry logic.
- **PDF (client):** `generateSleepPlanPdf` runs in browser; no server involved. If jsPDF throws, no catch in FullPlanBlock (would bubble).
- **Email:** Fulfill calls `sendSleepPlanEmail` in background; failures are logged; response to client is still the plan JSON. User gets plan on page even if email fails.

### 4.3 Security & privacy

- **Data collected:** Baby age, wake-up time, number of naps, night wakings, parent goal, email. All in form state; email + form fields sent to checkout and stored in Stripe session metadata (truncated). Fulfill reads metadata server-side; no separate DB.
- **Where stored:** Stripe Checkout Session (metadata). No app database or server-side session store. Plan is returned in fulfill response and held in React state; not persisted in localStorage or cookie.
- **Logs:** `console.error` in checkout and fulfill routes; preview logs in development. No evidence of PII in logs in code; Stripe metadata could contain PII (email, age, etc.) if logged elsewhere.
- **PII handling:** Email sent to Stripe (customer_email) and to Resend. No in-app privacy policy link or data handling statement in the flow.

### 4.4 App Review / compliance risk

- **Medical claims:** OpenAI system prompts explicitly say “Do not make medical claims” and “calm, practical tone” and “commonly referenced pediatric sleep ranges”. Disclaimer in FullPlanBlock and in PDF: “informational purposes only”, “not medical advice”, “consult your pediatrician”.
- **Data handling:** No visible “how we use your data” or “we store X and send Y to Z” in the UI. For App Review or GDPR-style expectations, a short privacy/processing notice (and link to full policy) near form or checkout would reduce risk.
- **Refunds:** Stripe one-time payment; no in-app refund flow. Refunds would be via Stripe Dashboard or support.

---

## 5) Payment & Fulfillment Audit

### 5.1 Stripe checkout/session creation

- **Path:** POST `/api/stripe/checkout` with `{ email, formData }`. `src/app/api/stripe/checkout/route.ts`: validates email, builds `baseUrl` from `NEXT_PUBLIC_APP_URL` or request origin, creates `stripe.checkout.sessions.create` with `mode: "payment"`, one line item $9.00 USD, `customer_email`, `success_url`, `cancel_url`, `metadata` (product + formData keys, values stringified and sliced to 200 chars).
- **Response:** `{ url: session.url }`. Client redirects via `window.location.href = data.url`.

### 5.2 Webhook handling

- **None.** There is no Stripe webhook handler in the repo. Fulfillment is entirely client-driven: user returns to `/sleep?session_id=...`, and the client calls `/api/sleep/fulfill` with that ID.

### 5.3 Post-payment success handling

- **Client:** On load, `useEffect` checks `searchParams.get("session_id")`. If present and `fullPlan` is null, POST to `/api/sleep/fulfill` with `session_id`. On 200: set full plan, emit `sleep_purchase_success`, `replaceState` to `/sleep`, scroll to `#full-plan`. On error: set `fulfillError`.
- **Server (fulfill):** Retrieve session, require `payment_status === "paid"` and `mode === "payment"`. Read metadata for babyAge, wakeUpTime, numNaps, parentGoal. Call OpenAI for full plan, normalize to `SleepFullPlan`, send email (Resend) if configured, return plan JSON.

### 5.4 Failure modes

- **User closes tab after payment:** They are not on success_url; they never call fulfill. Plan is not shown in-app. If Resend is configured, they do not get email (fulfill is never called, so email is never sent). **Gap:** Fulfill only runs when the user lands back on /sleep with session_id. So “close before redirect” = no plan and no email unless you add a webhook or a “claim your plan” link (e.g. from email sent by a webhook).
- **User refreshes after success:** Before replaceState, URL still has session_id; fulfill may run again (same session, same payment). OpenAI is called again (double cost); user gets plan again. After replaceState, refresh loses session_id; fulfill is not called; fullPlan is lost (state reset). User would need to rely on email PDF or support to get plan again.
- **Duplicate payment:** Stripe session is one-time; no duplicate charge for same session. User could open two checkouts (two sessions) and pay twice; no idempotency key in code.
- **Webhook delays:** N/A; no webhook.

### 5.5 Refund/support touchpoints

- No in-app refund or “Contact us” link in the flow. Footer has “Scoopy Log” and tagline only. FullPlanBlock has “Download Scoopy Log” for the app; no support/refund CTA.

---

## 6) Analytics Audit

### 6.1 Events implemented (exact names)

From `src/lib/analytics.ts` and call sites:

| Event | Where emitted |
|-------|----------------|
| `sleep_form_started` | `SleepForm` onFocusCapture / when first field updated (`src/components/sleep/SleepForm.tsx`) |
| `sleep_preview_generated` | After successful preview response (`src/app/sleep/page.tsx` after setPreview) |
| `sleep_checkout_opened` | When user clicks Unlock and before fetch to checkout (`src/app/sleep/page.tsx` handleUnlock) |
| `sleep_purchase_success` | After successful fulfill response (`src/app/sleep/page.tsx` in useEffect) |
| `sleep_pdf_downloaded` | When user clicks “Download Printable PDF” (`src/components/sleep/FullPlanBlock.tsx`) |
| `sleep_scoopy_click` | When user clicks “Download Scoopy Log” in FullPlanBlock (`src/components/sleep/FullPlanBlock.tsx`) |

### 6.2 Map to funnel steps

| Funnel step | Event(s) |
|-------------|----------|
| View landing | — (none) |
| View /sleep | — (none) |
| Start form | `sleep_form_started` |
| Submit form (preview) | — (none; only outcome: `sleep_preview_generated`) |
| See preview | `sleep_preview_generated` |
| Click pay | `sleep_checkout_opened` |
| Complete payment | — (no server-side event; client emits after fulfill) |
| See full plan | `sleep_purchase_success` |
| Download PDF | `sleep_pdf_downloaded` |
| Click app CTA | `sleep_scoopy_click` |

### 6.3 Missing critical events

- **Page/screen view:** No event for “saw home” or “saw sleep page” or “saw preview” / “saw full plan”. Hard to compute drop-off by step without a view at each stage.
- **Checkout abandoned:** Redirect to Stripe; no event when user leaves. No event when user returns with `canceled=1`.
- **Fulfill / plan load error:** No event when fulfill fails (e.g. `fulfillError` set). Would help for support and reliability monitoring.

### 6.4 Event naming cleanup

- Current names are consistent (`sleep_*`) and clear. Optional: add `sleep_preview_requested` (on submit click) to separate “attempt” from “success” (`sleep_preview_generated`). Not strictly necessary.

---

## 7) SEO & Landing Quality Audit

### 7.1 Meta tags, OG, page titles, schema

- **Layout:** `src/app/layout.tsx` exports `metadata`: `title: "Scoopy Log"`, `description: "A clear, personalized sleep plan for your baby (0–24 months)."`. Applies to all routes. No per-route metadata (no `generateMetadata` or route-specific export on `/` or `/sleep`).
- **OG/SEO:** No `openGraph`, `twitter`, or `metadataBase` in the codebase. No schema.org (Product, FAQPage, etc.).
- **Viewport:** Next.js default; no explicit viewport in this app.

### 7.2 Trust / content blocks

- **Privacy:** No link to privacy policy or “how we use your data” in header/footer or form.
- **How it works:** ValueBlock and PreviewBlock explain what the plan includes; no dedicated “How it works” (steps 1–2–3) section.
- **Testimonials:** None.

### 7.3 Above-the-fold (mobile)

- Home: Hero + CTA + start of next section. Form is on `/sleep`, not home.
- Sleep: Hero + “Build My Plan” + start of problem block. Form is below several sections; user must scroll to “Build Your Plan” and the first input.

---

## 8) Action Plan (Prioritized)

### P0 — Must fix before launch

1. **Handle checkout cancel**  
   **File:** `src/app/sleep/page.tsx`  
   **How:** Read `searchParams.get("canceled")` (e.g. when `session_id` is absent and `canceled === "1"`). Show a short message (“Checkout was canceled. You can try again when ready.”) and optionally scroll to preview or form. Prevents confusion when user returns after canceling.

2. **Fulfillment when user never returns**  
   **Files:** Fulfill flow + optional Resend  
   **How:** Either (a) add a Stripe webhook (e.g. `checkout.session.completed`) that calls the same full-plan generation + email logic and stores result (e.g. by session_id in a small store or send-only email with “View your plan” link), or (b) document that “if user closes tab after payment, they must use the email we send” and ensure email is sent from a path that does not depend on the user hitting success_url. Currently email is only sent from fulfill, which is client-triggered, so users who never return never get the plan or email. **Recommendation:** Add webhook that on paid session generates plan and sends email; optionally expose a “View plan” page keyed by session_id or token so user can open from email without relying on client state.

3. **Post-success refresh loses plan**  
   **File:** `src/app/sleep/page.tsx`  
   **How:** After `replaceState`, URL no longer has session_id; refresh clears state and user loses the plan. Options: (a) Keep session_id in URL as a hash or query (e.g. `?session_id=...` but only when fullPlan is null, then replace with a one-time token or “plan_id” after first load so refresh still works), or (b) Store plan in sessionStorage keyed by session_id on first fulfill success, and on load if no session_id but sessionStorage has a plan for a known key, restore it. Simpler: do not replaceState until user has seen the plan, or store minimal “plan received” flag + session_id in sessionStorage and on refresh re-call fulfill if session_id in storage and fullPlan null.

4. **Error recovery**  
   **File:** `src/app/sleep/page.tsx`  
   **How:** When `fulfillError` or preview/checkout error is set, add a “Try again” or “Retry” button that clears the error and either re-submits the form (preview) or re-calls fulfill (if session_id still present). Reduces dead-ends.

### P1 — Should fix

5. **Privacy / data use**  
   **Files:** `src/app/layout.tsx` (footer), or a dedicated page  
   **How:** Add a “Privacy” or “How we use your data” link in the footer pointing to a page or anchor that states what is collected (form data, email), where it goes (Stripe, Resend, OpenAI), and that it’s not sold. Supports App Review and trust.

6. **Per-route metadata and OG**  
   **Files:** `src/app/page.tsx`, `src/app/sleep/page.tsx` (or layout), `src/app/layout.tsx`  
   **How:** Export `metadata` (or `generateMetadata`) for `/` and `/sleep` with distinct titles and descriptions. Add `openGraph` and optionally `twitter` with title, description, and image if you have one. Improves sharing and SEO.

7. **Analytics: page/section views**  
   **File:** `src/lib/analytics.ts` + sleep page and optionally home  
   **How:** Emit a view event when `/sleep` mounts (e.g. `sleep_page_viewed`) and optionally when preview block or full plan block is in view (intersection or on show). Enables funnel drop-off analysis.

8. **Cancel flow message**  
   **File:** `src/app/sleep/page.tsx`  
   **How:** As in P0#1, show a calm message when `canceled=1` and optionally keep preview visible so user can click “Unlock” again without re-generating.

### P2 — Nice to have

9. **Loading skeleton for preview**  
   **File:** `src/app/sleep/page.tsx` or `src/components/sleep/PreviewBlock.tsx`  
   **How:** When `isSubmitting` is true, show a skeleton or placeholder in the preview area (e.g. grey blocks for the card) and scroll to it so user sees that something is loading.

10. **Single-page funnel (Option A)**  
    **Files:** `src/app/page.tsx`, `src/app/sleep/page.tsx`, navigation  
    **How:** Move home hero + “More tools” into top of `/sleep`; change home CTA to link to ` /sleep#sleep-form`. Optionally redirect `/` to `/sleep` or keep `/` as minimal landing with one CTA to ` /sleep#sleep-form`. Reduces one navigation for users entering from home.

11. **Idempotent fulfill**  
    **File:** `src/app/api/sleep/fulfill/route.ts`  
    **How:** For a given session_id, cache the generated plan (e.g. in memory or a small store keyed by session_id) and return cached result on repeated calls. Avoids duplicate OpenAI calls and cost when user refreshes or fulfill is called twice.

12. **Support / refund touchpoint**  
    **File:** Footer or FullPlanBlock  
    **How:** Add “Questions? Contact us” or “Refund policy” link to footer or near the download CTA. Improves trust and reduces support load.

---

**Document version:** 1.0  
**Codebase basis:** Sleep MVP web app as of audit date; routes, APIs, and components referenced by path and name as above.
