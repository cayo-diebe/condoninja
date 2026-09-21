import { Header } from "@/components/launch/Header";
import { Hero } from "@/components/launch/sections/Hero";
import { HowItWorks } from "@/components/launch/sections/HowItWorks";
import { PainPoints } from "@/components/launch/sections/PainPoints";
import { MoneyLeaks } from "@/components/launch/sections/MoneyLeaks";
import { AreasOfAction } from "@/components/launch/sections/AreasOfAction";
import { AIAnalysis } from "@/components/launch/sections/AIAnalysis";
import { Discoveries } from "@/components/launch/sections/Discoveries";
import { Transformation } from "@/components/launch/sections/Transformation";
import { Trust } from "@/components/launch/sections/Trust";
import { FinalCTA } from "@/components/launch/sections/FinalCTA";
import { Footer } from "@/components/launch/Footer";
import type { Metadata } from "next";
import "./marketing.generated.css";
import "./marketing.css";

export const metadata: Metadata = {
  title: "Condo Ninja | Clareza para quem paga condomínio",
  description: "Crie sua conta, organize os documentos do seu condomínio e acompanhe o que falta. O primeiro passo para entender suas contas começa aqui.",
};

export default function HomePage() {
  return <div className="marketing-site">
    <a className="marketing-skip" href="#conteudo">Pular para o conteúdo</a>
    <Header />
    <main id="conteudo">
      <Hero /><PainPoints /><MoneyLeaks /><HowItWorks /><AreasOfAction />
      <AIAnalysis /><Discoveries /><Transformation /><Trust /><FinalCTA />
    </main>
    <Footer />
  </div>;
}
