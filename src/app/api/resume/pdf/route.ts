import { NextResponse } from "next/server";
import { getResume } from "@/lib/resume-file";
import { renderResumePdf } from "@/lib/render-resume-pdf";
import { normalizeResume, resumeSchema } from "@/lib/resume-schema";

function pdfResponse(buffer: Buffer, filename = "punnawat-resume.pdf") {
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  try {
    const data = await getResume();
    const buffer = await renderResumePdf(data);
    return pdfResponse(buffer);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate PDF",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resumeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const data = normalizeResume(parsed.data);
    const buffer = await renderResumePdf(data);
    return pdfResponse(buffer);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate PDF",
      },
      { status: 500 },
    );
  }
}
