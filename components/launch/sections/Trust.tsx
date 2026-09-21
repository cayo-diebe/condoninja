import { Container } from "@/components/launch/ui/Container";
import { Section, SectionHeading } from "@/components/launch/ui/Section";
import { Reveal } from "@/components/launch/ui/Reveal";
import {
  IconCpu,
  IconDatabase,
  IconEye,
  IconLock,
  IconScale,
  IconShield,
} from "@/components/launch/ui/icons";

const principles = [
  {
    icon: IconShield,
    title: "Independência",
    text: "Não somos administradora, não somos síndico e não vendemos serviços para o condomínio. Nosso compromisso é com quem paga a conta.",
  },
  {
    icon: IconDatabase,
    title: "Baseado em dados",
    text: "Toda observação nasce de documentos, números e comparações. Nada de achismo, nada de boato de corredor.",
  },
  {
    icon: IconScale,
    title: "Análise responsável",
    text: "Apontamos sinais e inconsistências. Não fazemos acusações. Conclusões exigem contexto e, muitas vezes, uma simples explicação.",
  },
  {
    icon: IconLock,
    title: "Segurança",
    text: "Seus documentos ficam na área restrita, associados ao seu condomínio, e não recebem links públicos.",
  },
  {
    icon: IconEye,
    title: "Transparência",
    text: "Você acompanha o que foi enviado, o que falta e o que está disponível em cada etapa do produto.",
  },
  {
    icon: IconCpu,
    title: "Tecnologia com gente",
    text: "Automação é uma ferramenta de apoio, não um veredito. Conclusões precisam de evidências e avaliação humana.",
  },
];

export function Trust() {
  return (
    <Section id="principios" tone="paper" labelledBy="principios-title">
      <Container>
        <SectionHeading
          id="principios-title"
          eyebrow="Princípios"
          tone="light"
          title="Confiar as contas do seu condomínio a alguém exige critério."
          lead="Estes são os compromissos que orientam cada análise."
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {principles.map((p, i) => (
            <Reveal as="li" key={p.title} delay={(i % 3) * 80}>
              <div className="h-full rounded-2xl border border-ink-900/10 bg-paper-50 p-6 shadow-paper">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-ink-950 text-signal-400">
                  <p.icon />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink-950">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
