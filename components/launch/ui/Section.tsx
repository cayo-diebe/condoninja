import type { ReactNode } from "react";

type Tone = "ink" | "deep" | "paper" | "signal";

const tones: Record<Tone, string> = {
  ink: "bg-ink-950 text-ink-100",
  deep: "bg-ink-900 text-ink-100",
  paper: "bg-paper-100 text-ink-900",
  signal: "bg-signal-500 text-ink-950",
};

/**
 * Seção com ritmo vertical consistente e tom de fundo.
 * `id` alimenta a navegação por âncoras.
 */
export function Section({
  id,
  tone = "ink",
  className = "",
  children,
  labelledBy,
}: {
  id?: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`relative py-20 sm:py-24 lg:py-32 ${tones[tone]} ${className}`}
    >
      {children}
    </section>
  );
}

/**
 * Cabeçalho padrão de seção: eyebrow + título + parágrafo de apoio.
 * O título recebe o `id` para `aria-labelledby` da seção.
 */
export function SectionHeading({
  id,
  eyebrow,
  title,
  lead,
  align = "left",
  tone = "dark",
}: {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
}) {
  const alignment = align === "center" ? "mx-auto text-center" : "";
  const eyebrowColor = tone === "dark" ? "text-signal-500" : "text-signal-800";
  const leadColor = tone === "dark" ? "text-ink-300" : "text-ink-500";

  return (
    <div className={`max-w-2xl ${alignment}`}>
      {eyebrow && (
        <p className={`font-mono text-xs uppercase tracking-[0.2em] ${eyebrowColor}`}>
          {eyebrow}
        </p>
      )}
      <h2
        id={id}
        className="mt-3 text-3xl font-bold leading-[1.1] sm:text-4xl lg:text-5xl"
      >
        {title}
      </h2>
      {lead && <p className={`mt-5 text-lg leading-relaxed ${leadColor}`}>{lead}</p>}
    </div>
  );
}
