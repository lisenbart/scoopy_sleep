"use client";

import { useRef, useCallback } from "react";
import { emitSleepEvent } from "@/lib/analytics";

export type SleepFormData = {
  babyAge: string;
  wakeUpTime: string;
  numNaps: string;
  nightWakings: string;
  parentGoal: string;
  email: string;
};

const AGE_OPTIONS = Array.from({ length: 25 }, (_, i) => ({
  value: String(i),
  label: i === 0 ? "Under 1 month" : `${i} ${i === 1 ? "month" : "months"}`,
}));

const NAP_OPTIONS = [
  { value: "3-4", label: "3–4 naps" },
  { value: "2-3", label: "2–3 naps" },
  { value: "1-2", label: "1–2 naps" },
];

const NIGHT_WAKING_OPTIONS = [
  { value: "none", label: "None / rare" },
  { value: "1-2", label: "1–2 per night" },
  { value: "3+", label: "3 or more" },
];

const GOAL_OPTIONS = [
  { value: "schedule", label: "More predictable schedule" },
  { value: "bedtime", label: "Earlier or consistent bedtime" },
  { value: "naps", label: "Better nap timing" },
  { value: "all", label: "All of the above" },
];

type SleepFormProps = {
  formRef?: React.Ref<HTMLDivElement>;
  data: SleepFormData;
  onChange: (data: SleepFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
};

export default function SleepForm({
  formRef,
  data,
  onChange,
  onSubmit,
  isSubmitting = false,
}: SleepFormProps) {
  const formStartedEmitted = useRef(false);
  const emitFormStarted = useCallback(() => {
    if (formStartedEmitted.current) return;
    formStartedEmitted.current = true;
    emitSleepEvent("sleep_form_started");
  }, []);

  const update = (key: keyof SleepFormData, value: string) => {
    emitFormStarted();
    onChange({ ...data, [key]: value });
  };

  return (
    <section
      className="section scroll-mt-[var(--header-height)]"
      id="sleep-form"
      onFocusCapture={emitFormStarted}
    >
      <div ref={formRef} className="container-narrow">
        <h2 className="heading-2 mb-[var(--space-md)] sm:mb-[var(--space-lg)]">Build Your Plan</h2>
        <form onSubmit={onSubmit} className="space-y-5 sm:space-y-6 max-w-lg">
          <div>
            <label htmlFor="baby-age" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Baby age
            </label>
            <select
              id="baby-age"
              value={data.babyAge}
              onChange={(e) => update("babyAge", e.target.value)}
              className="input-scoopy"
              required
            >
              <option value="">Select age</option>
              {AGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="wake-up" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Wake-up time <span className="text-[var(--text-muted)]">(optional)</span>
            </label>
            <input
              id="wake-up"
              type="time"
              value={data.wakeUpTime}
              onChange={(e) => update("wakeUpTime", e.target.value)}
              className="input-scoopy"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-[var(--text-primary)] mb-2">Number of naps <span className="text-[var(--text-muted)]">(optional)</span></span>
            <div className="flex flex-wrap gap-2 sm:gap-4">
              {NAP_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer min-h-[var(--tap-min)] min-w-[120px] py-1">
                  <input
                    type="radio"
                    name="naps"
                    value={opt.value}
                    checked={data.numNaps === opt.value}
                    onChange={(e) => update("numNaps", e.target.value)}
                    className="text-[var(--accent)] focus:ring-[var(--accent)] w-5 h-5 flex-shrink-0"
                  />
                  <span className="body">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-[var(--text-primary)] mb-2">Night wakings <span className="text-[var(--text-muted)]">(optional)</span></span>
            <div className="flex flex-wrap gap-2 sm:gap-4">
              {NIGHT_WAKING_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer min-h-[var(--tap-min)] min-w-[120px] py-1">
                  <input
                    type="radio"
                    name="nightWakings"
                    value={opt.value}
                    checked={data.nightWakings === opt.value}
                    onChange={(e) => update("nightWakings", e.target.value)}
                    className="text-[var(--accent)] focus:ring-[var(--accent)] w-5 h-5 flex-shrink-0"
                  />
                  <span className="body">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-[var(--text-primary)] mb-2">Parent goal <span className="text-[var(--text-muted)]">(optional)</span></span>
            <div className="flex flex-col gap-0">
              {GOAL_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer min-h-[var(--tap-min)] py-1">
                  <input
                    type="radio"
                    name="goal"
                    value={opt.value}
                    checked={data.parentGoal === opt.value}
                    onChange={(e) => update("parentGoal", e.target.value)}
                    className="text-[var(--accent)] focus:ring-[var(--accent)] w-5 h-5 flex-shrink-0"
                  />
                  <span className="body">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full sm:w-auto min-h-[var(--tap-min)]">
            {isSubmitting ? "Generating…" : "Generate My Preview"}
          </button>
        </form>
      </div>
    </section>
  );
}
