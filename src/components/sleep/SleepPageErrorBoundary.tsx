"use client";

import React from "react";
import Link from "next/link";

type State = { hasError: boolean };

export default class SleepPageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[SleepPageErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-12">
          <p className="body text-[var(--text-primary)] text-center mb-4">
            Something went wrong loading this page.
          </p>
          <p className="text-sm text-[var(--text-muted)] text-center mb-6">
            Try refreshing, or return to the start and try again.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => typeof window !== "undefined" && window.location.reload()}
              className="btn-primary rounded-[999px]"
            >
              Refresh page
            </button>
            <Link href="/sleep" className="btn-secondary rounded-[999px]">
              Back to Sleep Plan
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
