"use client";

import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Dark mode on" : "Light mode on"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className="relative inline-flex h-7 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[color-mix(in_oklab,var(--fg)_8%,transparent)] transition-colors hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute top-1/2 left-0.5 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--fg)_42%,transparent)] text-[var(--bg)] transition-transform duration-200 ease-out ${
          isDark ? "translate-x-0" : "translate-x-5"
        }`}
      >
        {isDark ? (
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
            <path d="M20.5 14.2A7.8 7.8 0 0 1 9.8 3.5 7.9 7.9 0 1 0 20.5 14.2Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
            <circle cx="12" cy="12" r="3.5" />
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M5.2 18.8l1.4-1.4M17.4 6.6l1.4-1.4"
            />
          </svg>
        )}
      </span>
      <span className="sr-only">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}
