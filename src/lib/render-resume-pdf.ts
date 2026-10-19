import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { ResumePdfDocument } from "@/lib/resume-pdf";
import type { Resume } from "@/lib/resume-schema";

export async function renderResumePdf(data: Resume) {
  const element = createElement(ResumePdfDocument, {
    data,
  }) as ReactElement<DocumentProps>;
  const buffer = await renderToBuffer(element);
  return Buffer.from(buffer);
}
