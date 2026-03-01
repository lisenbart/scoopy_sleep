export default function ValueBlock() {
  const items = [
    { title: "Wake windows", desc: "Age-appropriate wake windows" },
    { title: "Nap timing", desc: "Structured nap timing" },
    { title: "Bedtime", desc: "Optimized bedtime suggestion" },
    { title: "7-day plan", desc: "A gentle 7-day adjustment roadmap" },
    { title: "Printable PDF", desc: "Follow daily at home" },
  ];

  return (
    <section className="section section-alt">
      <div className="container-narrow">
        <h2 className="heading-2 mb-[var(--space-md)] sm:mb-[var(--space-lg)]">What You&apos;ll Get</h2>
        <div className="benefits-grid">
          {items.map((item, i) => (
            <div key={i} className="benefit-card card-scoopy-accent">
              <div className="benefit-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className="text-[var(--accent)]">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="benefit-content">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
