import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isLocale, resolveLocale, type Locale } from "@/i18n/config";
import { isEditAuthenticated } from "@/lib/edit-auth";
import {
  canPersistResume,
  getResume,
  saveResume,
  saveResumes,
} from "@/lib/resume-file";
import { normalizeResume, resumeSchema, type Resume } from "@/lib/resume-schema";

function revalidateResumePages() {
  revalidatePath("/");
  revalidatePath("/edit");
  revalidatePath("/edit/review");
}

const persistMessages = {
  disk: "Saved to local resume JSON files",
  blob: "Saved. Live site and PDF will use this data now.",
  github: "Saved to GitHub. Vercel will redeploy shortly.",
  none: "Could not persist.",
} as const;

function parseResumePayload(body: unknown): {
  drafts: Partial<Record<Locale, Resume>>;
} | { error: string; status: number; issues?: unknown } {
  if (!body || typeof body !== "object") {
    return { error: "Invalid JSON body", status: 400 };
  }

  const record = body as Record<string, unknown>;

  if (record.drafts && typeof record.drafts === "object") {
    const drafts: Partial<Record<Locale, Resume>> = {};
    for (const [key, value] of Object.entries(
      record.drafts as Record<string, unknown>,
    )) {
      if (!isLocale(key)) {
        return { error: `Unknown locale: ${key}`, status: 400 };
      }
      const parsed = resumeSchema.safeParse(value);
      if (!parsed.success) {
        return {
          error: `Validation failed for locale ${key}`,
          status: 400,
          issues: parsed.error.issues,
        };
      }
      drafts[key] = normalizeResume(parsed.data);
    }

    if (Object.keys(drafts).length === 0) {
      return { error: "No valid locale drafts provided", status: 400 };
    }

    return { drafts };
  }

  // Single-locale: { locale, data } or legacy bare Resume body.
  if ("data" in record) {
    const locale = resolveLocale(
      typeof record.locale === "string" ? record.locale : undefined,
    );
    const parsed = resumeSchema.safeParse(record.data);
    if (!parsed.success) {
      return {
        error: "Validation failed",
        status: 400,
        issues: parsed.error.issues,
      };
    }
    return { drafts: { [locale]: normalizeResume(parsed.data) } };
  }

  const parsed = resumeSchema.safeParse(body);
  if (!parsed.success) {
    return {
      error: "Validation failed",
      status: 400,
      issues: parsed.error.issues,
    };
  }

  const locale = resolveLocale(
    typeof record.locale === "string" ? record.locale : undefined,
  );
  return { drafts: { [locale]: normalizeResume(parsed.data) } };
}

export async function GET(request: Request) {
  try {
    const locale = new URL(request.url).searchParams.get("locale");
    const data = await getResume(locale);

    return NextResponse.json({
      data,
      locale: resolveLocale(locale),
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

  const parsed = parseResumePayload(body);
  if ("error" in parsed) {
    return NextResponse.json(
      { error: parsed.error, issues: parsed.issues },
      { status: parsed.status },
    );
  }

  const locales = Object.keys(parsed.drafts) as Locale[];

  try {
    const result =
      locales.length === 1
        ? await saveResume(parsed.drafts[locales[0]]!, locales[0])
        : await saveResumes(parsed.drafts);

    const savedLocales =
      "locales" in result ? result.locales : [result.locale];

    if (!result.persisted) {
      return NextResponse.json({
        ok: true,
        persisted: false,
        locales: savedLocales,
        drafts: parsed.drafts,
        data: locales.length === 1 ? parsed.drafts[locales[0]] : undefined,
        message:
          "Could not persist. Configure BLOB_READ_WRITE_TOKEN, or download JSON and redeploy.",
      });
    }

    revalidateResumePages();

    return NextResponse.json({
      ok: true,
      persisted: true,
      locales: savedLocales,
      drafts: parsed.drafts,
      data: locales.length === 1 ? parsed.drafts[locales[0]] : undefined,
      message:
        savedLocales.length > 1
          ? `${persistMessages[result.target]} (${savedLocales.join(", ")})`
          : persistMessages[result.target],
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
