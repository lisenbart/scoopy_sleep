import Link from "next/link";

export const metadata = {
  title: "Terms — Scoopy Log",
  description: "Terms of use for Scoopy Log.",
};

export default function TermsPage() {
  return (
    <div className="container-narrow py-12">
      <h1 className="heading-1 mb-6">Terms</h1>
      <p className="body text-[var(--text-secondary)] mb-6">
        Terms of use will be published here. For questions, contact us via the Support link in the footer.
      </p>
      <Link href="/sleep" className="text-[var(--accent)] hover:underline">
        Back to Sleep Plan
      </Link>
    </div>
  );
}
