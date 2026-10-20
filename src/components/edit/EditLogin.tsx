"use client";

import { useState, useTransition, type FormEvent } from "react";
import { LoadingOverlay } from "@/components/edit/LoadingOverlay";
import { Field, TextInput } from "@/components/edit/form-ui";

export function EditLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/edit-auth", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: password.trim() }),
        });

        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          setError(payload.error ?? "Login failed");
          return;
        }

        // Full reload so the httpOnly session cookie is picked up by the server.
        window.location.assign("/edit");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    });
  }

  return (
    <div className="edit-page mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16 sm:px-10">
      <LoadingOverlay show={pending} />
      <p className="mb-3 font-mono text-xs tracking-[0.25em] text-[var(--accent)] uppercase">
        Protected
      </p>
      <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--fg)]">
        Enter password
      </h1>
      <p className="mt-3 text-sm text-[var(--muted)]">
        This page is locked. Enter the edit password to continue.
      </p>

      <form onSubmit={submit} className="edit-card mt-8 space-y-5 border border-transparent p-5 sm:p-6">
        <Field label="Password">
          <TextInput
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            data-testid="edit-password"
          />
        </Field>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <button
          type="submit"
          data-testid="edit-unlock"
          disabled={pending || password.trim().length === 0}
          className="inline-flex h-11 w-full items-center justify-center bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--bg)] transition-[opacity,transform] enabled:hover:bg-[var(--accent-bright)] enabled:active:scale-[0.98] disabled:opacity-40"
        >
          {pending ? "Checking…" : "Unlock editor"}
        </button>
      </form>
    </div>
  );
}
