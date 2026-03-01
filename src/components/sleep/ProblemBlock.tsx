export default function ProblemBlock() {
  const bullets = [
    "Bedtime keeps shifting later",
    "Naps end too early or start too late",
    "You're not sure if wake windows are too short — or too long",
  ];

  return (
    <section className="section section-alt">
      <div className="container-narrow">
        <h2 className="heading-2 mb-[var(--space-lg)]">When sleep feels unpredictable</h2>
        <div className="feature-card-scoopy">
          <ul className="space-y-3 list-disc list-inside body text-[var(--text-primary)] mb-4">
            {bullets.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
          <p className="body text-[var(--text-muted)]">
            Small timing adjustments can make a big difference.
          </p>
        </div>
      </div>
    </section>
  );
}
