import Image from "next/image";
import { resume } from "@/data/resume";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-2xl font-bold tracking-tight text-[var(--fg)]">
            {resume.name}
          </p>
          <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
            Scan the QR or share this page. Prefer paper? Grab the PDF.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <a
              href={resume.pdfPath}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] underline-offset-4 hover:underline"
            >
              View PDF
            </a>
            <a
              href={`mailto:${resume.email}`}
              className="text-[var(--muted)] underline-offset-4 hover:text-[var(--fg)] hover:underline"
            >
              {resume.email}
            </a>
            <a
              href={resume.github.url}
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
