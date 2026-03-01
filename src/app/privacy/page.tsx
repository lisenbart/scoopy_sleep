import Link from "next/link";

export const metadata = {
  title: "Privacy — Scoopy Log",
  description: "Privacy policy for Scoopy Log.",
};

export default function PrivacyPage() {
  return (
    <div className="container-narrow py-12">
      <h1 className="heading-1 mb-6">Privacy</h1>
      <p className="body text-[var(--text-secondary)] mb-6">
        We respect your privacy. This page will be updated with our full privacy policy. For questions, contact us via the Support link in the footer.
      </p>
      <Link href="/sleep" className="text-[var(--accent)] hover:underline">
        Back to Sleep Plan
      </Link>
    </div>
  );
}
