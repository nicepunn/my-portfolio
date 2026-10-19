import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function Field({
  label,
  children,
  hint,
  changed = false,
  changedLabel = "Changed",
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  changed?: boolean;
  changedLabel?: string;
}) {
  // Use a div (not <label>) so Enter in textareas is not treated as label activation.
  return (
    <div className="block space-y-1.5">
      <div className="flex items-center gap-2">
        <span
          className={`font-mono text-[11px] tracking-[0.18em] uppercase ${
            changed ? "text-red-400" : "text-[var(--muted)]"
          }`}
        >
          {label}
        </span>
        {changed ? (
          <span
            className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500/20 px-1 font-mono text-[10px] font-bold text-red-400"
            title={changedLabel}
            aria-label={changedLabel}
          >
            !
          </span>
        ) : null}
      </div>
      <div
        className={
          changed
            ? "[&_input]:border-red-400/80 [&_input]:ring-1 [&_input]:ring-red-400/35 [&_textarea]:border-red-400/80 [&_textarea]:ring-1 [&_textarea]:ring-red-400/35"
            : undefined
        }
      >
        {children}
      </div>
      {hint ? <span className="block text-xs text-[var(--muted)]">{hint}</span> : null}
    </div>
  );
}

const controlClass =
  "w-full border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)] read-only:cursor-not-allowed read-only:border-[var(--border)] read-only:bg-[color-mix(in_oklab,var(--fg)_4%,var(--bg))] read-only:text-[var(--muted)] read-only:opacity-75";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${controlClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${controlClass} min-h-[88px] resize-y ${props.className ?? ""}`}
    />
  );
}

export function SectionCard({
  id,
  title,
  actions,
  children,
}: {
  id?: string;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 space-y-4 border border-[var(--border)] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-[var(--fg)]">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function GhostButton({
  children,
  onClick,
  type = "button",
  danger = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  danger?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`border px-3 py-1.5 text-xs font-medium tracking-wide transition-colors ${
        danger
          ? "border-red-400/30 text-red-300 hover:border-red-300 hover:text-red-200"
          : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
      }`}
    >
      {children}
    </button>
  );
}
