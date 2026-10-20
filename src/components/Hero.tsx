"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Atmosphere } from "@/components/Atmosphere";
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
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.75, ease, delay },
        };

  return (
    <header className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden px-5 pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-20 sm:min-h-[calc(100svh-4rem)] sm:px-10 sm:pb-20 sm:pt-16 lg:px-16">
      <Atmosphere orb="left" />

      {/* Soft full-bleed wash — stronger on phone so first glance feels cinematic */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,var(--hero-glow-a),transparent_70%)] sm:hidden"
      />

      <div className="relative mx-auto w-full max-w-5xl">
        <motion.p className="label-caps mb-3 sm:mb-4" {...fade(0.04)}>
          {data.location}
        </motion.p>

        <motion.h1
          className="font-display text-[clamp(2.85rem,12.5vw,6.5rem)] leading-[0.9] font-bold tracking-tight text-[var(--fg)]"
          {...fade(0.1)}
        >
          {data.name}
        </motion.h1>

        <motion.p
          className="mt-5 font-display text-xl font-semibold tracking-tight text-[var(--accent)] sm:mt-6 sm:text-2xl"
          {...fade(0.18)}
        >
          {data.headline}
        </motion.p>

        <motion.p
          className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-[var(--muted)] sm:mt-5 sm:text-lg sm:leading-relaxed"
          {...fade(0.26)}
        >
          {data.summary}
        </motion.p>

        {/* Desktop / tablet CTAs — phone uses MobileDock */}
        <motion.div
          className="mt-10 hidden flex-wrap items-center gap-4 sm:flex"
          {...fade(0.34)}
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

      <motion.div
        className="absolute bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 sm:bottom-8"
        aria-hidden
        {...(reduce
          ? {}
          : {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              transition: { delay: 0.9, duration: 0.6 },
            })}
      >
        <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase">
          {t.hero.scroll}
        </span>
        <span className="scroll-hint block h-7 w-px bg-[var(--accent)]" />
      </motion.div>
    </header>
  );
}
