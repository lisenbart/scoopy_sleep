import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";
import { Suspense } from "react";
import NavLinks from "@/components/NavLinks";
import NavLinksFallback from "@/components/NavLinksFallback";

const sfCompactRounded = localFont({
  src: "./font/SF-Compact-Rounded-Regular.otf",
  variable: "--font-sf-compact-rounded",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Scoopy Log",
  description: "A clear, personalized sleep plan for your baby (0–24 months).",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={sfCompactRounded.variable}>
      <body className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
        <header
          className="sticky top-0 z-[100] h-[var(--header-height)] border-b border-[var(--border-light)]"
          style={{
            background: "var(--header-bg)",
            backdropFilter: "saturate(180%) blur(20px)",
            WebkitBackdropFilter: "saturate(180%) blur(20px)",
          }}
        >
          <div className="container-wide h-full flex items-center justify-between">
            <Link
              href="/"
              className="font-display text-[1.15rem] font-normal text-[var(--text-primary)] no-underline min-h-[var(--tap-min)] inline-flex items-center whitespace-nowrap hover:text-[var(--accent)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 rounded-[var(--radius-sm)]"
            >
              Scoopy Log
            </Link>
            <Suspense fallback={<NavLinksFallback />}>
              <NavLinks />
            </Suspense>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[var(--border)] py-[var(--space-lg)] sm:py-[var(--space-xl)] mt-auto bg-[var(--bg-secondary)]">
          <div className="container-wide flex flex-wrap justify-between items-center gap-[var(--space-lg)]">
            <div className="flex flex-col gap-[var(--space-xs)]">
              <span className="font-display font-normal text-[1.1rem] text-[var(--text-primary)]">Scoopy Log</span>
              <span className="text-[0.9rem] text-[var(--text-secondary)]">
                © {new Date().getFullYear()} Scoopy Log. No generic charts. No guesswork.
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
