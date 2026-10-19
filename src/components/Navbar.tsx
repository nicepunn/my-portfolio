"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const homeSectionLinks = [
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "about", label: "About" },
] as const;

function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-6 sm:h-16 sm:px-10 lg:px-0">
        <Link
          href="/"
          className="font-display shrink-0 text-sm font-semibold tracking-[0.2em] text-[var(--muted)] uppercase transition-colors hover:text-[var(--fg)]"
          onClick={(event) => {
            if (!isHome) return;
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
            history.replaceState(null, "", "/");
          }}
        >
          Resume
        </Link>

        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          {isHome ? (
            <div className="hidden items-center gap-5 md:flex">
              {homeSectionLinks.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
                  onClick={(event) => {
                    event.preventDefault();
                    smoothScrollTo(link.id);
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}

          <a
            href="/api/resume/pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
          >
            PDF
          </a>

          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
