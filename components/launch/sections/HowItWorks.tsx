import { Container } from "@/components/launch/ui/Container";
import { Section, SectionHeading } from "@/components/launch/ui/Section";
import { Reveal } from "@/components/launch/ui/Reveal";
import { IconLayers, IconReport, IconUpload, IconUserCheck } from "@/components/launch/ui/icons";

const steps = [
  {
    icon: IconUpload,
    title: "Crie sua conta",
    text: "Cadastre seu nome, e-mail e senha para acessar um espaço próprio e continuar de onde parou.",
  },
  {
    icon: IconLayers,
    title: "Identifique seu condomínio",
    text: "Informe o endereço, o nome do condomínio e sua relação com ele. As sugestões de endereço ajudam no preenchimento.",
  },
  {
    icon: IconUserCheck,
    title: "Envie os documentos",
    text: "Comece pela convenção, um demonstrativo ou balancete e um boleto condominial. Veja também os itens recomendados e o que ainda falta.",
  },
  {
    icon: IconReport,
    title: "Acompanhe tudo em um lugar",
    text: "Conclua as boas-vindas para acessar sua visão geral, gerenciar documentos e atualizar os dados do condomínio.",
  },
];

export function HowItWorks() {
  return (
    <Section id="como-funciona" tone="deep" labelledBy="como-funciona-title" className="how-it-works">
      {/* Varredura de ponta a ponta do fundo, atrás de todo o conteúdo. */}
      <div
        aria-hidden="true"
        className="how-it-works-scanner animate-scan motion-hide pointer-events-none absolute inset-x-0 h-px bg-activity-500 shadow-scanner"
      />

      <Container className="how-it-works-content">
        <SectionHeading
          id="como-funciona-title"
          eyebrow="Como funciona"
          title="O primeiro passo para entender seu condomínio começa aqui."
          lead="A área restrita já está disponível para organizar seus documentos. As análises do Raio-X estão em desenvolvimento; enviar arquivos ainda não gera um relatório automático."
          align="center"
        />

        <div className="relative mt-14 lg:mt-20">
          <ol className="grid gap-6 lg:grid-cols-4 lg:gap-8">{steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 110} className="relative">
              <div className="how-it-works-card flex h-full flex-col rounded-2xl border border-white/8 p-6">
                <div className="flex items-center gap-4">
                  <span className="relative z-10 inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-signal-500 text-ink-950">
                    <step.icon size={24} />
                  </span>
                  <span className="font-mono text-sm text-signal-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-ink-300">{step.text}</p>
              </div>
            </Reveal>
          ))}</ol>
        </div>
      </Container>
    </Section>
  );
}
