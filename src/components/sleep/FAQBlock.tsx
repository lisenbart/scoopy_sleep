"use client";

export default function FAQBlock() {
  return (
    <section className="section section-alt" id="faq">
      <div className="container-narrow space-y-5 sm:space-y-8">
        <h2 className="heading-2">FAQ</h2>

        <div className="space-y-5 sm:space-y-6">
          <div>
            <h3 className="font-display text-lg text-[var(--text-primary)] mb-2">Is this medical advice?</h3>
            <p className="body text-[var(--text-secondary)]">
              No. This tool is for informational purposes only. It is not medical advice. Consult your pediatrician or healthcare provider for advice specific to your baby.
            </p>
          </div>

          <div>
            <h3 className="font-display text-lg text-[var(--text-primary)] mb-2">How does it work?</h3>
            <p className="body text-[var(--text-secondary)]">
              You answer a few questions about your baby’s age and routine. We generate a personalized preview, then you can unlock the full 7-day plan for a one-time fee. You get the plan by email and can view it anytime via the link we send.
            </p>
          </div>

          <div>
            <h3 className="font-display text-lg text-[var(--text-primary)] mb-2">Refunds and support</h3>
            <p className="body text-[var(--text-secondary)]">
              If something goes wrong or you’re not satisfied, contact us and we’ll help. Refund requests are handled case by case.
            </p>
          </div>

          <div>
            <h3 className="font-display text-lg text-[var(--text-primary)] mb-2">How we use your data</h3>
            <p className="body text-[var(--text-secondary)]">
              We use your inputs to generate your plan (via our AI provider). Payment is processed by Stripe. If you unlock the plan, we send it to your email (via our email provider). We don’t sell your data. See our Privacy and Terms for full details.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
