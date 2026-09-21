import { Container } from "@/components/launch/ui/Container";
import { Section, SectionHeading } from "@/components/launch/ui/Section";
import { Reveal } from "@/components/launch/ui/Reveal";
import { PainPointCards } from "@/components/launch/ui/PainPointCards";

const questions = [
  {
    q: "A taxa subiu de novo.",
    a: "E ninguém explicou direito por quê.",
  },
  {
    q: "Você recebe o balancete todo mês.",
    a: "Mas ele parece escrito para contador.",
  },
  {
    q: "Aquela obra custou uma fortuna.",
    a: "Era o preço de mercado? Alguém comparou?",
  },
  {
    q: "O mesmo fornecedor há anos.",
    a: "Renovado no automático, sem cotação.",
  },
  {
    q: "Você desconfia de algo.",
    a: "Mas não sabe nem por onde começar a perguntar.",
  },
];

export function PainPoints() {
  return (
    <Section id="problema" tone="paper" labelledBy="problema-title">
      <Container>
        <SectionHeading
          id="problema-title"
          eyebrow="Isso parece familiar?"
          tone="light"
          title="Você paga. Recebe documentos. E continua sem entender."
          lead="Ter acesso à prestação de contas não é o mesmo que entender o que ela diz. É nessa diferença que o dinheiro se perde."
        />

        <PainPointCards>
          {questions.map((item, i) => (
            <Reveal as="li" key={item.q} delay={i * 70}>
              <div className="pain-point-card group flex h-full flex-col rounded-2xl border border-ink-900/10 bg-paper-50 p-6 shadow-paper transition-transform duration-300 hover:-translate-y-0.5">
                <span className="font-mono text-xs text-signal-800">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-3 text-xl font-semibold leading-snug text-ink-950">
                  {item.q}
                </p>
                <p className="mt-2 text-base text-ink-500">{item.a}</p>
              </div>
            </Reveal>
          ))}

          <Reveal as="li" delay={5 * 70}>
            <div className="flex h-full flex-col justify-center rounded-2xl bg-ink-950 p-6 text-ink-100 shadow-paper">
              <p className="text-xl font-semibold leading-snug text-white">
                Se você respondeu &ldquo;sim&rdquo; a qualquer uma delas, o problema não é
                você.
              </p>
              <p className="mt-2 text-base text-ink-300">
                É a falta de alguém do seu lado para ler os números.
              </p>
            </div>
          </Reveal>
        </PainPointCards>
      </Container>
    </Section>
  );
}
