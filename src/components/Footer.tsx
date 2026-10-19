import Image from "next/image";
import type { Resume } from "@/lib/resume-schema";

export function Footer({ data }: { data: Resume }) {
  return (
    <footer className="border-t border-[var(--border)] px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-2xl font-bold tracking-tight text-[var(--fg)]">
            {data.name}
          </p>
          <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
            Scan the QR or share this page. Prefer paper? Grab the PDF.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <a
              href={data.pdfPath}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] underline-offset-4 hover:underline"
            >
              View PDF
            </a>
            <a
              href={`mailto:${data.email}`}
              className="text-[var(--muted)] underline-offset-4 hover:text-[var(--fg)] hover:underline"
            >
              {data.email}
            </a>
            <a
              href={data.github.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--muted)] underline-offset-4 hover:text-[var(--fg)] hover:underline"
            >
              GitHub
            </a>
            <a
              href="/edit"
              className="text-[var(--muted)] underline-offset-4 hover:text-[var(--fg)] hover:underline"
            >
              Edit data
            </a>
          </div>
        </div>

        <figure className="shrink-0">
          <Image
            src="/qr/resume-qr.png"
            alt="QR code linking to this resume website"
            width={128}
            height={128}
            className="rounded-sm bg-white p-2"
          />
          <figcaption className="mt-2 text-center font-mono text-[10px] tracking-wider text-[var(--muted)] uppercase">
            Scan to open
          </figcaption>
        </figure>
      </div>
    </footer>
  );
}
