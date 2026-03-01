"use client";

import { useRef, useState } from "react";
import type { SleepPreview } from "@/types/sleep";

const PREVIEW_DISCLAIMER =
  "For informational purposes only. Not medical advice. Consult your pediatrician for advice specific to your baby.";

const FULL_PLAN_FEATURES = [
  "Day-by-day 7-day adjustment schedule",
  "Exact nap and bedtime times for each day",
  "Age-appropriate wake window ranges",
  "Printable PDF to follow at home",
];

type PreviewBlockProps = {
  preview: SleepPreview;
  email: string;
  onEmailChange: (email: string) => void;
  onUnlock: () => void;
  isUnlockLoading?: boolean;
  unlockError?: string | null;
};

export default function PreviewBlock({
  preview,
  email,
  onEmailChange,
  onUnlock,
  isUnlockLoading = false,
  unlockError,
}: PreviewBlockProps) {
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [showEmailError, setShowEmailError] = useState(false);

  const handleUnlockClick = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setShowEmailError(true);
      emailInputRef.current?.focus();
      return;
    }
    setShowEmailError(false);
    onUnlock();
  };

  return (
    <section className="section section-alt" id="preview">
      <div className="container-narrow space-y-5 sm:space-y-8">
        <h2 className="heading-2">Your Preview</h2>

        <p className="text-sm text-[var(--text-muted)]">{PREVIEW_DISCLAIMER}</p>

        <div className="card-scoopy p-4 sm:p-6 space-y-4">
          <div>
            <span className="text-sm font-medium text-[var(--text-muted)]">Wake window</span>
            <p className="body-lg font-medium text-[var(--text-primary)] mt-1">{preview.wakeWindow}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-[var(--text-muted)]">Recommended naps</span>
            <p className="body-lg font-medium text-[var(--text-primary)] mt-1">{preview.recommendedNaps}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-[var(--text-muted)]">Suggested bedtime</span>
            <p className="body-lg font-medium text-[var(--text-primary)] mt-1">{preview.suggestedBedtime}</p>
          </div>
          {preview.sampleDaySchedule && (
            <div>
              <span className="text-sm font-medium text-[var(--text-muted)]">Sample day</span>
              <p className="body text-[var(--text-secondary)] leading-relaxed mt-1">{preview.sampleDaySchedule}</p>
            </div>
          )}
        </div>

        <div className="card-scoopy p-4 sm:p-6 relative border-2 border-[var(--border)]">
          <div className="absolute top-3 right-3">
            <span className="text-xs font-medium text-[var(--text-muted)] bg-[var(--accent-subtle)] px-2 py-1 rounded-[var(--radius-sm)]">
              Locked
            </span>
          </div>
          <h3 className="heading-3 mb-4 pr-16">Unlock Full 7-Day Plan — $9</h3>
          <ul className="space-y-2 list-disc list-inside body text-[var(--text-primary)] mb-4">
            {FULL_PLAN_FEATURES.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>

          <div className="mb-4">
            <label htmlFor="preview-email" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Email (to receive your plan)
            </label>
            <input
              ref={emailInputRef}
              id="preview-email"
              type="email"
              value={email}
              onChange={(e) => {
                onEmailChange(e.target.value);
                setShowEmailError(false);
              }}
              placeholder="you@example.com"
              className="input-scoopy w-full max-w-md"
              aria-invalid={showEmailError || !!unlockError}
              aria-describedby={showEmailError || unlockError ? "preview-email-error" : undefined}
            />
            {(showEmailError || unlockError) && (
              <p id="preview-email-error" className="text-sm text-[#EF4444] mt-1" role="alert">
                {showEmailError ? "Please enter your email to continue." : unlockError}
              </p>
            )}
          </div>

          <p className="text-xs text-[var(--text-muted)] mb-4 max-w-lg">
            How we use your data: Payment is processed by Stripe. We use your inputs to generate your plan (via our AI provider) and send it to your email. We don’t sell your data. See Privacy and Terms for details.
          </p>

          <button
            type="button"
            className="btn-primary rounded-[999px] disabled:opacity-60 w-full sm:w-auto min-h-[var(--tap-min)]"
            onClick={handleUnlockClick}
            disabled={isUnlockLoading}
            aria-label="Unlock full plan for $9"
          >
            {isUnlockLoading ? "Opening checkout…" : "Unlock Full Plan — $9"}
          </button>
        </div>
      </div>
    </section>
  );
}
