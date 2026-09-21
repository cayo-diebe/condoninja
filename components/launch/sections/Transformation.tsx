import { Container } from "@/components/launch/ui/Container";
import { Section } from "@/components/launch/ui/Section";
import { Reveal } from "@/components/launch/ui/Reveal";
import { CtaButton } from "@/components/launch/ui/CtaButton";

export function Transformation() {
  return (
    <Section id="transformacao" tone="signal" labelledBy="transformacao-title">
      <Container>
        <h2 id="transformacao-title" className="sr-only">
          A transformação que a Condo Ninja propõe
        </h2>

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          <Reveal>
            <div className="flex h-full flex-col rounded-2xl border border-ink-950/15 bg-signal-400/40 p-7 sm:p-10">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-950/60">
                Antes
              </p>
              <blockquote className="mt-4 text-2xl font-semibold leading-tight text-ink-950/70 sm:text-3xl">
                &ldquo;Eu pago o boleto e torço para estar tudo certo.&rdquo;
              </blockquote>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="flex h-full flex-col rounded-2xl bg-ink-950 p-7 text-white shadow-[0_30px_60px_-30px_rgb(5_11_26/0.6)] sm:p-10">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal-500">
                Nosso objetivo
              </p>
              <blockquote className="mt-4 text-2xl font-semibold leading-tight sm:text-3xl">
                &ldquo;Eu entendo para onde meu dinheiro vai.{" "}
                <span className="text-signal-400">Eu tenho opinião.</span>&rdquo;
              </blockquote>
            </div>
          </Reveal>
        </div>

        <Reveal
          delay={250}
          className="mt-10 flex flex-col items-start gap-6 lg:mt-14 lg:flex-row lg:items-center lg:justify-between"
        >
          <p className="max-w-2xl text-xl font-medium leading-snug text-ink-950 sm:text-2xl">
            O propósito da Condo Ninja é dar{" "}
            <span className="font-bold">clareza sobre o seu dinheiro</span> e mais fundamento para
            participar das decisões do seu condomínio.
          </p>
          <CtaButton
            location="transformation"
            variant="secondary"
            className="w-full border-ink-950/30 bg-ink-950 text-white hover:border-ink-950 hover:bg-ink-900 sm:w-auto"
          />
        </Reveal>
      </Container>
    </Section>
  );
}
