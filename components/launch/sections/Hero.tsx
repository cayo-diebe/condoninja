import { Container } from '@/components/launch/ui/Container';
import { Button } from '@/components/launch/ui/Button';
import { HeroVisual } from './HeroVisual';
import { HeroGridPulses } from '@/components/launch/ui/HeroGridPulses';

const reassurance = ['Ambiente protegido', '100% digital', 'Mais poder de decisão'];

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="marketing-hero relative overflow-hidden bg-ink-950 bg-grid-ink"
    >
      {/* Vinheta para suavizar a grade nas bordas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,transparent_30%,rgb(5_11_26)_100%)]"
      />
      <HeroGridPulses />

      <Container className="marketing-hero-content relative">
        <div className="grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-28">
          <div className="marketing-hero-copy min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-signal-400">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-signal-500"
              />
              Transparência para quem paga condomínio
            </p>

            <h1
              id="hero-title"
              className="mt-6 text-[2.25rem] font-bold leading-[1.02] text-white sm:text-5xl lg:text-6xl xl:text-[4.25rem]"
            >
              Você sabe
              <br />
              <span className="mark-signal inline-block whitespace-nowrap">
                para onde vai
              </span>
              <br />
              o dinheiro do seu condomínio?
            </h1>

            <p className="marketing-hero-description mt-6 max-w-xl text-lg leading-relaxed text-ink-300 sm:text-xl">
              Todo mês, parte do seu dinheiro vira taxa de condomínio. A Condo
              Ninja ajuda você a reunir os documentos e enxergar o que falta
              para fazer perguntas melhores sobre as contas e decisões do seu condomínio.
              <span className="block text-ink-100">
                Clareza começa com informação organizada.
              </span>
            </p>

            <div className="marketing-hero-actions mt-8 flex flex-col flex-wrap gap-3 sm:flex-row sm:items-center">
              <Button
                as="a"
                href="/cadastro"
                size="lg"
                className="w-full sm:w-auto"
              >
                Quero meu Raio-X gratuito
              </Button>
              <Button
                as="a"
                href="/#como-funciona"
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Ver como funciona
              </Button>
            </div>

            <p className="marketing-note">Já tem uma conta? <a href="/login" className="text-signal-400 underline">Entrar na área restrita</a></p>

            <ul className="marketing-hero-benefits mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-400">
              {reassurance.map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-1 w-1 rounded-full bg-ink-500"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 animate-float lg:pl-4">
            <HeroVisual />
          </div>
        </div>
      </Container>
    </section>
  );
}
