import { Container } from "@/components/launch/ui/Container";
import { Section, SectionHeading } from "@/components/launch/ui/Section";
import { Reveal } from "@/components/launch/ui/Reveal";
import { IconCheck } from "@/components/launch/ui/icons";

const capabilities = [
  "Cruza notas fiscais, contratos e balancetes entre si",
  "Compara períodos e detecta variações incomuns",
  "Identifica duplicidades e valores fora do padrão",
  "Compara preços com referências de mercado",
  "Traduz tudo em linguagem simples, sem contabilês",
];

const digital = [
  { title: "Envio digital", text: "Documentos pelo celular ou computador." },
  { title: "Progresso salvo", text: "Continue seu cadastro de onde parou." },
  { title: "Acesso online", text: "Acompanhe os envios na sua área restrita." },
];

export function AIAnalysis() {
  return (
    <Section id="tecnologia" tone="paper" labelledBy="tecnologia-title">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              id="tecnologia-title"
              eyebrow="Raio-X em desenvolvimento"
              tone="light"
              title="Enxergar o que passa despercebido não é sorte. É método."
              lead="Estamos construindo o próximo passo: cruzar documentos e destacar o que merece atenção. Hoje, você já pode preparar essa base na área restrita. Os recursos abaixo fazem parte dessa evolução e ainda não estão disponíveis."
            />

            <ul className="mt-8 space-y-3">
              {capabilities.map((item, i) => (
                <Reveal as="li" key={item} delay={i * 60} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal-500 text-ink-950">
                    <IconCheck size={14} />
                  </span>
                  <span className="text-base text-ink-900">{item}</span>
                </Reveal>
              ))}
            </ul>
          </div>

          {/* Anatomia de um sinal */}
          <Reveal delay={120}>
            <div className="rounded-2xl border border-ink-900/10 bg-ink-950 p-6 text-ink-100 shadow-paper sm:p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal-500">
                Exemplo do Raio-X em desenvolvimento
              </p>

              <ol className="mt-6 space-y-5">
                <li className="rounded-xl border border-white/8 bg-ink-900 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-ink-400">
                    1 · Documentos
                  </p>
                  <div className="mt-2 grid gap-2 font-mono text-sm sm:grid-cols-2">
                    <div className="rounded-lg bg-white/[0.04] px-3 py-2">
                      <span className="text-ink-400">NF 2231 · 03/mar</span>
                      <span className="float-right text-white">R$ 4.800</span>
                    </div>
                    <div className="rounded-lg bg-white/[0.04] px-3 py-2">
                      <span className="text-ink-400">NF 2298 · 15/mar</span>
                      <span className="float-right text-white">R$ 4.800</span>
                    </div>
                  </div>
                </li>

                <li className="rounded-xl border border-signal-500/30 bg-signal-500/10 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-signal-400">
                    2 · Sinal detectado pela tecnologia
                  </p>
                  <p className="mt-2 text-sm text-ink-100">
                    Mesmo fornecedor, mesmo valor, 12 dias de diferença. Descrição
                    idêntica nas duas notas.
                  </p>
                </li>

                <li className="rounded-xl border border-white/8 bg-ink-900 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-ink-400">
                    3 · Análise humana
                  </p>
                  <p className="mt-2 text-sm text-ink-100">
                    Pode ser pagamento em duplicidade. Pode ser dois serviços legítimos.
                    <span className="text-white"> A recomendação: pedir o comprovante de execução de cada um.</span>
                  </p>
                </li>
              </ol>

              <p className="mt-6 border-t border-white/8 pt-4 text-xs leading-relaxed text-ink-400">
                A tecnologia aponta sinais. A conclusão é humana. Nenhuma inconsistência
                vira acusação sem análise e contexto.
              </p>
            </div>
          </Reveal>
        </div>

        {/* 100% digital */}
        <div className="mt-16 rounded-2xl border border-ink-900/10 bg-paper-50 p-6 shadow-paper sm:p-8 lg:mt-20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-md">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal-800">
                Experiência 100% digital
              </p>
              <h3 className="mt-2 text-2xl font-bold text-ink-950">
                Sem visitas. Sem pilhas de papel. Sem reunião interminável.
              </h3>
            </div>
            <ul className="grid gap-4 sm:grid-cols-3 lg:max-w-xl">
              {digital.map((d) => (
                <li key={d.title} className="rounded-xl bg-paper-100 p-4">
                  <p className="font-semibold text-ink-950">{d.title}</p>
                  <p className="mt-1 text-sm text-ink-500">{d.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}
