"use client";

import { useRef, useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SleepHero from "@/components/sleep/SleepHero";
import MiniTrustLine from "@/components/sleep/MiniTrustLine";
import SleepForm, { type SleepFormData } from "@/components/sleep/SleepForm";
import PreviewSkeleton from "@/components/sleep/PreviewSkeleton";
import PreviewBlock from "@/components/sleep/PreviewBlock";
import ValueBlock from "@/components/sleep/ValueBlock";
import SocialProofBlock from "@/components/sleep/SocialProofBlock";
import FAQBlock from "@/components/sleep/FAQBlock";
import SleepFooter from "@/components/sleep/SleepFooter";
import FullPlanBlock from "@/components/sleep/FullPlanBlock";
import { emitSleepEvent } from "@/lib/analytics";
import type { SleepPreview, SleepFullPlan } from "@/types/sleep";

const DEFAULT_FORM: SleepFormData = {
  babyAge: "",
  wakeUpTime: "07:00",
  numNaps: "",
  nightWakings: "",
  parentGoal: "",
  email: "",
};

const POLL_INTERVAL_MS = 2000;
const STORAGE_KEY_PREVIEW = "sleep_preview";
const STORAGE_KEY_FORM = "sleep_form";

function SleepPageContent() {
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<SleepFormData>(DEFAULT_FORM);
  const [preview, setPreview] = useState<SleepPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawPreview = sessionStorage.getItem(STORAGE_KEY_PREVIEW);
      const rawForm = sessionStorage.getItem(STORAGE_KEY_FORM);
      if (rawPreview) {
        const parsed = JSON.parse(rawPreview) as SleepPreview;
        if (parsed && typeof parsed.wakeWindow === "string") {
          setPreview(parsed);
          setShowPreview(true);
        }
      }
      if (rawForm) {
        const parsed = JSON.parse(rawForm) as SleepFormData;
        if (parsed && typeof parsed.babyAge === "string") setFormData(parsed);
      }
    } catch {}
  }, []);
  const [isUnlockLoading, setIsUnlockLoading] = useState(false);
  const [fullPlan, setFullPlan] = useState<SleepFullPlan | null>(null);
  const [fulfillError, setFulfillError] = useState<string | null>(null);
  const canceled = searchParams.get("canceled") === "1";

  const scrollToForm = useCallback(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.babyAge.trim()) return;
      setIsSubmitting(true);
      setFulfillError(null);
      try {
        const res = await fetch("/api/sleep/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            babyAge: formData.babyAge,
            wakeUpTime: formData.wakeUpTime,
            numNaps: formData.numNaps,
            nightWakings: formData.nightWakings,
            parentGoal: formData.parentGoal,
          }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
          const msg = err.detail ? `${err.error ?? "Failed"}: ${err.detail}` : err.error ?? "Failed to generate preview";
          throw new Error(msg);
        }
        const data = (await res.json()) as SleepPreview;
        setPreview(data);
        setShowPreview(true);
        try {
          sessionStorage.setItem(STORAGE_KEY_PREVIEW, JSON.stringify(data));
          sessionStorage.setItem(STORAGE_KEY_FORM, JSON.stringify(formData));
        } catch {}
        emitSleepEvent("sleep_preview_generated");
        document.getElementById("preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (err) {
        setFulfillError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData]
  );

  const handleUnlock = useCallback(async () => {
    const email = formData.email.trim();
    if (!email) return;
    setIsUnlockLoading(true);
    setFulfillError(null);
    emitSleepEvent("sleep_checkout_opened");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          formData: {
            babyAge: formData.babyAge,
            wakeUpTime: formData.wakeUpTime,
            numNaps: formData.numNaps,
            nightWakings: formData.nightWakings,
            parentGoal: formData.parentGoal,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      if (data.url) window.location.href = data.url;
      else throw new Error("No checkout URL");
    } catch (err) {
      setFulfillError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setIsUnlockLoading(false);
    }
  }, [formData]);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId || fullPlan) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/sleep/plan?session_id=${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.status === "ready" && data.plan) {
          setFullPlan(data.plan);
          emitSleepEvent("sleep_purchase_success");
          document.getElementById("full-plan")?.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        if (data.status === "failed" || res.status === 502) {
          setFulfillError("Plan generation failed. Check your email or contact support.");
          return;
        }
        if (data.status === "expired" || res.status === 410) {
          setFulfillError("This link has expired.");
          return;
        }
        setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (cancelled) return;
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId, fullPlan]);

  return (
    <div>
      <SleepHero onCtaClick={scrollToForm} />
      <MiniTrustLine />
      <div className="section-divider" />
      <SleepForm
        formRef={formRef}
        data={formData}
        onChange={setFormData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {canceled && (
        <div className="container-narrow py-3 px-4 mb-2 rounded-[var(--radius-sm)] bg-[var(--accent-subtle)] border border-[var(--accent)]/30" role="status">
          <p className="text-sm text-[var(--text-primary)]">
            Checkout canceled. You can try again when you’re ready.
          </p>
        </div>
      )}

      {fulfillError && !showPreview && (
        <div className="container-narrow py-4">
          <p className="body text-[#EF4444]" role="alert">
            {fulfillError}
          </p>
        </div>
      )}

      {isSubmitting && <PreviewSkeleton />}

      {showPreview && preview && !isSubmitting && (
        <PreviewBlock
          preview={preview}
          email={formData.email}
          onEmailChange={(email) => setFormData((prev) => ({ ...prev, email }))}
          onUnlock={handleUnlock}
          isUnlockLoading={isUnlockLoading}
          unlockError={fulfillError}
        />
      )}

      {fullPlan && <FullPlanBlock plan={fullPlan} />}

      <div className="section-divider" />
      <ValueBlock />
      <SocialProofBlock />
      <FAQBlock />
      <SleepFooter />
    </div>
  );
}

export default function SleepPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-[var(--text-muted)]">
          Loading…
        </div>
      }
    >
      <SleepPageContent />
    </Suspense>
  );
}
