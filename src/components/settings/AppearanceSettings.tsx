"use client";

import { cloneElement } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useTranslations } from "@/i18n/LocaleProvider";
import { GLASS_MAX, GLASS_MIN, UI_SKINS, UI_SKIN_SWATCHES } from "@/lib/theme";

export function AppearanceSettings() {
  const { ui, setUi, glass, setGlass, ready } = useTheme();
  const t = useTranslations();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-[var(--fg)]">
          {t.settings.appearance.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {t.settings.appearance.description}
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label={t.settings.appearance.title}
        className="choice-list divide-y divide-[var(--border)] border-y border-[var(--border)]"
      >
        {UI_SKINS.map((id) => {
          // Avoid a false "Editorial" checked flash before localStorage sync.
          const active = ready && id === ui;
          const copy = t.settings.appearance.skins[id];
          const [bg, accent, fg] = UI_SKIN_SWATCHES[id];
          const option = (
            <button
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setUi(id)}
              className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-[var(--accent)]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <SkinSwatch colors={[bg, accent, fg]} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[var(--fg)]">
                    {copy.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--muted)]">
                    {copy.description}
                  </span>
                </span>
              </span>
              <span
                aria-hidden
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent)]"
                    : "border-[var(--border)]"
                }`}
              >
                {active ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--bg)]" />
                ) : null}
              </span>
            </button>
          );

          if (id !== "glass" || !active) return cloneElement(option, { key: id });

          const fill = ((glass - GLASS_MIN) / (GLASS_MAX - GLASS_MIN)) * 100;

          return (
            <div
              key={id}
              className={active ? "glass-choice-open" : "contents"}
            >
              {option}
              {active ? (
                <div className="glass-transparency">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="glass-transparency-swatch" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <label
                          htmlFor="glass-transparency"
                          className="text-xs font-medium text-[var(--fg)]"
                        >
                          {t.settings.appearance.transparency}
                        </label>
                        <span
                          className="glass-transparency-value font-mono text-xs"
                          aria-hidden
                        >
                          {glass}
                        </span>
                      </span>
                      <input
                        id="glass-transparency"
                        type="range"
                        className="glass-range mt-2 w-full"
                        min={GLASS_MIN}
                        max={GLASS_MAX}
                        value={glass}
                        aria-valuemin={GLASS_MIN}
                        aria-valuemax={GLASS_MAX}
                        aria-valuenow={glass}
                        aria-describedby="glass-transparency-hint"
                        style={{ ["--glass-fill" as string]: `${fill}%` }}
                        onChange={(event) =>
                          setGlass(Number(event.target.value))
                        }
                      />
                      <p
                        id="glass-transparency-hint"
                        className="mt-1.5 text-xs leading-snug text-[var(--muted)]"
                      >
                        {t.settings.appearance.transparencyHint}
                      </p>
                    </div>
                  </div>
                  <span className="glass-transparency-radio" aria-hidden />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SkinSwatch({ colors }: { colors: readonly [string, string, string] }) {
  return (
    <span aria-hidden className="flex shrink-0 items-center gap-1">
      {colors.map((color) => (
        <span
          key={color}
          className="skin-dot h-3.5 w-3.5 rounded-full border border-[var(--border)]"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  );
}
