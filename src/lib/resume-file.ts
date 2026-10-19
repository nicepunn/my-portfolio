import { promises as fs } from "node:fs";
import path from "node:path";
import { list, put } from "@vercel/blob";
import {
  DEFAULT_LOCALE,
  isLocale,
  resolveLocale,
  type Locale,
} from "@/i18n/config";
import { getBundledResume } from "@/i18n/resume-locales";
import {
  normalizeResume,
  resumeSchema,
  type Resume,
} from "@/lib/resume-schema";

export type ResumePersistTarget = "disk" | "blob" | "github" | "none";

export type ResumePaths = {
  disk: string;
  blob: string;
  github: string;
};

/** Stable path helpers for the default locale (kept for callers/tests). */
export const RESUME_JSON_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "resume.json",
);
export const RESUME_BLOB_PATHNAME = "resume/resume.json";
export const RESUME_GITHUB_PATH = "src/data/resume.json";

export function getResumePaths(localeInput?: string | null): ResumePaths {
  const locale = resolveLocale(localeInput);

  if (locale === DEFAULT_LOCALE) {
    return {
      disk: RESUME_JSON_PATH,
      blob: RESUME_BLOB_PATHNAME,
      github: RESUME_GITHUB_PATH,
    };
  }

  return {
    disk: path.join(
      process.cwd(),
      "src",
      "data",
      "locales",
      locale,
      "resume.json",
    ),
    blob: `resume/${locale}/resume.json`,
    github: `src/data/locales/${locale}/resume.json`,
  };
}

export function canPersistResumeToDisk() {
  return process.env.VERCEL !== "1";
}

export function canPersistResumeToBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function canPersistResumeToGitHub() {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

export function canPersistResume() {
  return (
    canPersistResumeToDisk() ||
    canPersistResumeToBlob() ||
    canPersistResumeToGitHub()
  );
}

export async function readResumeFromDisk(
  localeInput?: string | null,
): Promise<Resume> {
  const { disk } = getResumePaths(localeInput);
  const raw = await fs.readFile(/*turbopackIgnore: true*/ disk, "utf8");
  return normalizeResume(resumeSchema.parse(JSON.parse(raw)));
}

export async function writeResumeToDisk(
  data: Resume,
  localeInput?: string | null,
): Promise<void> {
  if (!canPersistResumeToDisk()) {
    throw new Error("Filesystem is read-only on this host");
  }

  const locale = resolveLocale(localeInput);
  const { disk } = getResumePaths(locale);
  const normalized = normalizeResume(resumeSchema.parse(data));
  await fs.mkdir(/*turbopackIgnore: true*/ path.dirname(disk), {
    recursive: true,
  });
  await fs.writeFile(
    /*turbopackIgnore: true*/ disk,
    `${JSON.stringify(normalized, null, 2)}\n`,
    "utf8",
  );
}

async function readResumeFromBlob(
  localeInput?: string | null,
): Promise<Resume | null> {
  if (!canPersistResumeToBlob()) return null;

  const { blob: blobPath } = getResumePaths(localeInput);
  const { blobs } = await list({
    prefix: blobPath,
    limit: 1,
  });

  const blob = blobs[0];
  if (!blob) return null;

  const response = await fetch(blob.url, { cache: "no-store" });
  if (!response.ok) return null;

  return normalizeResume(resumeSchema.parse(await response.json()));
}

async function writeResumeToBlob(
  data: Resume,
  localeInput?: string | null,
): Promise<void> {
  if (!canPersistResumeToBlob()) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }

  const { blob: blobPath } = getResumePaths(localeInput);
  const normalized = normalizeResume(resumeSchema.parse(data));
  await put(blobPath, `${JSON.stringify(normalized, null, 2)}\n`, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

async function writeResumeToGitHub(
  data: Resume,
  localeInput?: string | null,
): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) {
    throw new Error("GITHUB_TOKEN / GITHUB_REPO are not configured");
  }

  const locale = resolveLocale(localeInput);
  const { github } = getResumePaths(locale);
  const normalized = normalizeResume(resumeSchema.parse(data));
  const content = `${JSON.stringify(normalized, null, 2)}\n`;
  const apiBase = `https://api.github.com/repos/${repo}/contents/${github}`;

  const current = await fetch(apiBase, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  let sha: string | undefined;
  if (current.ok) {
    const payload = (await current.json()) as { sha?: string };
    sha = payload.sha;
  } else if (current.status !== 404) {
    throw new Error(`GitHub read failed (${current.status})`);
  }

  const response = await fetch(apiBase, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      message: `chore: update resume.json (${locale}) from /edit`,
      content: Buffer.from(content, "utf8").toString("base64"),
      sha,
      branch: process.env.GITHUB_BRANCH || "main",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub save failed (${response.status}): ${detail}`);
  }
}

export async function getResume(localeInput?: string | null): Promise<Resume> {
  const locale: Locale = resolveLocale(localeInput);

  const fromBlob = await readResumeFromBlob(locale);
  if (fromBlob) return fromBlob;

  if (canPersistResumeToDisk()) {
    try {
      return await readResumeFromDisk(locale);
    } catch {
      return getBundledResume(locale);
    }
  }

  return getBundledResume(locale);
}

export async function saveResume(
  data: Resume,
  localeInput?: string | null,
): Promise<{
  persisted: boolean;
  target: ResumePersistTarget;
  locale: Locale;
}> {
  const locale = resolveLocale(localeInput);
  const normalized = normalizeResume(resumeSchema.parse(data));

  if (canPersistResumeToDisk()) {
    await writeResumeToDisk(normalized, locale);
    return { persisted: true, target: "disk", locale };
  }

  // Prefer blob for instant live reads; GitHub keeps the repo in sync.
  if (canPersistResumeToBlob()) {
    await writeResumeToBlob(normalized, locale);
    if (canPersistResumeToGitHub()) {
      try {
        await writeResumeToGitHub(normalized, locale);
      } catch {
        // Blob already saved; GitHub sync is best-effort.
      }
    }
    return { persisted: true, target: "blob", locale };
  }

  if (canPersistResumeToGitHub()) {
    await writeResumeToGitHub(normalized, locale);
    return { persisted: true, target: "github", locale };
  }

  return { persisted: false, target: "none", locale };
}

export async function saveResumes(
  drafts: Partial<Record<Locale, Resume>>,
): Promise<{
  persisted: boolean;
  target: ResumePersistTarget;
  locales: Locale[];
}> {
  const entries = Object.entries(drafts).filter(
    (entry): entry is [Locale, Resume] =>
      isLocale(entry[0]) && entry[1] != null,
  );

  if (entries.length === 0) {
    return { persisted: false, target: "none", locales: [] };
  }

  let target: ResumePersistTarget = "none";
  let persisted = false;
  const locales: Locale[] = [];

  for (const [locale, data] of entries) {
    const result = await saveResume(data, locale);
    locales.push(locale);
    if (result.persisted) {
      persisted = true;
      target = result.target;
    }
  }

  return { persisted, target, locales };
}
