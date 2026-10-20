"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useTranslations } from "@/i18n/LocaleProvider";
import { UI_SKINS, UI_SKIN_SWATCHES } from "@/lib/theme";

export function AppearanceSettings() {
  const { ui, setUi, ready } = useTheme();
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
          return (
            <button
              key={id}
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
