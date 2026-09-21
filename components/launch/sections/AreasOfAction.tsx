import { Container } from "@/components/launch/ui/Container";
import { Section, SectionHeading } from "@/components/launch/ui/Section";
import { Reveal } from "@/components/launch/ui/Reveal";
import {
  IconContract,
  IconDatabase,
  IconLayers,
  IconReport,
  IconScale,
  IconUserCheck,
} from "@/components/launch/ui/icons";

const areas = [
  {
    icon: IconContract,
    title: "Acesso à informação",
    text: "Organizamos convenções, atas, prestações de contas, contratos e outros documentos para mostrar o que existe, o que falta e o que precisa ser esclarecido.",
  },
  {
    icon: IconReport,
    title: "Qualidade e rastreabilidade dos gastos",
    text: "Queremos ajudar a analisar despesas, fornecedores, contratos e recorrências em contexto, com referências adequadas ao condomínio e padrões que merecem investigação.",
  },
  {
    icon: IconLayers,
    title: "Prestação de contas baseada em evidências",
    text: "O objetivo é conectar cada ponto de atenção ao documento, período, valor e regra correspondente, para que os proprietários façam perguntas melhores e recebam respostas mais claras.",
  },
  {
    icon: IconScale,
    title: "Governança e participação",
    text: "Pretendemos tornar assembleias, procurações, regras e processos de decisão mais compreensíveis, ampliando a participação dos condôminos e o acesso à informação.",
  },
  {
    icon: IconUserCheck,
    title: "Mobilização para a ação coletiva",
    text: "Nossa direção é transformar informação em próximos passos: pedidos específicos de documentos, diálogo responsável, organização dos proprietários e apoio a decisões coletivas.",
  },
] as const;

export function AreasOfAction() {
  return (
    <Section id="frentes-atuacao" tone="ink" labelledBy="frentes-atuacao-title">
      <Container>
        <SectionHeading
          id="frentes-atuacao-title"
          title="Cinco frentes para uma governança condominial mais transparente"
          lead="A organização documental já é o primeiro passo. Estas frentes orientam a evolução da Condo Ninja; análises, relatórios e ferramentas de ação coletiva ainda estão em desenvolvimento."
          align="center"
        />

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-6">
          {areas.map((area, index) => (
            <Reveal
              as="li"
              key={area.title}
              delay={(index % 3) * 70}
              className={`min-w-0 lg:col-span-2 ${index === 3 ? "lg:col-start-2" : ""}`}
            >
              <article className="h-full rounded-2xl border border-white/8 bg-ink-900 p-6 shadow-card sm:p-8">
                <div className="flex items-center justify-between gap-4 text-signal-500" aria-hidden="true">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-signal-500/10">
                    <area.icon size={24} />
                  </span>
                  <span className="font-mono text-sm">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold leading-snug text-white">{area.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-ink-300">{area.text}</p>
              </article>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-10 lg:mt-12">
          <div className="flex flex-col gap-5 rounded-2xl border border-signal-500/30 bg-signal-500/10 p-6 sm:flex-row sm:items-start sm:gap-6 sm:p-8">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-signal-500/10 text-signal-500">
              <IconDatabase size={24} />
            </span>
            <div className="min-w-0">
              <h3 className="text-xl font-semibold leading-snug text-white">Tecnologia a serviço da evidência</h3>
              <p className="mt-3 text-base leading-relaxed text-ink-200">
                Nosso objetivo é usar automação e inteligência artificial para cruzar informações e destacar pontos de atenção — com rastreabilidade, revisão humana e respeito à privacidade. A organização dos documentos é a base desse trabalho.
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
