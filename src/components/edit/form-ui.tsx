import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  // Use a div (not <label>) so Enter in textareas is not treated as label activation.
  return (
    <div className="block space-y-1.5">
      <span className="font-mono text-[11px] tracking-[0.18em] text-[var(--muted)] uppercase">
        {label}
      </span>
      {children}
      {hint ? <span className="block text-xs text-[var(--muted)]">{hint}</span> : null}
    </div>
  );
}

const controlClass =
  "w-full border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)]";

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
