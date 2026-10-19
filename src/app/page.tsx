import { Extras } from "@/components/Extras";
import { Experience } from "@/components/Experience";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Projects } from "@/components/Projects";
import { Skills } from "@/components/Skills";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Hero />
      <main>
        <Experience />
        <Projects />
        <Skills />
        <Extras />
      </main>
      <Footer />
    </div>
  );
}
