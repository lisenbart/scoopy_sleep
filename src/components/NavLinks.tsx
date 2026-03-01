"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navClass =
  "text-sm no-underline py-[11px] px-5 rounded-[var(--radius-sm)] min-h-[var(--tap-min)] inline-flex items-center transition-colors";
const activeClass = "font-medium text-[var(--accent)]";
const inactiveClass = "text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)]";

export default function NavLinks() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const safePath = mounted ? pathname : "";
  return (
    <nav className="flex items-center gap-[6px]" aria-label="Navigation">
      <Link
        href="/"
        className={`${navClass} ${safePath === "/" ? activeClass : inactiveClass}`}
      >
        Home
      </Link>
      <Link
        href="/sleep"
        className={`${navClass} ${safePath === "/sleep" ? activeClass : inactiveClass}`}
      >
        Sleep Plan
      </Link>
    </nav>
  );
}
