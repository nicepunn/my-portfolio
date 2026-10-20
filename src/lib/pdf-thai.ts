import type { Resume } from "@/lib/resume-schema";

/**
 * react-pdf truncates text containing Thai `ำ` (U+0E33) because layout length
 * desyncs when the glyph is normalized to `ํ` + `า`. Pre-decompose so widths
 * match and trailing characters are not dropped.
 *
 * @see https://github.com/diegomura/react-pdf/issues/3295
 */
export function normalizeThaiPdfText(text: string): string {
  return text.replaceAll("ำ", "ํา");
}

/** Deep-normalize every string in a resume payload for PDF rendering. */
export function normalizeResumeForPdf(data: Resume): Resume {
  return JSON.parse(
    JSON.stringify(data, (_key, value) =>
      typeof value === "string" ? normalizeThaiPdfText(value) : value,
    ),
  ) as Resume;
}
