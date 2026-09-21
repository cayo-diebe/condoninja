import Link from "next/link";
import type { UserRecord } from "@/lib/types";

type DashboardData = Awaited<ReturnType<typeof import("@/lib/repository").getDashboardData>>;

export function DashboardView({ user, data }: { user: UserRecord; data: DashboardData }) {
  const percentage = data.requiredTotal === 0 ? 0 : Math.round((data.requiredSatisfied / data.requiredTotal) * 100);
  const condominium = data.onboarding.condominium;

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <span className="eyebrow">Visão geral</span>
          <h1>Olá, {user.name.split(" ")[0]}.</h1>
          <p>{condominium?.name ?? "Seu condomínio"} · o ponto de partida do Raio-X está aqui.</p>
        </div>
        <div className="heading-actions"><Link className="button button-primary" href="/app/documents">Gerenciar documentos</Link></div>
      </header>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="status-panel">
            <div>
              <span className="status-pill pending">● Análise ainda não iniciada</span>
              <h2 style={{ marginTop: 17 }}>Prepare seu pacote inicial</h2>
              <p>Assim que os documentos mínimos estiverem recebidos, a equipe poderá começar a estruturar o Raio-X com rastreabilidade.</p>
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <div className="progress-track" aria-label={`${percentage}% dos documentos obrigatórios`}><div className="progress-value" style={{ width: `${percentage}%` }} /></div>
            <div className="progress-meta"><span>Documentos obrigatórios</span><strong>{data.requiredSatisfied} de {data.requiredTotal}</strong></div>
          </div>
          <div className="metric-grid">
            <div className="metric"><strong>{data.documentCount}</strong><span>documentos recebidos</span></div>
            <div className="metric"><strong>{data.requiredSatisfied}/{data.requiredTotal}</strong><span>itens essenciais</span></div>
            <div className="metric"><strong>Nível 0</strong><span>ponto de partida</span></div>
          </div>
        </section>

        <section className="panel">
          <h2>O que acontece agora?</h2>
          <p>O painel vai evoluir conforme novos documentos e análises forem incorporados.</p>
          <div className="locked-list">
            <div className="locked-item"><span><strong>Raio-X documental</strong><br />Aguardando análise</span><span>◌</span></div>
            <div className="locked-item"><span><strong>Financeiro e benchmarks</strong><br />Módulo futuro</span><span>🔒</span></div>
            <div className="locked-item"><span><strong>Governança e recomendações</strong><br />Módulo futuro</span><span>🔒</span></div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="status-panel">
          <div><h2>Completude por categoria</h2><p>Veja o que já está disponível e quais documentos podem aprofundar a análise.</p></div>
          <Link className="button button-secondary" href="/app/documents">Ver checklist</Link>
        </div>
        <div className="locked-list">
          {data.progress.map((category) => <div className="locked-item" key={category.slug}><span><strong>{category.label}</strong><br />{category.documents.length} arquivo(s) recebido(s)</span><span className={category.satisfied ? "status-pill" : "status-pill pending"}>{category.satisfied ? "Recebido" : category.required ? "Obrigatório" : "Recomendado"}</span></div>)}
        </div>
      </section>
    </div>
  );
}
