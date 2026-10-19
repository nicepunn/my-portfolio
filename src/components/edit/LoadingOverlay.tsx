"use client";

export function LoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-white/25 border-t-white"
        aria-hidden
      />
      <span className="sr-only">Loading</span>
    </div>
  );
}
