import Link from "next/link";

const navClass =
  "text-sm no-underline py-[11px] px-5 rounded-[var(--radius-sm)] min-h-[var(--tap-min)] inline-flex items-center transition-colors text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)]";

export default function NavLinksFallback() {
  return (
    <nav className="flex items-center gap-[6px]" aria-label="Navigation">
      <Link href="/" className={navClass}>
        Home
      </Link>
      <Link href="/sleep" className={navClass}>
        Sleep Plan
      </Link>
    </nav>
  );
}
