"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import FullPlanBlock from "@/components/sleep/FullPlanBlock";
import { normalizePlan } from "@/lib/normalize-plan";
import type { SleepFullPlan } from "@/types/sleep";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60;

function ClaimContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "processing" | "ready" | "failed" | "expired">("loading");
  const [plan, setPlan] = useState<SleepFullPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    if (!token) {
      setStatus("failed");
      setError("Missing link");
      return;
    }
    try {
      const res = await fetch(`/api/sleep/plan?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (data.status === "ready" && data.plan) {
        setPlan(normalizePlan(data.plan as SleepFullPlan));
        setStatus("ready");
        return;
      }
      if (data.status === "failed" || res.status === 502) {
        setStatus("failed");
        setError("Something went wrong generating your plan.");
        return;
      }
      if (data.status === "expired" || res.status === 410) {
        setStatus("expired");
        return;
      }
      setStatus("processing");
    } catch {
      setStatus("processing");
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setStatus("failed");
      setError("Missing link");
      return;
    }
    fetchPlan();
  }, [token, fetchPlan]);

  useEffect(() => {
    if (status !== "processing") return;
    const t = setInterval(fetchPlan, POLL_INTERVAL_MS);
    let attempts = 0;
    const stop = setInterval(() => {
      attempts++;
      if (attempts >= MAX_POLL_ATTEMPTS) {
        clearInterval(t);
        setStatus("failed");
        setError("Taking longer than usual. Check your email for the plan.");
      }
    }, POLL_INTERVAL_MS);
    return () => {
      clearInterval(t);
      clearInterval(stop);
    };
  }, [status, fetchPlan]);

  if (!token) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <p className="body text-[var(--text-secondary)]">Invalid or missing link.</p>
        <Link href="/sleep" className="btn-primary rounded-[999px]">
          Create a sleep plan
        </Link>
      </div>
    );
  }

  if (status === "loading" || status === "processing") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
        <p className="body text-[var(--text-secondary)]">
          {status === "loading" ? "Loading your plan…" : "Generating your plan…"}
        </p>
        <div className="flex gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse [animation-delay:0.2s]" />
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse [animation-delay:0.4s]" />
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <p className="body text-[var(--text-secondary)]">This link has expired.</p>
        <Link href="/sleep" className="btn-primary rounded-[999px]">
          Create a new plan
        </Link>
      </div>
    );
  }

  if (status === "failed" || !plan) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <p className="body text-[var(--text-secondary)]">{error ?? "Something went wrong."}</p>
        <Link href="/sleep" className="btn-primary rounded-[999px]">
          Try again
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <FullPlanBlock plan={plan} />
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-[var(--text-muted)]">
          Loading…
        </div>
      }
    >
      <ClaimContent />
    </Suspense>
  );
}
