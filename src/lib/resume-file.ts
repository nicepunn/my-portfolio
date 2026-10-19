import { promises as fs } from "node:fs";
import path from "node:path";
import { list, put } from "@vercel/blob";
import {
  DEFAULT_LOCALE,
  resolveLocale,
  type Locale,
} from "@/i18n/config";
import { getBundledResume } from "@/i18n/resume-locales";
import {
  normalizeResume,
  resumeSchema,
  type Resume,
} from "@/lib/resume-schema";

export const RESUME_JSON_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "resume.json",
);

export const RESUME_BLOB_PATHNAME = "resume/resume.json";
export const RESUME_GITHUB_PATH = "src/data/resume.json";

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

export async function readResumeFromDisk(): Promise<Resume> {
  const raw = await fs.readFile(RESUME_JSON_PATH, "utf8");
  return normalizeResume(resumeSchema.parse(JSON.parse(raw)));
}

export async function writeResumeToDisk(data: Resume): Promise<void> {
  if (!canPersistResumeToDisk()) {
    throw new Error("Filesystem is read-only on this host");
  }

  const normalized = normalizeResume(resumeSchema.parse(data));
  await fs.writeFile(
    RESUME_JSON_PATH,
    `${JSON.stringify(normalized, null, 2)}\n`,
    "utf8",
  );
}

async function readResumeFromBlob(): Promise<Resume | null> {
  if (!canPersistResumeToBlob()) return null;

  const { blobs } = await list({
    prefix: RESUME_BLOB_PATHNAME,
    limit: 1,
  });

  const blob = blobs[0];
  if (!blob) return null;

  const response = await fetch(blob.url, { cache: "no-store" });
  if (!response.ok) return null;

  return normalizeResume(resumeSchema.parse(await response.json()));
}

async function writeResumeToBlob(data: Resume): Promise<void> {
  if (!canPersistResumeToBlob()) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }

  const normalized = normalizeResume(resumeSchema.parse(data));
  await put(RESUME_BLOB_PATHNAME, `${JSON.stringify(normalized, null, 2)}\n`, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

async function writeResumeToGitHub(data: Resume): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) {
    throw new Error("GITHUB_TOKEN / GITHUB_REPO are not configured");
  }

  const normalized = normalizeResume(resumeSchema.parse(data));
  const content = `${JSON.stringify(normalized, null, 2)}\n`;
  const apiBase = `https://api.github.com/repos/${repo}/contents/${RESUME_GITHUB_PATH}`;

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
      message: "chore: update resume.json from /edit",
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

async function getDefaultResume(): Promise<Resume> {
  const fromBlob = await readResumeFromBlob();
  if (fromBlob) return fromBlob;

  if (canPersistResumeToDisk()) {
    try {
      return await readResumeFromDisk();
    } catch {
      return getBundledResume(DEFAULT_LOCALE);
    }
  }

  return getBundledResume(DEFAULT_LOCALE);
}

export async function getResume(localeInput?: string | null): Promise<Resume> {
  const locale: Locale = resolveLocale(localeInput);

  // Editable / persisted source of truth is the default locale only.
  if (locale === DEFAULT_LOCALE) {
    return getDefaultResume();
  }

  return getBundledResume(locale);
}

export async function saveResume(data: Resume): Promise<{
  persisted: boolean;
  target: "disk" | "blob" | "github" | "none";
}> {
  const normalized = normalizeResume(resumeSchema.parse(data));

  if (canPersistResumeToDisk()) {
    await writeResumeToDisk(normalized);
    return { persisted: true, target: "disk" };
  }

  // Prefer blob for instant live reads; GitHub keeps the repo in sync.
  if (canPersistResumeToBlob()) {
    await writeResumeToBlob(normalized);
    if (canPersistResumeToGitHub()) {
      try {
        await writeResumeToGitHub(normalized);
      } catch {
        // Blob already saved; GitHub sync is best-effort.
      }
    }
    return { persisted: true, target: "blob" };
  }

  if (canPersistResumeToGitHub()) {
    await writeResumeToGitHub(normalized);
    return { persisted: true, target: "github" };
  }

  return { persisted: false, target: "none" };
}
