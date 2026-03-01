"use client";

const QUOTES = [
  { text: "Finally had a clear schedule to follow.", tag: "Parent of 8-month-old" },
  { text: "Simple and practical — no overwhelm.", tag: "First-time parent" },
  { text: "Worth it for the day-by-day plan.", tag: "Parent" },
];

export default function SocialProofBlock() {
  return (
    <section className="section" id="social-proof">
      <div className="container-narrow">
        <h2 className="heading-2 mb-4 sm:mb-6 text-center">What parents say</h2>
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
          {QUOTES.map((q, i) => (
            <blockquote key={i} className="card-scoopy p-4 sm:p-6">
              <p className="body text-[var(--text-primary)] mb-3">&ldquo;{q.text}&rdquo;</p>
              <cite className="text-sm text-[var(--text-muted)] not-italic">{q.tag}</cite>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
