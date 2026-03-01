"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[RootError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[var(--bg-primary)]">
      <h1 className="font-display text-xl text-[var(--text-primary)] mb-2">
        Something went wrong
      </h1>
      <p className="text-[var(--text-secondary)] text-center mb-6 max-w-md">
        A client-side error occurred. Try refreshing or going back to the Sleep Plan.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          onClick={() => reset()}
          className="btn-primary rounded-[999px]"
        >
          Try again
        </button>
        <Link href="/sleep" className="btn-secondary rounded-[999px]">
          Sleep Plan
        </Link>
        <button
          type="button"
          onClick={() => typeof window !== "undefined" && window.location.reload()}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]"
        >
          Refresh page
        </button>
      </div>
    </div>
  );
}
