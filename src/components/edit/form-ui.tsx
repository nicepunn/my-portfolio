import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

/** pending = needs attention (red), resolved = fixed on target (green). */
export type FieldMark = "pending" | "resolved";

const pendingStyle = {
  borderColor: "#ef4444",
  boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.55)",
  backgroundColor: "rgba(239, 68, 68, 0.12)",
} as const;

const resolvedStyle = {
  borderColor: "#22c55e",
  boxShadow: "0 0 0 3px rgba(34, 197, 94, 0.45)",
  backgroundColor: "rgba(34, 197, 94, 0.12)",
} as const;

function markControlStyle(mark: FieldMark | undefined | false) {
  if (mark === "pending") return pendingStyle;
  if (mark === "resolved") return resolvedStyle;
  return undefined;
}

function markAccentClass(mark: FieldMark | undefined | false) {
  if (mark === "pending") return "text-red-500";
  if (mark === "resolved") return "text-emerald-500";
  return "text-[var(--muted)]";
}

function markBadgeClass(mark: FieldMark | undefined | false) {
  if (mark === "pending") return "bg-red-500 text-white";
  if (mark === "resolved") return "bg-emerald-500 text-white";
  return "";
}

function markBorderColor(mark: FieldMark | undefined | false) {
  if (mark === "pending") return "#ef4444";
  if (mark === "resolved") return "#22c55e";
  return undefined;
}

export function Field({
  label,
  children,
  hint,
  mark,
  changedLabel = "Changed",
  resolvedLabel = "Updated",
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  mark?: FieldMark | false;
  changedLabel?: string;
  resolvedLabel?: string;
}) {
  const active = mark === "pending" || mark === "resolved";
  const border = markBorderColor(mark);

  return (
    <div
      className="block space-y-1.5"
      style={
        active && border
          ? { borderLeft: `3px solid ${border}`, paddingLeft: "0.75rem" }
          : undefined
      }
    >
      <div className="flex items-center gap-2">
        <span
          className={`font-mono text-[11px] tracking-[0.18em] uppercase ${markAccentClass(mark)}`}
        >
          {label}
        </span>
        {active ? (
          <span
            className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-bold leading-none ${markBadgeClass(mark)}`}
            title={mark === "resolved" ? resolvedLabel : changedLabel}
            aria-label={mark === "resolved" ? resolvedLabel : changedLabel}
          >
            {mark === "resolved" ? "✓" : "!"}
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

export function TextInput({
  mark,
  changed = false,
  className = "",
  style,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "changed"> & {
  mark?: FieldMark | false;
  /** @deprecated Prefer `mark`. */
  changed?: boolean;
}) {
  const resolvedMark: FieldMark | false | undefined =
    mark ?? (changed ? "pending" : undefined);
  const markStyle = markControlStyle(resolvedMark);
  return (
    <input
      {...props}
      data-dirty={resolvedMark === "pending" ? "true" : undefined}
      data-mark={resolvedMark || undefined}
      style={markStyle ? { ...style, ...markStyle } : style}
      className={`${controlClass} ${className}`}
    />
  );
}

export function TextArea({
  mark,
  changed = false,
  className = "",
  style,
  ...props
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "changed"> & {
  mark?: FieldMark | false;
  /** @deprecated Prefer `mark`. */
  changed?: boolean;
}) {
  const resolvedMark: FieldMark | false | undefined =
    mark ?? (changed ? "pending" : undefined);
  const markStyle = markControlStyle(resolvedMark);
  return (
    <textarea
      {...props}
      data-dirty={resolvedMark === "pending" ? "true" : undefined}
      data-mark={resolvedMark || undefined}
      style={markStyle ? { ...style, ...markStyle } : style}
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
  "data-testid": dataTestId,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  danger?: boolean;
  "data-testid"?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      data-testid={dataTestId}
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

export function markRowBorderClass(mark: FieldMark | null | undefined) {
  if (mark === "pending") return "border-red-500/50";
  if (mark === "resolved") return "border-emerald-500/50";
  return "border-[var(--border)]";
}

export function markTextClass(mark: FieldMark | null | undefined, idle: string) {
  if (mark === "pending") return "text-red-500";
  if (mark === "resolved") return "text-emerald-500";
  return idle;
}
