export default function SolutionBlock() {
  const steps = [
    "Enter your baby's age and wake-up time",
    "Get an instant personalized preview",
    "Unlock your full 7-day adaptive plan",
  ];

  return (
    <section className="section">
      <div className="container-narrow">
        <h2 className="heading-2 mb-[var(--space-lg)]">A Plan Built Around Your Baby&apos;s Age</h2>
        <div className="feature-card-scoopy">
          <ol className="body list-decimal pl-6 space-y-3 text-[var(--text-secondary)]">
            {steps.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ol>
          <p className="muted mt-6">Based on commonly recommended pediatric sleep ranges.</p>
          <p className="muted mt-1">Clear. Practical. Structured.</p>
        </div>
      </div>
    </section>
  );
}
