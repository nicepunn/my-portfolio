import { promises as fs } from "node:fs";
import path from "node:path";
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

export function canPersistResumeToDisk() {
  return process.env.VERCEL !== "1";
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
