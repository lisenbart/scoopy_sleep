"use client";

import type { SleepFullPlan } from "@/types/sleep";
import { generateSleepPlanPdf } from "@/lib/sleep-pdf";
import { emitSleepEvent } from "@/lib/analytics";

const DISCLAIMER =
  "This plan is for informational purposes only and is not medical advice. Consult your pediatrician or healthcare provider for advice specific to your baby. Sleep needs vary; use this as a general guide and adjust to what works for your family.";

type FullPlanBlockProps = {
  plan: SleepFullPlan;
};

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="heading-3 mb-3">{title}</h3>
      <div className="body text-[var(--text-secondary)] leading-relaxed">{children}</div>
    </div>
  );
}

function Paragraphs({ text }: { text: string }) {
  const s = typeof text === "string" ? text : "";
  const parts = s.split(/\n\n+/).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => (
        <p key={i} className="mb-3 last:mb-0 whitespace-pre-line">
          {p}
        </p>
      ))}
    </>
  );
}

function Bullets({ text }: { text: string }) {
  const s = typeof text === "string" ? text : "";
  const lines = s.split("\n").filter((line) => line.trim());
  return (
    <ul className="list-checkmarks space-y-2">
      {lines.map((line, i) => (
        <li key={i} className="whitespace-pre-line">
          {line.replace(/^[\s•\-*]+\s*/, "").trim()}
        </li>
      ))}
    </ul>
  );
}

export default function FullPlanBlock({ plan }: FullPlanBlockProps) {
  const handleDownloadPdf = () => {
    generateSleepPlanPdf(plan);
    emitSleepEvent("sleep_pdf_downloaded");
  };

  const handleScoopyClick = () => {
    emitSleepEvent("sleep_scoopy_click");
    const appUrl = typeof window !== "undefined" ? `${window.location.origin}/download` : "/download";
    window.open(appUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="section bg-[var(--bg-primary)]" id="full-plan">
      <div className="container-narrow space-y-6 sm:space-y-10">
        <h2 className="heading-2">Your 7-Day Sleep Plan</h2>

        {plan.summary && (
          <Section title="Summary">
            <Paragraphs text={plan.summary} />
          </Section>
        )}

        <Section title="Detailed Day Schedule">
          <div className="space-y-4 sm:space-y-6">
            {Array.isArray(plan.days) && plan.days.map((d) => (
              <div key={d.day} className="card-scoopy card-scoopy-accent p-4 sm:p-6">
                <h4 className="font-display text-lg text-[var(--text-primary)] mb-3">Day {d.day}</h4>
                <dl className="grid gap-2 body text-[var(--text-primary)]">
                  <div>
                    <dt className="text-sm font-medium text-[var(--text-muted)]">Wake time</dt>
                    <dd>{d.wakeTime}</dd>
                  </div>
                  {Array.isArray(d.naps) && d.naps.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-[var(--text-muted)]">Naps</dt>
                      <dd>
                        <ul className="list-checkmarks mt-1 space-y-1">
                          {d.naps.map((nap: { start?: string; end?: string; duration?: string }, i: number) => (
                            <li key={i}>
                              {nap.start} – {nap.end}
                              {nap.duration ? ` (${nap.duration})` : ""}
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-[var(--text-muted)]">Bedtime</dt>
                    <dd>{d.bedtime}</dd>
                  </div>
                  {d.notes && (
                    <div>
                      <dt className="text-sm font-medium text-[var(--text-muted)]">Tip</dt>
                      <dd className="text-[var(--text-secondary)]">{d.notes}</dd>
                    </div>
                  )}
                </dl>
              </div>
            ))}
          </div>
        </Section>

        {plan.adjustmentPlan && (
          <Section title="7-Day Adjustment Plan">
            <Paragraphs text={plan.adjustmentPlan} />
          </Section>
        )}

        {plan.troubleshooting && (
          <Section title="Troubleshooting">
            <Bullets text={plan.troubleshooting} />
          </Section>
        )}

        {plan.optimizationTips && (
          <Section title="Optimization Tips">
            <Bullets text={plan.optimizationTips} />
          </Section>
        )}

        <div className="card-scoopy p-4 sm:p-6">
          <h3 className="heading-3 mb-2">Disclaimer</h3>
          <p className="body text-[var(--text-muted)] text-sm leading-relaxed">{DISCLAIMER}</p>
        </div>

        <div className="flex flex-wrap gap-4 pt-4">
          <button type="button" onClick={handleDownloadPdf} className="btn-primary rounded-[999px] w-full sm:w-auto min-h-[var(--tap-min)]">
            Download Printable PDF
          </button>
        </div>

        <div className="card-scoopy p-4 sm:p-6 border-2 border-[var(--accent)]/20 bg-[var(--accent-subtle)]">
          <h3 className="heading-3 mb-2">Want to track this schedule automatically?</h3>
          <p className="body text-[var(--text-primary)] mb-4">
            Adjust daily, track naps, and refine your routine inside Scoopy Log.
          </p>
          <button
            type="button"
            onClick={handleScoopyClick}
            className="btn-secondary"
            aria-label="Download Scoopy Log app"
          >
            Download Scoopy Log
          </button>
        </div>
      </div>
    </section>
  );
}
