import { NextResponse } from "next/server";
import { resume as bundledResume } from "@/data/resume";
import { isEditAuthenticated } from "@/lib/edit-auth";
import {
  canPersistResumeToDisk,
  readResumeFromDisk,
  writeResumeToDisk,
} from "@/lib/resume-file";
import { normalizeResume, resumeSchema } from "@/lib/resume-schema";

export async function GET() {
  try {
    const data = canPersistResumeToDisk()
      ? await readResumeFromDisk()
      : bundledResume;

    return NextResponse.json({
      data,
      canPersist: canPersistResumeToDisk(),
      authenticated: await isEditAuthenticated(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to read resume",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (!(await isEditAuthenticated())) {
    return NextResponse.json(
      { error: "Unauthorized. Enter the edit password first." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = resumeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = normalizeResume(parsed.data);

  if (!canPersistResumeToDisk()) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      data,
      message:
        "Saved in memory only on this host. Download resume.json and commit it, then redeploy.",
    });
  }

  try {
    await writeResumeToDisk(data);
    return NextResponse.json({
      ok: true,
      persisted: true,
      data,
      message: "Wrote src/data/resume.json",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to write resume",
      },
      { status: 500 },
    );
  }
}
