import { Container } from "@/components/launch/ui/Container";
import { Section, SectionHeading } from "@/components/launch/ui/Section";
import { Reveal } from "@/components/launch/ui/Reveal";
import { SignupAnchorButton } from "@/components/launch/ui/SignupAnchorButton";
import {
  IconBolt,
  IconCart,
  IconContract,
  IconWheelbarrow,
  IconRepeat,
  IconTrend,
  IconTruck,
  IconWrench,
} from "@/components/launch/ui/icons";

const leaks = [
  {
    icon: IconContract,
    title: "Contratos",
    text: "Portaria, limpeza, elevadores. Renovados no automático, sem cotação nova.",
  },
  {
    icon: IconWrench,
    title: "Manutenção",
    text: "Serviços repetidos, peças trocadas “de novo”, urgências que nunca acabam.",
  },
  {
    icon: IconWheelbarrow,
    title: "Obras",
    text: "Orçamento único, aditivos no meio do caminho, prazo que estica e custo que acompanha.",
  },
  {
    icon: IconTruck,
    title: "Fornecedores",
    text: "O mesmo CNPJ por anos. Preço acima do mercado passa despercebido.",
  },
  {
    icon: IconBolt,
    title: "Consumo",
    text: "Água, luz e gás fora da curva podem indicar vazamento, medição errada ou desperdício.",
  },
  {
    icon: IconRepeat,
    title: "Serviços recorrentes",
    text: "Honorários, seguros, sistemas, taxas. Valores pequenos que, somados, pesam.",
  },
  {
    icon: IconCart,
    title: "Compras",
    text: "Material em excesso, notas duplicadas, itens que ninguém viu chegar.",
  },
  {
    icon: IconTrend,
    title: "Reajustes",
    text: "Aumentos acima da inflação que ninguém questionou na assembleia.",
  },
];

export function MoneyLeaks() {
  return (
    <Section id="vazamentos" tone="ink" labelledBy="vazamentos-title">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="vazamentos-title"
            eyebrow="Onde olhar"
            title="Existe dinheiro escapando do seu condomínio?"
            lead="Nem toda variação é irregularidade. Mas, sem comparação, ninguém enxerga o que está caro. Estes são os lugares onde o desperdício costuma se esconder."
          />
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {leaks.map((item, i) => (
            <Reveal as="li" key={item.title} delay={(i % 4) * 80}>
              <div className="group h-full rounded-2xl border border-white/8 bg-ink-900 p-6 transition-colors duration-300 hover:border-signal-500/40 hover:bg-ink-800">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-signal-500/10 text-signal-400 ring-1 ring-signal-500/20 transition-colors group-hover:bg-signal-500 group-hover:text-ink-950">
                  <item.icon />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-300">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-12 flex flex-col items-start gap-5 rounded-2xl border border-white/8 bg-ink-900/60 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <p className="max-w-xl text-lg text-ink-100">
            <span className="font-semibold text-white">Toda despesa merece uma explicação.</span>{" "}
            Reúna os documentos para começar a entender como o seu condomínio funciona.
          </p>
          <SignupAnchorButton location="money-leaks" className="w-full sm:w-auto" />
        </Reveal>
      </Container>
    </Section>
  );
}
