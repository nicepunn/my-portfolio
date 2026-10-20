import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { ensurePdfFonts } from "@/lib/pdf-fonts";
import { normalizeResumeForPdf } from "@/lib/pdf-thai";
import { ResumePdfDocument } from "@/lib/resume-pdf";
import type { Resume } from "@/lib/resume-schema";

export async function renderResumePdf(data: Resume) {
  ensurePdfFonts();
  const element = createElement(ResumePdfDocument, {
    data: normalizeResumeForPdf(data),
  }) as ReactElement<DocumentProps>;
  const buffer = await renderToBuffer(element);
  return Buffer.from(buffer);
}
