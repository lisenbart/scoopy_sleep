import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <>
      <section className="hero-scoopy">
        <div className="container-wide px-[var(--container-pad)]">
          <div className="hero-scoopy-inner">
            <div className="hero-text-wrap">
              <h1 className="heading-1 mb-[var(--space-md)]">A Calm Place for Your Baby&apos;s First Year</h1>
              <p className="hero-tagline mb-[var(--space-md)]">
                Track milestones, sleep, and daily rhythms in one simple place.
              </p>
              <p className="hero-description mb-[var(--space-xl)]">
                Start with a personalized sleep plan for your baby (0–24 months).
              </p>
              <div className="bubble-cta inline-block">
                <Link
                  href="/sleep"
                  className="btn-primary rounded-[999px] text-lg px-8"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  Build Sleep Plan
                </Link>
              </div>
            </div>
            <div className="hero-visual" aria-hidden>
              <Image
                src="/assets/ScoopyCap.webp"
                alt=""
                width={240}
                height={320}
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </section>
      <div className="section-divider" />
      <section className="section">
        <div className="container-narrow text-center">
          <p className="body text-[var(--text-muted)]">
            More tools coming soon. No generic charts. No guesswork.
          </p>
        </div>
      </section>
    </>
  );
}
