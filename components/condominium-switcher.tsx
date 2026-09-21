"use client";

import { useState } from "react";
import type { listCondominiumJourneys } from "@/lib/repository";
import { FormRequestError, formErrorMessage } from "@/lib/form-errors";

export function CondominiumSwitcher({ journeys }: { journeys: Awaited<ReturnType<typeof listCondominiumJourneys>> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function select(id?: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/condominiums", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: id ? "select" : "create", id }) });
      const payload = await response.json();
      if (!response.ok) throw new FormRequestError(payload.error ?? "Não foi possível selecionar o condomínio.");
      // A full navigation clears component drafts and data from the previous context.
      window.location.assign(payload.destination);
    } catch (error) {
      setError(formErrorMessage(error, "Não foi possível selecionar o condomínio. Tente novamente."));
      setBusy(false);
    }
  }
  return <>
    {journeys.map(journey => <button type="button" className="account-condominium-card condominium-choice" key={journey.id} disabled={busy} onClick={() => void select(journey.id)} aria-label={`Selecionar ${journey.name}`}>
      <span className={`account-condominium-badge${!journey.selected && !journey.complete ? " account-condominium-badge-pending" : ""}`}>{journey.selected ? "Condomínio atual" : journey.complete ? "Cadastrado" : "Documentação pendente"}</span>
      <strong className="condominium-choice-name">{journey.name}</strong>
      <span>{[journey.address, journey.number].filter(Boolean).join(", ")}</span>
      <span>{[journey.city, journey.state].filter(Boolean).join(" · ")}</span>
    </button>)}
    <button type="button" className="account-condominium-card condominium-choice condominium-add" disabled={busy} onClick={() => void select()}><strong>+ Adicionar novo condomínio</strong></button>
    {error && <p role="alert" className="form-error">{error}</p>}
    {busy && <p role="status">Abrindo condomínio…</p>}
  </>;
}
