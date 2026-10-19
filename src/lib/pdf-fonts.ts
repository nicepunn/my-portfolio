import path from "node:path";
import { Font } from "@react-pdf/renderer";

let registered = false;

/** Sarabun covers Latin + Thai (Helvetica cannot render Thai). */
export function ensurePdfFonts() {
  if (registered) return;

  const dir = path.join(process.cwd(), "public", "fonts");

  Font.register({
    family: "Sarabun",
    fonts: [
      {
        src: path.join(dir, "Sarabun-Regular.ttf"),
        fontWeight: 400,
      },
      {
        src: path.join(dir, "Sarabun-Bold.ttf"),
        fontWeight: 700,
      },
    ],
  });

  // Keep Thai clusters intact (default hyphenation can break syllables).
  Font.registerHyphenationCallback((word) => [word]);

  registered = true;
}
