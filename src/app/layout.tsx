import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Noto_Sans_Thai, Outfit, Syne } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeScript } from "@/components/ThemeScript";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { LocaleScript } from "@/i18n/LocaleScript";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const notoThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://my-portfolio-two-tau-13.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070a0d" },
    { media: "(prefers-color-scheme: light)", color: "#f3f5f4" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Punnawat Lohanuit — Full-stack Developer",
    template: "%s · Punnawat Lohanuit",
  },
  description:
    "Full-stack developer who turns complex requirements into high-performance solutions. Next.js, Node.js, and more.",
  openGraph: {
    title: "Punnawat Lohanuit — Full-stack Developer",
    description:
      "Resume and selected work. Scan the QR or open this page to explore experience, projects, and skills.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Punnawat Lohanuit — Full-stack Developer",
    description:
      "Resume and selected work. Full-stack developer based in Bangkok.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${syne.variable} ${jetbrains.variable} ${notoThai.variable} h-full antialiased`}
      suppressHydrationWarning
      data-theme="dark"
      data-ui="soft"
      data-soft=""
    >
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--fg)]">
        <ThemeScript />
        <LocaleScript />
        <ThemeProvider>
          <LocaleProvider>
            <Navbar />
            {children}
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
