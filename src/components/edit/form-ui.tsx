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
    <div
      className="block space-y-1.5"
      style={
        changed
          ? { borderLeft: "3px solid #ef4444", paddingLeft: "0.75rem" }
          : undefined
      }
    >
      <div className="flex items-center gap-2">
        <span
          className={`font-mono text-[11px] tracking-[0.18em] uppercase ${
            changed ? "text-red-500" : "text-[var(--muted)]"
          }`}
        >
          {label}
        </span>
        {changed ? (
          <span
            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 font-mono text-[11px] font-bold leading-none text-white"
            title={changedLabel}
            aria-label={changedLabel}
          >
            !
          </span>
        ) : null}
      </div>
      {children}
      {hint ? <span className="block text-xs text-[var(--muted)]">{hint}</span> : null}
    </div>
  );
}

const controlClass =
  "w-full border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--fg)] outline-none transition-[border-color,box-shadow,color,opacity] placeholder:text-[var(--muted)] focus:border-[var(--accent)] read-only:cursor-not-allowed read-only:bg-[color-mix(in_oklab,var(--fg)_4%,var(--bg))] read-only:text-[var(--muted)] read-only:opacity-75";

const changedStyle = {
  borderColor: "#ef4444",
  boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.55)",
  backgroundColor: "rgba(239, 68, 68, 0.12)",
} as const;

export function TextInput({
  changed = false,
  className = "",
  style,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "changed"> & {
  changed?: boolean;
}) {
  return (
    <input
      {...props}
      data-dirty={changed ? "true" : undefined}
      style={changed ? { ...style, ...changedStyle } : style}
      className={`${controlClass} ${className}`}
    />
  );
}

export function TextArea({
  changed = false,
  className = "",
  style,
  ...props
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "changed"> & {
  changed?: boolean;
}) {
  return (
    <textarea
      {...props}
      data-dirty={changed ? "true" : undefined}
      style={changed ? { ...style, ...changedStyle } : style}
      className={`${controlClass} min-h-[88px] resize-y ${className}`}
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
