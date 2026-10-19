import { NextResponse } from "next/server";
import { isEditAuthenticated } from "@/lib/edit-auth";
import {
  canPersistResume,
  getResume,
  saveResume,
} from "@/lib/resume-file";
import { normalizeResume, resumeSchema } from "@/lib/resume-schema";

export async function GET() {
  try {
    const data = await getResume();

    return NextResponse.json({
      data,
      canPersist: canPersistResume(),
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

  try {
    const result = await saveResume(data);

    if (!result.persisted) {
      return NextResponse.json({
        ok: true,
        persisted: false,
        data,
        message:
          "Could not persist. Configure BLOB_READ_WRITE_TOKEN, or download JSON and redeploy.",
      });
    }

    const messages = {
      disk: "Saved to src/data/resume.json",
      blob: "Saved. Live site and PDF will use this data now.",
      github: "Saved to GitHub. Vercel will redeploy shortly.",
      none: "Could not persist.",
    } as const;

    return NextResponse.json({
      ok: true,
      persisted: true,
      data,
      message: messages[result.target],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to save resume",
      },
      { status: 500 },
    );
  }
}
