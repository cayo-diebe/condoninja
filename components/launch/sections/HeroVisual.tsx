/**
 * Visual do hero: uma "análise em andamento".
 *
 * Um painel com despesas do condomínio; uma linha de varredura percorre a
 * lista e os pontos de atenção vão "acendendo". É a metáfora central da
 * marca: o ninja que encontra o que passa despercebido.
 *
 * Só CSS — nenhum JS. Respeita prefers-reduced-motion (globals.css).
 * Os valores são ilustrativos e estão rotulados como tal.
 */

type Row = {
  label: string;
  value: string;
  width: number; // % da barra
  flag?: { text: string; tone: "alert" | "signal"; delay: string };
};

const rows: Row[] = [
  { label: "Portaria e segurança", value: "41.200", width: 100 },
  {
    label: "Manutenção geral",
    value: "12.870",
    width: 31,
    flag: { text: "+38% vs. média do mercado", tone: "alert", delay: "1.4s" },
  },
  { label: "Limpeza", value: "9.400", width: 23 },
  {
    label: "Elevadores",
    value: "8.150",
    width: 20,
    flag: { text: "2 notas com o mesmo valor", tone: "alert", delay: "2.2s" },
  },
  { label: "Água e esgoto", value: "7.930", width: 19 },
  { label: "Energia", value: "6.210", width: 15 },
  {
    label: "Jardinagem",
    value: "2.980",
    width: 7,
    flag: { text: "renovado sem cotação", tone: "alert", delay: "2.9s" },
  },
];

export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      {/* Glow de fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-[radial-gradient(60%_60%_at_50%_40%,rgb(90_200_255/0.18),transparent_70%)] blur-2xl"
      />

      <figure
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-900/90 shadow-card backdrop-blur"
        aria-label="Exemplo ilustrativo de análise: lista de despesas do condomínio com pontos de atenção destacados"
      >
        {/* Cabeçalho do painel */}
        <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-activity-500" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-activity-500" />
            </span>
            <span className="text-sm font-medium text-ink-100">Analisando despesas</span>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-400">
            últimos 12 meses
          </span>
        </div>

        {/* Lista de despesas com linha de varredura */}
        <div className="relative px-4 py-2 sm:px-5">
          <div
            aria-hidden="true"
            className="animate-scan motion-hide pointer-events-none absolute inset-x-0 z-10 h-px bg-activity-500 shadow-scanner"
          />

          <ul className="divide-y divide-white/5">
            {rows.map((row) => (
              <li key={row.label} className="py-2.5 sm:py-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-ink-200">{row.label}</span>
                  <span className="shrink-0 font-mono text-ink-100">
                    <span className="text-ink-400">R$ </span>
                    {row.value}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${
                        row.flag?.tone === "alert" ? "bg-alert-500/80" : "bg-ink-400/70"
                      }`}
                      style={{ width: `${row.width}%` }}
                    />
                  </div>
                  {row.flag && (
                    <span
                      className={`animate-flag-in inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] sm:text-[11px] ${
                        row.flag.tone === "alert"
                          ? "bg-alert-500/15 text-alert-300 ring-1 ring-alert-500/30"
                          : "bg-signal-500/15 text-signal-300 ring-1 ring-signal-500/30"
                      }`}
                      style={{ animationDelay: row.flag.delay }}
                    >
                      <span
                        aria-hidden="true"
                        className={`h-1 w-1 rounded-full ${
                          row.flag.tone === "alert" ? "bg-alert-400" : "bg-signal-400"
                        }`}
                      />
                      {row.flag.text}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Rodapé: resumo */}
        <div
          className="animate-flag-in flex items-center justify-between gap-3 border-t border-white/5 bg-ink-950/60 px-4 py-3 sm:px-5"
          style={{ animationDelay: "3.6s" }}
        >
          <p className="text-sm text-ink-100">
            <span className="font-semibold text-signal-400">3 pontos de atenção</span>{" "}
            identificados nas despesas do condomínio.
          </p>
          <span className="hidden shrink-0 rounded-full bg-signal-500 px-3 py-1 text-xs font-semibold text-ink-950 sm:inline-flex">
            Raio X financeiro
          </span>
        </div>

        <figcaption className="px-4 pb-3 pt-1 font-mono text-[10px] text-ink-500 sm:px-5">
          exemplo ilustrativo · valores fictícios
        </figcaption>
      </figure>
    </div>
  );
}
