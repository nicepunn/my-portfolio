import { Suspense } from "react";
import { connection } from "next/server";
import { Extras } from "@/components/Extras";
import { Experience } from "@/components/Experience";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Projects } from "@/components/Projects";
import { Skills } from "@/components/Skills";
import { getResume } from "@/lib/resume-file";

async function HomeContent() {
  await connection();
  const data = await getResume();

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
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center px-6 py-24 text-sm text-[var(--muted)]">
          Loading resume…
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
