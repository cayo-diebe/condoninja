import { Container } from "@/components/launch/ui/Container";
import { Reveal } from "@/components/launch/ui/Reveal";
import { SignupEmailForm } from "@/components/launch/SignupEmailForm";
import { IconCheck } from "@/components/launch/ui/icons";
import { NinjaGridGlow } from "@/components/launch/ui/NinjaGridGlow";

const next = [
  "Organize as informações e os documentos do seu condomínio.",
  "Entenda os gastos para buscar economia sem abrir mão do que importa.",
  "Ganhe mais voz para cobrar transparência e influenciar as decisões.",
];

export function FinalCTA() {
  return <section id="comecar" tabIndex={-1} aria-labelledby="cta-title" className="marketing-final-cta relative overflow-hidden bg-ink-950 py-20 sm:py-24 lg:py-32">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_80%_50%,rgb(90_200_255/0.14),transparent_70%)]" />
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid-ink opacity-60" />
    <NinjaGridGlow />
    <Container className="marketing-cta-content relative">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal-500">Comece agora</p>
          <h2 id="cta-title" className="mt-3 text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl">Seu dinheiro merece um ninja.</h2>
          <p className="mt-5 max-w-lg text-lg text-ink-300">Seu condomínio pode ser mais transparente — e pesar menos no seu bolso. O primeiro passo é entender o que acontece com o dinheiro de todos.</p>
          <ul className="mt-8 space-y-3">{next.map(item => <li key={item} className="flex items-start gap-3 text-ink-200">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal-500/15 text-signal-400 ring-1 ring-signal-500/30"><IconCheck size={13} /></span>
            <span>{item}</span>
          </li>)}</ul>
        </Reveal>
        <Reveal delay={120}>
          <div id="raio-x-gratuito" className="marketing-start-card" tabIndex={-1} role="group" aria-label="Solicitar Raio-X gratuito">
            <SignupEmailForm />
          </div>
        </Reveal>
      </div>
    </Container>
  </section>;
}
