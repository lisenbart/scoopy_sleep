"use client";

import Link from "next/link";

export default function SleepFooter() {
  return (
    <footer className="border-t border-[var(--border)] py-[var(--space-lg)] sm:py-[var(--space-xl)] bg-[var(--bg-secondary)]">
      <div className="container-wide flex flex-col sm:flex-row flex-wrap justify-between items-stretch sm:items-center gap-[var(--space-md)] sm:gap-[var(--space-lg)]">
        <div className="flex flex-col gap-[var(--space-xs)]">
          <span className="font-display font-normal text-[1.1rem] text-[var(--text-primary)]">Scoopy Log</span>
          <span className="text-[0.9rem] text-[var(--text-secondary)]">
            © {new Date().getFullYear()}. Informational only — not medical advice.
          </span>
        </div>
        <nav className="flex flex-wrap gap-2 sm:gap-6 text-sm">
          <Link href="/privacy" className="text-[var(--text-secondary)] hover:text-[var(--accent)] min-h-[var(--tap-min)] inline-flex items-center py-2">
            Privacy
          </Link>
          <Link href="/terms" className="text-[var(--text-secondary)] hover:text-[var(--accent)] min-h-[var(--tap-min)] inline-flex items-center py-2">
            Terms
          </Link>
          <a href="mailto:support@scoopylog.com" className="text-[var(--text-secondary)] hover:text-[var(--accent)] min-h-[var(--tap-min)] inline-flex items-center py-2">
            Support
          </a>
        </nav>
      </div>
    </footer>
  );
}
