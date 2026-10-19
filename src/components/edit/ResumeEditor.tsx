"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Resume } from "@/lib/resume-schema";
import { EditSectionNav } from "@/components/edit/EditSectionNav";
import { JsonDrivenForm } from "@/components/edit/JsonDrivenForm";
import { GhostButton } from "@/components/edit/form-ui";

type ResumeEditorProps = {
  initialData: Resume;
  canPersist: boolean;
};

function downloadJson(data: Resume) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "resume.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ResumeEditor({
  initialData,
  canPersist,
}: ResumeEditorProps) {
  const router = useRouter();
  const [data, setData] = useState<Resume>(initialData);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const persistenceHint = useMemo(() => {
    if (canPersist) {
      return "Save writes directly to src/data/resume.json on this machine.";
    }
    return "This host cannot write files. Save validates data, then download resume.json and replace src/data/resume.json before redeploying.";
  }, [canPersist]);

  function logout() {
    startTransition(async () => {
      await fetch("/api/edit-auth", { method: "DELETE" });
      router.refresh();
    });
  }

  function save() {
    setError(null);
    setStatus(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/resume", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const payload = (await response.json()) as {
          error?: string;
          message?: string;
          persisted?: boolean;
          data?: Resume;
        };

        if (!response.ok) {
          setError(payload.error ?? "Save failed");
          if (response.status === 401) {
            router.refresh();
          }
          return;
        }

        if (payload.data) {
          setData(payload.data);
        }

        setStatus(payload.message ?? "Saved");

        if (!payload.persisted) {
          downloadJson(payload.data ?? data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <div className="relative mx-auto max-w-3xl space-y-8 px-6 py-12 sm:px-10 lg:px-0 xl:max-w-3xl">
      <EditSectionNav />

      <header className="space-y-3">
        <p className="font-mono text-xs tracking-[0.25em] text-[var(--accent)] uppercase">
          Content editor
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--fg)] sm:text-4xl">
          Edit resume data
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          Form layout is driven by{" "}
          <code className="font-mono text-[var(--accent)]">src/data/edit-form.json</code>
          . Resume values live in{" "}
          <code className="font-mono text-[var(--accent)]">src/data/resume.json</code>.
        </p>
        <p className="text-xs text-[var(--muted)]">{persistenceHint}</p>
        <button
          type="button"
          onClick={logout}
          className="text-sm text-[var(--muted)] underline-offset-4 hover:text-[var(--fg)] hover:underline"
        >
          Lock editor
        </button>
      </header>

      <JsonDrivenForm data={data} onChange={setData} />

      <div className="sticky bottom-0 z-10 border-t border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_92%,transparent)] py-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="inline-flex h-11 items-center justify-center bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--bg)] transition-[opacity,transform] enabled:hover:bg-[var(--accent-bright)] enabled:active:scale-[0.98] disabled:opacity-40"
          >
            {pending ? "Saving…" : canPersist ? "Save to disk" : "Validate & download"}
          </button>
          <GhostButton onClick={() => downloadJson(data)}>Download JSON</GhostButton>
          <GhostButton
            onClick={() => {
              startTransition(async () => {
                try {
                  const response = await fetch("/api/resume/pdf", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                  });
                  if (!response.ok) {
                    const payload = (await response.json()) as { error?: string };
                    setError(payload.error ?? "PDF generation failed");
                    return;
                  }
                  const blob = await response.blob();
                  const url = URL.createObjectURL(blob);
                  window.open(url, "_blank", "noopener,noreferrer");
                  setTimeout(() => URL.revokeObjectURL(url), 60_000);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "PDF generation failed");
                }
              });
            }}
          >
            Preview PDF
          </GhostButton>
          {status ? (
            <p className="text-sm text-[var(--accent)]">{status}</p>
          ) : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
