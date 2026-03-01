# Sleep Plan MVP — Implementation Report

## Overview

This document describes the complete post-purchase experience and final UX flow for the `/sleep` MVP: full 7-day plan structure, printable PDF, soft upsell, analytics hooks, and deployment guidance.

---

## UX Flow (No Reload Between Preview and Purchase)

1. **Landing** — User visits `/sleep`, sees Hero → Problem → Solution → Value → Form.
2. **Form** — User fills baby age, wake-up time, naps, night wakings, goal, email. First focus or first field change emits `sleep_form_started`.
3. **Preview** — User clicks “Generate My Preview”. Client calls `POST /api/sleep/preview` (no full page reload). Preview (wake window, recommended naps, suggested bedtime, sample day) is shown; `sleep_preview_generated` is emitted.
4. **Checkout** — User clicks “Unlock Full Plan — $9”. Client emits `sleep_checkout_opened`, calls `POST /api/stripe/checkout`, receives Stripe Checkout URL, and redirects to Stripe Hosted Checkout (navigates away; expected).
5. **Return** — After payment, Stripe redirects to `/sleep?session_id=...`. Page loads once. Client calls `POST /api/sleep/fulfill` with `session_id`; server verifies payment and generates full plan via OpenAI; client renders full plan and emits `sleep_purchase_success`. No in-app reload between preview and checkout; the only full load is the return from Stripe.
6. **Post-purchase** — User sees full plan (Summary, Detailed Day Schedule, 7-Day Adjustment Plan, Troubleshooting, Optimization Tips, Disclaimer), “Download Printable PDF”, and soft upsell “Download Scoopy Log”. PDF download emits `sleep_pdf_downloaded`; upsell click emits `sleep_scoopy_click`.

---

## Full 7-Day Plan Structure (Post-Purchase)

After successful payment, the page renders:

| Section | Content |
|--------|---------|
| **Summary** | 1–2 sentences describing the plan (from OpenAI). |
| **Detailed Day Schedule** | For each of 7 days: wake time, naps (start–end), bedtime, optional tip. |
| **7-Day Adjustment Plan** | 2–4 short paragraphs on how to use the plan and what to expect (from OpenAI). |
| **Troubleshooting** | 3–5 bullet points for common issues (early waking, short naps, bedtime resistance) (from OpenAI). |
| **Optimization Tips** | 3–5 bullet points for consistency, environment, wind-down (from OpenAI). |
| **Disclaimer** | Fixed copy: informational only, not medical advice; consult pediatrician; adjust to your family. |
| **Download Printable PDF** | Button triggers client-side PDF generation and download; emits `sleep_pdf_downloaded`. |
| **Soft Upsell** | “Want to track this schedule automatically?” + “Download Scoopy Log” button; emits `sleep_scoopy_click`. |

---

## Analytics Events

All events are defined in `src/lib/analytics.ts` and emitted via `emitSleepEvent(event, payload?)`. They are pushed to `window.gtag` (if present) and `window.dataLayer`. Wire these to your analytics provider (e.g. Google Analytics, Segment).

| Event | When |
|-------|------|
| **sleep_form_started** | Once per session, when the user first focuses or changes a field in the sleep form. |
| **sleep_preview_generated** | After the preview API returns successfully and the preview block is shown. |
| **sleep_checkout_opened** | When the user clicks “Unlock Full Plan — $9” and the checkout request is sent. |
| **sleep_purchase_success** | After the full plan is successfully loaded and displayed following payment. |
| **sleep_pdf_downloaded** | When the user clicks “Download Printable PDF” and the PDF is generated/downloaded. |
| **sleep_scoopy_click** | When the user clicks “Download Scoopy Log” in the soft upsell section. |

---

## Files Added

| File | Purpose |
|------|---------|
| `src/lib/sleep-pdf.ts` | Generates a simple PDF from `SleepFullPlan` (summary, day schedule, adjustment plan, troubleshooting, tips, disclaimer) using jsPDF. Clean layout, no complex styling. |
| `Docs/IMPLEMENTATION_REPORT_SLEEP_MVP.md` | This report. |

---

## Files Modified

| File | Changes |
|------|---------|
| `src/types/sleep.ts` | Extended `SleepFullPlan` with optional `adjustmentPlan`, `troubleshooting`, `optimizationTips` (strings). |
| `src/lib/analytics.ts` | Added event types: `sleep_form_started`, `sleep_pdf_downloaded`, `sleep_scoopy_click`. |
| `src/app/api/sleep/fulfill/route.ts` | OpenAI prompt and parsing extended to return and map `adjustmentPlan`, `troubleshooting`, `optimizationTips`; `max_tokens` increased to 3000. |
| `src/app/api/sleep/full-plan/route.ts` | Same schema and parsing as fulfill for consistency; `max_tokens` 3000. |
| `src/components/sleep/FullPlanBlock.tsx` | Restructured: Summary, Detailed Day Schedule, 7-Day Adjustment Plan, Troubleshooting, Optimization Tips, Disclaimer; “Download Printable PDF” button (calls `generateSleepPlanPdf`, emits `sleep_pdf_downloaded`); soft upsell block with “Download Scoopy Log” (emits `sleep_scoopy_click`, opens `/download` in new tab). |
| `src/components/sleep/SleepForm.tsx` | Emit `sleep_form_started` on first focus (onFocusCapture) or first field change (in `update`); ref used so event fires once per session. |
| `package.json` | Added dependency `jspdf` (^2.5.2). |

---

## PDF Generation

- **Library:** jsPDF.
- **Source:** Full plan data (same object used to render the page), not raw HTML.
- **Layout:** Simple text: title, summary, day-by-day schedule (wake, naps, bedtime, notes), 7-Day Adjustment Plan, Troubleshooting, Optimization Tips, disclaimer. Pagination when content overflows.
- **Trigger:** “Download Printable PDF” in `FullPlanBlock`; calls `generateSleepPlanPdf(plan)` then `emitSleepEvent("sleep_pdf_downloaded")`. Filename: `scoopy-log-sleep-plan.pdf`.

---

## Soft Upsell

- **Title:** “Want to track this schedule automatically?”
- **Text:** “Adjust daily, track naps, and refine your routine inside Scoopy Log.”
- **Button:** “Download Scoopy Log” — opens `/download` in a new tab (replace with app store URL when ready). Emits `sleep_scoopy_click`.

---

## Security Notes

- **OpenAI API key:** Used only in server routes (`/api/sleep/preview`, `/api/sleep/full-plan`, `/api/sleep/fulfill`). Never exposed to the client.
- **Stripe secret key:** Used only in server routes. Never exposed to the client.
- **Fulfillment:** Full plan is generated only after Stripe session is verified (`payment_status === "paid"`). Session metadata (form data) is used only for plan generation.
- **PDF:** Generated client-side from plan data already in memory; no extra server round-trip or PII sent for PDF.
- **Analytics:** Events are client-side only; no sensitive data in event payloads. Plug your provider into `gtag` / `dataLayer` as needed.

---

## Deployment Checklist

- [ ] **Environment variables** (e.g. in Vercel/Netlify):
  - `OPENAI_API_KEY`
  - `STRIPE_SECRET_KEY`
  - `NEXT_PUBLIC_APP_URL` (production URL for Stripe redirects)
- [ ] **Stripe:** Use live keys in production; ensure success/cancel URLs use `NEXT_PUBLIC_APP_URL`.
- [ ] **Analytics:** Add gtag or dataLayer script and wire events to your analytics tool.
- [ ] **Upsell link:** Update “Download Scoopy Log” target from `/download` to your app store or landing page if desired (e.g. via env `NEXT_PUBLIC_SCOOPY_APP_URL` or hardcode in `FullPlanBlock`).
- [ ] **Disclaimer:** Current disclaimer text is fixed in `FullPlanBlock` and in `sleep-pdf.ts`; update in both places if you change wording.
- [ ] **Test flow:** Form → Preview → Checkout (test card) → Return → Full plan → PDF download → Upsell click; confirm all six analytics events fire as expected.
