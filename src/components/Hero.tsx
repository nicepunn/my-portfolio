"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Resume } from "@/lib/resume-schema";
import { useTranslations } from "@/i18n/LocaleProvider";

export function Hero({ data }: { data: Resume }) {
  const t = useTranslations();
  const reduce = useReducedMotion();
  const ease = [0.22, 1, 0.36, 1] as const;

  const fade = (delay: number) =>
    reduce
      ? undefined
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease, delay },
        };

  return (
    <header className="relative flex min-h-[calc(100svh-4rem)] flex-col justify-end overflow-hidden px-6 pb-16 pt-16 sm:px-10 sm:pb-20 lg:px-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="hero-backdrop absolute inset-0" />
        <div className="grain absolute inset-0" />
        <div className="hero-orb absolute -left-1/4 top-1/3 h-[50vmax] w-[50vmax] rounded-full blur-2xl" />
      </div>

      <div className="mx-auto w-full max-w-5xl">
        <motion.p className="label-caps mb-4" {...fade(0.05)}>
          {data.location}
        </motion.p>

        <motion.h1
          className="font-display text-[clamp(2.75rem,10vw,6.5rem)] leading-[0.92] font-bold tracking-tight text-[var(--fg)]"
          {...fade(0.12)}
        >
          {data.name}
        </motion.h1>

        <motion.p
          className="mt-6 max-w-xl text-lg text-[var(--muted)] sm:text-xl"
          {...fade(0.22)}
        >
          <span className="text-[var(--fg)]">{data.headline}.</span>{" "}
          {data.summary}
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap items-center gap-4"
          {...fade(0.32)}
        >
          <a
            href={`mailto:${data.email}`}
            className="inline-flex h-12 items-center justify-center bg-[var(--accent)] px-6 text-sm font-semibold tracking-wide text-[var(--bg)] transition-[transform,background-color] hover:bg-[var(--accent-bright)] active:scale-[0.98]"
          >
            {t.hero.emailMe}
          </a>
          <a
            href={data.github.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center border border-[var(--border)] px-6 text-sm font-medium text-[var(--fg)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {t.hero.github} · {data.github.label}
          </a>
        </motion.div>
      </div>

    </header>
  );
}
