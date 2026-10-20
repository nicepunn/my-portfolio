import { Suspense } from "react";
import { connection } from "next/server";
import { Extras } from "@/components/Extras";
import { Experience } from "@/components/Experience";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { MobileDock } from "@/components/MobileDock";
import { Projects } from "@/components/Projects";
import { Skills } from "@/components/Skills";
import { getRequestLocale } from "@/i18n/get-request-locale";
import { getMessages } from "@/i18n/messages";
import { getResume } from "@/lib/resume-file";

async function HomeContent() {
  await connection();
  const locale = await getRequestLocale();
  const data = await getResume(locale);

  return (
    <div className="flex flex-1 flex-col">
      <Hero data={data} />
      <main>
        <Experience data={data} />
        <Projects data={data} />
        <Skills data={data} />
        <Extras data={data} />
      </main>
      <Footer data={data} />
      <MobileDock data={data} />
    </div>
  );
}

function HomeFallback() {
  const messages = getMessages("en");
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24 text-sm text-[var(--muted)]">
      {messages.common.loadingResume}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}
