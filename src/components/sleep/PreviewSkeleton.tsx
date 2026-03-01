"use client";

export default function PreviewSkeleton() {
  return (
    <section className="section section-alt" id="preview" aria-busy="true">
      <div className="container-narrow space-y-5 sm:space-y-8">
        <h2 className="heading-2">Your Preview</h2>
        <div className="card-scoopy p-4 sm:p-6 space-y-4">
          <div className="animate-pulse">
            <div className="h-4 w-24 bg-[var(--border)] rounded mb-2" />
            <div className="h-6 w-32 bg-[var(--border)] rounded" />
          </div>
          <div className="animate-pulse">
            <div className="h-4 w-28 bg-[var(--border)] rounded mb-2" />
            <div className="h-6 w-24 bg-[var(--border)] rounded" />
          </div>
          <div className="animate-pulse">
            <div className="h-4 w-36 bg-[var(--border)] rounded mb-2" />
            <div className="h-6 w-28 bg-[var(--border)] rounded" />
          </div>
          <div className="animate-pulse">
            <div className="h-4 w-20 bg-[var(--border)] rounded mb-2" />
            <div className="h-16 w-full bg-[var(--border)] rounded" />
          </div>
        </div>
        <p className="text-sm text-[var(--text-muted)]">Generating…</p>
      </div>
    </section>
  );
}
