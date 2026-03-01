# Sleep Plan UI — Implementation Report

## Overview

A single-page MVP flow for the **Sleep Plan** feature on the Scoopy Log website: **Landing → Form → Preview**. UI and local mock preview only; no Stripe, no OpenAI, no backend.

**Route:** `/sleep`

---

## Files Created

### App & layout

| File | Purpose |
|------|--------|
| `src/app/layout.tsx` | Root layout: fonts (Source Serif 4, DM Sans), header with “Scoopy Log” + nav (Home, Sleep Plan), footer. |
| `src/app/page.tsx` | Homepage: calm hero and CTA to Sleep Plan. |
| `src/app/sleep/page.tsx` | Sleep page: composes Hero → Problem → Solution → Value → Form → Preview; handles scroll-to-form, form state, and mock preview visibility. |
| `src/app/globals.css` | Global styles, design tokens (colors, spacing), utility classes (heading-1, body-lg, btn-primary, etc.). |

### Sleep page components

| File | Purpose |
|------|--------|
| `src/components/sleep/SleepHero.tsx` | Hero: headline, subheadline, “Build My Plan” CTA (scrolls to form), supporting line. |
| `src/components/sleep/ProblemBlock.tsx` | “When sleep feels unpredictable” + bullets + closing line. |
| `src/components/sleep/SolutionBlock.tsx` | “A Plan Built Around Your Baby’s Age” + 3 steps + support lines. |
| `src/components/sleep/ValueBlock.tsx` | “What You’ll Get” + bullet list. |
| `src/components/sleep/SleepForm.tsx` | Form: baby age (dropdown), wake-up time, number of naps (radio), night wakings (radio), parent goal (radio), email (required); “Generate My Preview” submit. |
| `src/components/sleep/PreviewBlock.tsx` | Mock preview: wake window, recommended naps, suggested bedtime; locked “Your Full Plan Includes” section + “Unlock Full Plan — $9” button (no payment). |

### Config & design system

| File | Purpose |
|------|--------|
| `package.json` | Next.js 14, React 18, TypeScript, Tailwind, ESLint. |
| `tailwind.config.ts` | Brand colors (cream, sand, stone, sage, slate, navy, text, muted), font variables, section/block spacing. |
| `tsconfig.json`, `next.config.js`, `postcss.config.js` | Standard Next.js + Tailwind setup. |

---

## Structure

```
MVP1/
├── Docs/
│   └── SLEEP_UI_REPORT.md          ← this file
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx                (home)
│   │   └── sleep/
│   │       └── page.tsx            (/sleep)
│   └── components/
│       └── sleep/
│           ├── SleepHero.tsx
│           ├── ProblemBlock.tsx
│           ├── SolutionBlock.tsx
│           ├── ValueBlock.tsx
│           ├── SleepForm.tsx
│           └── PreviewBlock.tsx
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── postcss.config.js
```

---

## Visual style (matched across site)

- **Fonts:** Source Serif 4 (headings), DM Sans (body). Calm, readable.
- **Colors:** Cream background (`#F8F6F2`), sand/stone accents, sage green for primary actions, slate/navy for text.
- **Spacing:** Section padding `clamp(3rem, 6vw, 5rem)`; block spacing `clamp(1.5rem, 3vw, 2.5rem)`.
- **Tone:** Calm, minimal, no clutter. Buttons: primary (sage), secondary (outline).

---

## Flow

1. **Landing:** User sees Hero → Problem → Solution → Value on `/sleep`.
2. **CTA:** “Build My Plan” smoothly scrolls to the form (`#sleep-form`).
3. **Form:** User fills baby age, wake-up time, naps, night wakings, goal, email; clicks “Generate My Preview.”
4. **Preview:** After a short loading state (600 ms), mock preview is shown and page scrolls to `#preview`. Preview shows static data: wake window “2h 30m – 3h”, recommended naps “2–3”, suggested bedtime “7:15 PM”, plus locked “Full Plan” section with “Unlock Full Plan — $9” (no payment logic).

---

## Mock data

Preview always shows the same mock values (see `getMockPreview` in `src/app/sleep/page.tsx`):

- **Wake window:** 2h 30m – 3h  
- **Recommended naps:** 2–3  
- **Suggested bedtime:** 7:15 PM  

Form inputs are not yet used to compute these; that will come with backend/AI.

---

## Not implemented (as requested)

- Stripe or any payment
- OpenAI or any AI generation
- Backend API or database
- Real plan generation or PDF

---

## How to run

```bash
cd /Users/dmytrolisenbart/Desktop/MVP1
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the home page and [http://localhost:3000/sleep](http://localhost:3000/sleep) for the Sleep Plan flow.
