import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "public", "qr");
const outFile = path.join(outDir, "resume-qr.png");

const siteUrl =
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://my-portfolio-two-tau-13.vercel.app";

fs.mkdirSync(outDir, { recursive: true });

await QRCode.toFile(outFile, siteUrl, {
  type: "png",
  width: 512,
  margin: 2,
  errorCorrectionLevel: "M",
  color: {
    dark: "#070a0d",
    light: "#ffffff",
  },
});

console.log(`QR written → ${outFile}`);
console.log(`Target URL → ${siteUrl}`);
