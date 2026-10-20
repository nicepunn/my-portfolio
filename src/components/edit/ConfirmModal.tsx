"use client";

import type { ReactNode } from "react";

type ConfirmModalProps = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  pending?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
};

export function ConfirmModal({
  title,
  description,
  confirmLabel,
  cancelLabel,
  pending = false,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="edit-modal w-full max-w-md space-y-5 border border-[var(--border)] bg-[var(--bg)] p-6 shadow-xl">
        <div className="space-y-2">
          <h2
            id="confirm-modal-title"
            className="font-display text-xl font-semibold text-[var(--fg)]"
          >
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={`inline-flex h-11 items-center justify-center px-4 text-sm font-semibold transition-[opacity,transform] enabled:active:scale-[0.98] disabled:opacity-40 ${
              danger
                ? "edit-ghost edit-ghost-danger border border-red-400/40 text-red-300 enabled:hover:border-red-300 enabled:hover:text-red-200"
                : "bg-[var(--accent)] text-[var(--bg)] enabled:hover:bg-[var(--accent-bright)]"
            }`}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center px-4 text-sm text-[var(--muted)] underline-offset-4 hover:text-[var(--fg)] hover:underline disabled:opacity-40"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
