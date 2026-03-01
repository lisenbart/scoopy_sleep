"use client";

import Image from "next/image";

export default function SleepHero({ onCtaClick }: { onCtaClick: () => void }) {
  return (
    <section className="hero-scoopy">
      <div className="container-wide px-[var(--container-pad)]">
        <div className="hero-scoopy-inner">
          <div className="hero-text-wrap">
            <h1 className="heading-1 mb-[var(--space-md)]">
              A clear, personalized sleep plan for your baby (0–24 months).
            </h1>
            <div className="bubble-cta inline-block mt-[var(--space-md)] w-full sm:w-auto">
              <button
                type="button"
                onClick={onCtaClick}
                className="btn-primary text-base sm:text-lg px-6 py-4 rounded-[999px] w-full sm:w-auto min-h-[var(--tap-min)]"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                Generate Preview
              </button>
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
  );
}
