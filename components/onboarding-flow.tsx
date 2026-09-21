"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CondoForm } from "@/components/condo-form";
import { DocumentChecklist } from "@/components/document-checklist";
import type { CategoryProgress, OnboardingRecord } from "@/lib/types";
import { FormRequestError, formErrorMessage } from "@/lib/form-errors";

const steps = [
  ["welcome", "Começo"],
  ["address", "Endereço"],
  ["condominium", "Condomínio"],
  ["documents", "Documentos"],
  ["review", "Revisão"],
] as const;

export function OnboardingFlow({ initialOnboarding, initialCategories }: { initialOnboarding: OnboardingRecord; initialCategories: CategoryProgress[] }) {
  const router = useRouter();
  const [onboarding, setOnboarding] = useState(initialOnboarding);
  const [categories, setCategories] = useState(initialCategories);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const currentIndex = Math.max(0, steps.findIndex(([step]) => step === onboarding.step));

  async function moveTo(step: OnboardingRecord["step"]) {
    setError("");
    try {
      const response = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step }) });
      const payload = await response.json();
      if (!response.ok) throw new FormRequestError(payload.error ?? "Não foi possível salvar seu progresso.");
      setOnboarding(payload.onboarding);
    } catch (error) {
      setError(formErrorMessage(error, "Não foi possível salvar seu progresso. Tente novamente."));
    }
  }

  async function complete() {
    window.dispatchEvent(new Event("kondo:prepare-sound"));
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/onboarding/complete", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new FormRequestError(payload.missing?.length ? `Falta: ${payload.missing.join(", ")}.` : payload.error ?? "Ainda há pendências.");
      window.dispatchEvent(new Event("kondo:onboarding-complete"));
      router.push("/app");
      router.refresh();
    } catch (completeError) {
      setError(formErrorMessage(completeError, "Não foi possível concluir. Tente novamente."));
    } finally {
      setSaving(false);
    }
  }

  function stepIsUnlocked(index: number) {
    return index <= currentIndex;
  }

  return (
    <div className="onboarding-wrap">
      <header className="page-heading onboarding-intro"><div><span className="eyebrow">Primeiro acesso</span><h1>Vamos preparar seu Raio-X.</h1><p>Salve o progresso a cada etapa. Você pode fechar a aplicação e continuar de onde parou.</p></div></header>
      <nav className="stepper" aria-label="Progresso do onboarding">{steps.map(([step, label], index) => {
        const unlocked = stepIsUnlocked(index);
        const current = index === currentIndex;
        return <button aria-current={current ? "step" : undefined} className={`step ${current ? "active" : index < currentIndex ? "done" : ""}`} disabled={!unlocked || current || saving} key={step} onClick={() => void moveTo(step)} type="button"><span className="step-number">0{index + 1}</span>{label}{index < currentIndex && <span className="step-hint">Voltar</span>}</button>;
      })}</nav>
      <section className={`onboarding-card${onboarding.step === "documents" ? " onboarding-documents" : ""}`}>
        {onboarding.step === "welcome" && <><h2>O primeiro passo para entender seu condomínio</h2><p>Suas dúvidas são o ponto de partida. Os documentos ajudam a buscar respostas. A Condo Ninja organiza o que você envia, mostra o que falta e explica por que cada item importa — antes de qualquer conclusão.</p><ul className="info-list"><li>Entenda para onde vai o dinheiro que você paga ao condomínio.</li><li>Saiba quais gastos, contratos e decisões merecem mais atenção.</li><li>Tenha mais fundamento para fazer perguntas e cobrar transparência da gestão.</li><li>Participe das decisões com mais segurança e contribua para um condomínio mais bem cuidado.</li></ul><div className="card-actions card-actions-end"><button className="button button-primary" onClick={() => void moveTo("address")}>Começar identificação</button></div></>}
        {onboarding.step === "address" && <><h2>Endereço do condomínio</h2><p>Comece pelo CEP ou preencha o endereço manualmente. Confira os dados antes de continuar.</p><CondoForm key="address" mode="address" initial={onboarding} onSaved={setOnboarding} /></>}
        {onboarding.step === "condominium" && <><h2>Identifique o condomínio</h2><p>Informe o nome do condomínio, sua relação com ele e, se desejar, os dados complementares.</p><CondoForm key="condominium" mode="condominium" onNameSaving={setSaving} initial={onboarding} onSaved={setOnboarding} onBack={() => void moveTo("address")} /></>}
        {onboarding.step === "documents" && <><h2>Monte o pacote documental</h2><p>Comece pelo mínimo obrigatório. Os itens recomendados podem ser adicionados agora ou depois.</p><DocumentChecklist initialCategories={categories} onChanged={setCategories} /><div className="card-actions"><button className="button button-secondary" onClick={() => void moveTo("condominium")}>Voltar</button><button className="button button-primary" onClick={() => void moveTo("review")}>Revisar envio</button></div></>}
        {onboarding.step === "review" && <><h2>Revise antes de concluir</h2><p>O dashboard ficará disponível quando os três tipos obrigatórios tiverem pelo menos um arquivo confirmado.</p><div className="review-grid">{onboarding.condominium && <><div className="review-row"><span>Condomínio</span><strong>{onboarding.condominium.name}</strong></div><div className="review-row"><span>Local</span><strong>{onboarding.condominium.city} · {onboarding.condominium.state}</strong></div><div className="review-row"><span>Relação</span><strong>{onboarding.relationship}</strong></div></>}{categories.filter(category => !category.archived).map((category) => <div className="review-row" key={category.slug}><span>{category.label}</span><strong className={category.satisfied ? "" : "upload-error"}>{category.documents.length} arquivo(s) · {category.satisfied ? "recebido" : category.required ? "obrigatório" : "opcional"}</strong></div>)}</div>{error && <div className="form-error" role="alert" style={{ marginTop: 20 }}>{error}</div>}<div className="card-actions"><button className="button button-secondary" onClick={() => void moveTo("documents")}>Voltar aos documentos</button><button className="button button-primary" onClick={() => void complete()} disabled={saving}>{saving ? "Concluindo…" : "Concluir onboarding"}</button></div></>}
        {error && onboarding.step !== "review" && <div className="form-error" role="alert" style={{ marginTop: 20 }}>{error}</div>}
      </section>
    </div>
  );
}
