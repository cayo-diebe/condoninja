import { Container } from "@/components/launch/ui/Container";
import { Section, SectionHeading } from "@/components/launch/ui/Section";
import { Reveal } from "@/components/launch/ui/Reveal";
import { DiscoveryCard } from "@/components/launch/ui/DiscoveryCard";

const discoveries = [
  { title: "Gastos fora do padrão", text: "Valores que destoam do histórico do próprio condomínio." },
  { title: "Custos que subiram demais", text: "Aumentos acima da inflação ou sem justificativa clara." },
  { title: "Fornecedores mais caros que o mercado", text: "Comparação com referências de preço para serviços parecidos." },
  { title: "Pagamentos em duplicidade", text: "Notas, boletos e transferências repetidas." },
  { title: "Contratos que merecem revisão", text: "Renovações automáticas, cláusulas caras, escopo mal definido." },
  { title: "Despesas difíceis de justificar", text: "Lançamentos sem documento, sem descrição ou sem sentido." },
  { title: "Oportunidades de economia", text: "Onde uma cotação nova pode fazer diferença na taxa." },
  { title: "As perguntas certas", text: "Para levar à próxima assembleia, com dados na mão." },
];

export function Discoveries() {
  return (
    <Section id="descobertas" tone="ink" labelledBy="descobertas-title">
      <Container>
        <SectionHeading
          id="descobertas-title"
          eyebrow="O que queremos ajudar você a descobrir"
          title="Menos achismo. Mais dados na mão."
          lead="Estas são as perguntas que orientam o desenvolvimento do Raio-X. Hoje, comece reunindo as informações necessárias para buscar essas respostas."
        />

        <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/8 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {discoveries.map((d, i) => (
            <Reveal as="li" key={d.title} delay={(i % 4) * 70} className="bg-ink-950">
              <DiscoveryCard title={d.title} text={d.text} index={i} />
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
